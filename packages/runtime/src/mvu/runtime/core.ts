/**
 * Runtime Core
 *
 * The main runtime class implementation
 */

import { Effect, Queue, Fiber, Ref, FiberRef, Layer, Context, Duration, Stream } from 'effect'
import type { Component, View, Update, Command } from '@tuix/core/types'
import { TerminalService, InputService, RendererService } from '@tuix/core/services'
import { KeyUtils } from '@tuix/input/keyboard'
import { bindMvuPush, emitKeyToHandlers, clearKeyHandlers } from '@tuix/reactive'
import type { RuntimeConfig, RuntimeState, SystemMsg, RuntimeMetrics } from './types'
import { RuntimeError } from './types'
import { FrameScheduler, TimerManager, CommandScheduler } from './scheduler'
import { SubscriptionManager } from './subscriptions'
import type { RuntimeHooks } from '../../hooks'

/**
 * Apply onMessage hook chain. Returns null if the message was cancelled.
 * Exported for unit testing without a full Runtime.
 */
export function applyOnMessageHook<Msg>(
  hooks: RuntimeHooks<unknown, Msg> | undefined,
  msg: Msg
): Effect.Effect<Msg | null> {
  if (!hooks?.onMessage) {
    return Effect.succeed(msg)
  }
  return hooks.onMessage(msg)
}

/**
 * The main runtime class that orchestrates the MVU loop
 */
export class Runtime<Model, Msg> {
  private readonly config: Required<RuntimeConfig>
  private readonly state: Ref.Ref<RuntimeState<Model>>
  private readonly messageQueue: Queue.Queue<SystemMsg<Msg>>
  private readonly frameScheduler: FrameScheduler<Msg>
  private readonly timerManager: TimerManager<Msg>
  private readonly commandScheduler: CommandScheduler<Msg>
  private readonly subscriptionManager: SubscriptionManager<Model, Msg>
  private readonly hooks?: RuntimeHooks<Model, Msg>

  /** Stored from run() so subscriptions can re-evaluate after model updates */
  private subscriptionsFn?: (
    model: Model
  ) => ReadonlyArray<import('@tuix/core/types').Subscription<Msg>> | undefined | null

  // Fibers for concurrent operations
  private inputFiber?: Fiber.RuntimeFiber<void>
  private updateFiber?: Fiber.RuntimeFiber<void>
  private renderFiber?: Fiber.RuntimeFiber<void>
  /** Consecutive render failures (success resets). Stops app after maxRenderErrors. */
  private consecutiveRenderErrors = 0
  private readonly maxRenderErrors = 5
  private hasRendered: boolean = false
  private screenReady: boolean = false
  private dirty: boolean = true

  constructor(
    config: RuntimeConfig,
    state: Ref.Ref<RuntimeState<Model>>,
    messageQueue: Queue.Queue<SystemMsg<Msg>>
  ) {
    // Apply defaults to config
    this.config = {
      fps: config.fps ?? 60,
      enableMouse: config.enableMouse ?? false,
      fullscreen: config.fullscreen ?? true,
      debug: config.debug ?? false,
      messageBufferSize: config.messageBufferSize ?? 1000,
      updateTimeout: config.updateTimeout ?? Duration.seconds(5),
      commandTimeout: config.commandTimeout ?? Duration.seconds(30),
      maxConcurrentCommands: config.maxConcurrentCommands ?? 10,
      performanceMonitoring: config.performanceMonitoring ?? false,
      exitAfterRender: config.exitAfterRender ?? false,
      onError: config.onError,
      onQuit: config.onQuit,
      context: config.context,
      hooks: config.hooks,
    }

    this.state = state
    this.messageQueue = messageQueue
    this.hooks = config.hooks
    this.frameScheduler = new FrameScheduler(this.config.fps)
    this.timerManager = new TimerManager(messageQueue)
    this.commandScheduler = new CommandScheduler(messageQueue, this.config.maxConcurrentCommands)
    this.subscriptionManager = new SubscriptionManager(messageQueue, this.hooks)
  }

  /**
   * Run a component
   */
  run<E>(component: Component<Model, Msg, E>): Effect<void, E | RuntimeError> {
    return Effect.gen(
      function* (_) {
        const terminal = yield* _(TerminalService)
        const input = yield* _(InputService)
        const renderer = yield* _(RendererService)

        try {
          // Initialize terminal
          if (this.config.fullscreen) {
            yield* _(terminal.setAlternateScreen(true))
          }
          yield* _(terminal.hideCursor)
          yield* _(terminal.clear)

          if (this.config.enableMouse) {
            yield* _(input.enableMouse)
          }

          // Call beforeInit hook
          if (this.hooks?.beforeInit) {
            yield* _(this.hooks.beforeInit())
          }

          // Initialize component
          const [initialModel, initialCommands] = yield* _(component.init)

          yield* _(
            Ref.update(this.state, state => ({
              ...state,
              model: initialModel,
              isRunning: true,
            }))
          )

          // Call afterInit hook
          if (this.hooks?.afterInit) {
            yield* _(this.hooks.afterInit(initialModel))
          }

          // Named $state.$set → UserMsg { type: 'set', key, value }
          bindMvuPush(msg => {
            Effect.runFork(
              Queue.offer(this.messageQueue, {
                _tag: 'UserMsg' as const,
                msg: msg as Msg,
              })
            )
          })

          // Execute initial commands
          yield* _(this.executeCommands(initialCommands))

          // Start concurrent fibers
          yield* _(this.startFibers(component))

          // Wait for quit signal
          yield* _(this.waitForQuit())
        } finally {
          bindMvuPush(null)
          clearKeyHandlers()
          // Cleanup
          yield* _(this.cleanup(terminal))
        }
      }.bind(this)
    )
  }

  /**
   * Start the concurrent fibers for input, update, and render
   */
  private startFibers<E>(component: Component<Model, Msg, E>): Effect<void, E | RuntimeError> {
    return Effect.gen(
      function* (_) {
        // Start input fiber
        this.inputFiber = yield* _(this.createInputFiber().pipe(Effect.fork))

        // Start update fiber
        this.updateFiber = yield* _(this.createUpdateFiber(component.update).pipe(Effect.fork))

        // Start render fiber
        this.renderFiber = yield* _(this.createRenderFiber(component.view).pipe(Effect.fork))

        // Start subscriptions (and keep fn for re-evaluation after updates).
        // onSubscription is invoked from SubscriptionManager.addSubscription for each sub.
        if (component.subscriptions) {
          this.subscriptionsFn = component.subscriptions as typeof this.subscriptionsFn
          yield* _(
            this.subscriptionManager.start(
              model => {
                const result = component.subscriptions!(model)
                return (result ?? []) as ReadonlyArray<import('@tuix/core/types').Subscription<Msg>>
              },
              () => Effect.map(Ref.get(this.state), s => s.model)
            )
          )
        }
      }.bind(this)
    )
  }

  /**
   * Create the input processing fiber — drains InputService streams into the message queue.
   */
  private createInputFiber(): Effect<void, RuntimeError> {
    return Effect.gen(
      function* (_) {
        const input = yield* _(InputService)

        const runKeys = Stream.runForEach(input.keyEvents, key =>
          Queue.offer(this.messageQueue, { _tag: 'KeyPress' as const, key })
        )
        const runResize = Stream.runForEach(input.resizeEvents, size =>
          Queue.offer(this.messageQueue, {
            _tag: 'WindowResize' as const,
            width: size.width,
            height: size.height,
          })
        )
        const runMouse = this.config.enableMouse
          ? Stream.runForEach(input.mouseEvents, ev => {
              if (ev.type === 'motion' || (ev as { type?: string }).type === 'move') {
                return Queue.offer(this.messageQueue, {
                  _tag: 'MouseMove' as const,
                  x: ev.x,
                  y: ev.y,
                })
              }
              return Queue.offer(this.messageQueue, {
                _tag: 'MouseClick' as const,
                x: ev.x,
                y: ev.y,
                button:
                  typeof (ev as { button?: unknown }).button === 'number'
                    ? (ev as { button: number }).button
                    : 0,
              })
            })
          : Effect.void

        // Run until fibers interrupted on shutdown
        yield* _(Effect.all([runKeys, runResize, runMouse], { concurrency: 'unbounded' }))
      }.bind(this)
    ).pipe(
      Effect.catchAll(error => Effect.fail(new RuntimeError('Input fiber failed', 'input', error)))
    )
  }

  /**
   * Create the update processing fiber
   */
  private createUpdateFiber(update: Update<Model, Msg>): Effect<void, RuntimeError> {
    return Effect.gen(
      function* (_) {
        while (true) {
          const msg = yield* _(Queue.take(this.messageQueue))

          try {
            yield* _(this.processMessage(msg, update))
          } catch (error) {
            if (this.config.onError) {
              yield* _(this.config.onError(error))
            } else {
              yield* _(Effect.logError('Update error', error))
            }
            // Also invoke hooks.onError when present
            if (this.hooks?.onError) {
              yield* _(this.hooks.onError(error, 'update'))
            }
          }

          const state = yield* _(Ref.get(this.state))
          if (!state.isRunning) break
        }
      }.bind(this)
    ).pipe(
      Effect.catchAll(error =>
        Effect.fail(new RuntimeError('Update fiber failed', 'update', error))
      )
    )
  }

  /**
   * Create the render fiber
   */
  private createRenderFiber(view: (model: Model) => View): Effect<void, RuntimeError> {
    return Effect.gen(
      function* (_) {
        const renderer = yield* _(RendererService)
        const terminal = yield* _(TerminalService)

        while (true) {
          const startTime = Date.now()

          const state = yield* _(Ref.get(this.state))
          if (!state.isRunning) break

          if (!this.dirty && this.screenReady) {
            yield* _(this.frameScheduler.waitForNextFrame())
            continue
          }
          this.dirty = false

          const frame = Effect.gen(
            function* (_) {
              if (this.hooks?.beforeRender) {
                yield* _(this.hooks.beforeRender(state.model))
              }

              const viewResultOrPromise = view(state.model)
              const viewResult =
                viewResultOrPromise instanceof Promise
                  ? yield* _(Effect.promise(() => viewResultOrPromise))
                  : viewResultOrPromise

              const asView: View =
                typeof viewResult === 'string'
                  ? { render: () => Effect.succeed(viewResult) }
                  : viewResult && typeof (viewResult as { render?: unknown }).render === 'function'
                    ? (viewResult as View)
                    : {
                        render: () =>
                          Effect.succeed(
                            String(
                              (viewResult as { props?: { children?: unknown } })?.props?.children ??
                                (viewResult as { type?: { name?: string } })?.type?.name ??
                                '[view]'
                            )
                          ),
                      }

              if (!this.screenReady) {
                yield* _(terminal.clear)
                this.screenReady = true
              }

              yield* _(renderer.beginFrame)
              yield* _(renderer.render(asView))
              yield* _(renderer.endFrame)

              if (this.hooks?.afterRender) {
                yield* _(this.hooks.afterRender(viewResult, state.model))
              }

              this.consecutiveRenderErrors = 0
              const renderTime = Date.now() - startTime
              yield* _(
                Ref.update(this.state, s => ({
                  ...s,
                  frameCount: s.frameCount + 1,
                  lastRenderTime: renderTime,
                }))
              )

              if (this.config.performanceMonitoring) {
                yield* _(
                  Queue.offer(this.messageQueue, {
                    _tag: 'RenderComplete',
                    duration: renderTime,
                  })
                )
              }

              if (this.config.exitAfterRender && !this.hasRendered) {
                this.hasRendered = true
                yield* _(Ref.update(this.state, s => ({ ...s, isRunning: false })))
              }
            }.bind(this)
          ).pipe(
            Effect.catchAll(error => this.handleRenderFailure(error)),
            // TypeError from missing render() is a Die, not Fail — must catch defects too
            Effect.catchAllDefect(error => this.handleRenderFailure(error))
          )

          yield* _(frame)

          const after = yield* _(Ref.get(this.state))
          if (!after.isRunning) break

          // Wait for next frame
          yield* _(this.frameScheduler.waitForNextFrame())
        }
      }.bind(this)
    ).pipe(
      Effect.catchAll(error =>
        Effect.fail(new RuntimeError('Render fiber failed', 'render', error))
      )
    )
  }

  private handleRenderFailure(error: unknown): Effect.Effect<void> {
    return Effect.gen(
      function* (_) {
        this.consecutiveRenderErrors++
        yield* _(Effect.logError('Render error', error))

        if (this.hooks?.onError) {
          yield* _(this.hooks.onError(error, 'render'))
        }

        if (this.consecutiveRenderErrors >= this.maxRenderErrors || this.config.exitAfterRender) {
          if (this.consecutiveRenderErrors >= this.maxRenderErrors) {
            console.error(
              `[MVU Runtime] ${this.consecutiveRenderErrors} consecutive render errors — stopping`
            )
          }
          yield* _(Ref.update(this.state, s => ({ ...s, isRunning: false })))
        }
      }.bind(this)
    )
  }

  /**
   * Process a system message
   */
  private processMessage(msg: SystemMsg<Msg>, update: Update<Model, Msg>): Effect<void> {
    return Effect.gen(
      function* (_) {
        const state = yield* _(Ref.get(this.state))

        switch (msg._tag) {
          case 'UserMsg': {
            const startTime = Date.now()

            // onMessage can transform or cancel (null) the message
            const filteredMsg = yield* _(applyOnMessageHook(this.hooks, msg.msg))
            if (filteredMsg === null) {
              break
            }

            // Call beforeUpdate hook
            if (this.hooks?.beforeUpdate) {
              yield* _(this.hooks.beforeUpdate(filteredMsg, state.model))
            }

            const oldModel = state.model
            const [newModel, commands] = yield* _(update(filteredMsg, state.model))

            yield* _(
              Ref.update(this.state, s => ({
                ...s,
                model: newModel,
              }))
            )

            // Re-evaluate subscriptions against the new model
            if (this.subscriptionsFn) {
              const subsFn = this.subscriptionsFn
              yield* _(
                this.subscriptionManager.update(
                  model => {
                    const result = subsFn(model)
                    return (result ?? []) as ReadonlyArray<
                      import('@tuix/core/types').Subscription<Msg>
                    >
                  },
                  () => Effect.map(Ref.get(this.state), s => s.model)
                )
              )
            }

            // Call afterUpdate hook
            if (this.hooks?.afterUpdate) {
              yield* _(this.hooks.afterUpdate(oldModel, newModel, filteredMsg))
            }

            yield* _(this.executeCommands(commands))
            this.dirty = true

            if (this.config.performanceMonitoring) {
              yield* _(
                Queue.offer(this.messageQueue, {
                  _tag: 'UpdateComplete',
                  duration: Date.now() - startTime,
                })
              )
            }
            break
          }

          case 'KeyPress': {
            // Check for quit key
            if (KeyUtils.isQuit(msg.key)) {
              yield* _(Queue.offer(this.messageQueue, { _tag: 'Quit' }))
              break
            }
            // Notify registered handlers (HelpExplorer etc.) — they $set named
            // state which bindMvuPush turns into UserMsg SetMsg → model update.
            const keyName =
              typeof (msg.key as { key?: string }).key === 'string'
                ? (msg.key as { key: string }).key
                : typeof (msg.key as { runes?: string }).runes === 'string'
                  ? (msg.key as { runes: string }).runes
                  : String((msg.key as { type?: string }).type ?? msg.key ?? '')
            emitKeyToHandlers(keyName)
            this.dirty = true
            break
          }

          case 'WindowResize': {
            this.dirty = true
            break
          }

          case 'Quit': {
            yield* _(
              Ref.update(this.state, s => ({
                ...s,
                isRunning: false,
              }))
            )
            break
          }

          case 'Batch': {
            for (const userMsg of msg.msgs) {
              yield* _(
                Queue.offer(this.messageQueue, {
                  _tag: 'UserMsg',
                  msg: userMsg,
                })
              )
            }
            break
          }

          default:
            // Other system messages can be handled by extensions
            break
        }
      }.bind(this)
    )
  }

  /**
   * Execute commands
   */
  private executeCommands(commands: ReadonlyArray<Command<Msg>>): Effect<void> {
    return Effect.gen(
      function* (_) {
        for (const command of commands) {
          // Call onCommand hook
          if (this.hooks?.onCommand) {
            yield* _(this.hooks.onCommand(command.execute))
          }

          yield* _(
            this.commandScheduler.execute(command.execute, command.onComplete, command.onError)
          )
        }
      }.bind(this)
    )
  }

  /**
   * Wait for quit signal
   */
  private waitForQuit(): Effect<void> {
    return Effect.gen(
      function* (_) {
        while (true) {
          const state = yield* _(Ref.get(this.state))
          if (!state.isRunning) break
          yield* _(Effect.sleep(Duration.millis(100)))
        }
      }.bind(this)
    )
  }

  /**
   * Cleanup resources
   */
  private cleanup(terminal?: TerminalService): Effect<void> {
    return Effect.gen(
      function* (_) {
        // Call onShutdown hook
        if (this.hooks?.onShutdown) {
          yield* _(this.hooks.onShutdown())
        }

        // Stop all fibers
        const fibers = [this.inputFiber, this.updateFiber, this.renderFiber].filter(
          Boolean
        ) as Fiber.RuntimeFiber<void>[]

        yield* _(Effect.all(fibers.map(f => Fiber.interrupt(f))))

        // Stop subscriptions
        yield* _(this.subscriptionManager.stop())

        // Cancel timers and commands
        yield* _(this.timerManager.cancelAll())
        yield* _(this.commandScheduler.cancelAll())

        // Reset terminal - try to get it from service if not provided
        try {
          const terminalService = terminal || (yield* _(TerminalService))
          const input = yield* _(InputService)
          if (terminalService) {
            yield* _(terminalService.showCursor)
            if (this.config.enableMouse) {
              yield* _(input.disableMouse)
            }
            if (this.config.fullscreen) {
              yield* _(terminalService.setAlternateScreen(false))
            }
          }
        } catch {
          // Ignore terminal cleanup errors - the terminal service might not be available in this context
        }

        // Run custom quit handler
        if (this.config.onQuit) {
          yield* _(this.config.onQuit())
        }
      }.bind(this)
    )
  }

  /**
   * Get runtime metrics
   */
  getMetrics(): Effect<RuntimeMetrics> {
    return Effect.gen(
      function* (_) {
        const state = yield* _(Ref.get(this.state))
        const messagesQueued = yield* _(Queue.size(this.messageQueue))

        return {
          frameRate: state.frameCount > 0 ? 1000 / (state.lastRenderTime || 1) : 0,
          updateDuration: 0, // Would need to track this
          renderDuration: state.lastRenderTime,
          commandsQueued: 0, // Would need to track this
          commandsActive: this.commandScheduler.getActiveCount(),
          messagesQueued,
          memoryUsage: process.memoryUsage().heapUsed,
        }
      }.bind(this)
    )
  }
}
