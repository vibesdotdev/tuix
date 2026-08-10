/**
 * @fileoverview This file defines the base class for all modules in the application.
 * It provides a common interface for module initialization, shutdown, and event handling,
 * ensuring a consistent lifecycle and interaction pattern across different parts of the system.
 * The `ModuleBase` class encapsulates common functionalities such as state management,
 * event emission, subscription management, and lifecycle hooks.
 */

import { Effect, Ref } from 'effect'
import type { BaseEvent, EventHandler, EventBus } from '../events'
import { v4 as uuidv4 } from 'uuid'

/**
 * Defines the possible states of a module.
 * - `uninitialized`: The initial state before the module has been started.
 * - `initializing`: The state while the module's `initialize` method is executing.
 * - `ready`: The state when the module is fully initialized and operational.
 * - `shutting-down`: The state while the module's `shutdown` method is executing.
 * - `shutdown`: The final state after the module has been successfully shut down.
 */
export type ModuleState = 'uninitialized' | 'initializing' | 'ready' | 'shutting-down' | 'shutdown'

/**
 * Abstract base class for all modules.
 */
export abstract class ModuleBase {
  protected state: ModuleState = 'uninitialized'
  protected subscriptions: Array<() => Effect.Effect<void, never>> = []
  protected readonly ready: Ref.Ref<boolean>

  constructor(
    protected readonly eventBus: EventBus,
    public readonly name: string
  ) {
    this.ready = Ref.unsafeMake(false)
  }

  /**
   * Initialize the module
   */
  public abstract initialize(): Effect.Effect<void, ModuleError>

  /**
   * Shutdown the module
   */
  public shutdown(): Effect.Effect<void, ModuleError> {
    return Effect.gen(
      function* (this: ModuleBase) {
        this.state = 'shutting-down'
        yield* this.onShutdown()
        yield* this.unsubscribeAll()
        this.state = 'shutdown'
      }.bind(this)
    ).pipe(
      Effect.mapError(err => new ModuleError(this.name, 'Shutdown failed', err))
    ) as Effect.Effect<void, ModuleError>
  }

  /**
   * Optional shutdown hook for subclasses
   */
  protected onShutdown(): Effect.Effect<void, never> {
    return Effect.void
  }

  /**
   * Unsubscribe from all events
   */
  protected unsubscribeAll(): Effect.Effect<void, never> {
    return Effect.gen(
      function* (this: ModuleBase) {
        for (const unsubscribe of this.subscriptions) {
          yield* unsubscribe().pipe(Effect.catchAll(() => Effect.void))
        }
        this.subscriptions = []
      }.bind(this)
    )
  }

  /**
   * Emit an event to a specific channel
   */
  protected emitEvent<T extends BaseEvent>(
    channel: string,
    event: Omit<T, 'id' | 'timestamp' | 'source'>
  ): Effect.Effect<void, never> {
    const fullEvent = {
      ...event,
      id: this.generateId(),
      timestamp: new Date(),
      source: this.name,
    } as T

    return this.eventBus.publish(channel, fullEvent)
  }

  /**
   * Subscribe to a specific channel
   */
  protected subscribe<T extends BaseEvent>(
    channel: string,
    handler: EventHandler<T>
  ): Effect.Effect<void, never> {
    return Effect.gen(
      function* (this: ModuleBase) {
        const unsubscribe = yield* this.eventBus.subscribe(channel, handler)
        this.subscriptions.push(unsubscribe)
      }.bind(this)
    )
  }

  /**
   * Subscribe to multiple channels in a single call.
   * Helpful for modules that need to wire up several listeners during initialization.
   */
  protected subscribeMany(
    subscriptions: ReadonlyArray<{
      readonly channel: string
      readonly handler: EventHandler<BaseEvent>
    }>
  ): Effect.Effect<void, never> {
    return Effect.forEach(
      subscriptions,
      ({ channel, handler }) => this.subscribe(channel, handler),
      { discard: true }
    )
  }

  /**
   * Check if module is ready
   */
  public isReady(): Effect.Effect<boolean> {
    return Ref.get(this.ready)
  }

  /**
   * Set the module as ready
   */
  public setReady(): Effect.Effect<void, never> {
    return Effect.gen(
      function* (this: ModuleBase) {
        yield* Ref.set(this.ready, true)
        yield* this.emitEvent<BaseEvent>('module-lifecycle', {
          type: 'module-ready',
        })
      }.bind(this)
    ) as Effect.Effect<void, never>
  }

  /**
   * Wait for module to be ready
   */
  public waitForReady(maxAttempts: number = 50): Effect.Effect<void, ModuleError> {
    return Effect.gen(
      function* (this: ModuleBase) {
        let attempts = 0
        while (attempts < maxAttempts) {
          const isReady = yield* Ref.get(this.ready)
          if (isReady) {
            return
          }
          yield* Effect.sleep('100 millis')
          attempts++
        }
        return yield* Effect.fail(
          new ModuleError(this.name, `Module ${this.name} did not become ready in time`)
        )
      }.bind(this)
    )
  }

  /**
   * Generate a unique ID
   */
  protected generateId(): string {
    return uuidv4()
  }
}

/**
 * Custom error class for module-related errors.
 */
export class ModuleError extends Error {
  constructor(
    public readonly moduleName: string,
    public override readonly message: string,
    public override readonly cause?: unknown
  ) {
    super(`[${moduleName}] ${message}`)
    this.name = 'ModuleError'
  }
}
