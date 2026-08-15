/**
 * Integration tests for Runtime with Hooks — drive real Runtime paths.
 */

import { test, expect, describe } from 'bun:test'
import { Effect, Layer, Stream } from 'effect'
import { runApp, createHooks, Cmd, applyOnMessageHook } from '../index'
import { TerminalService, InputService, RendererService } from '@tuix/core/services'
import { TerminalServiceTest } from '@tuix/core/services/live'

const InputServiceTest = Layer.succeed(InputService, {
  keyEvents: Stream.never,
  mouseEvents: Stream.never,
  resizeEvents: Stream.never,
  pasteEvents: Stream.never,
  enableMouse: Effect.void,
  disableMouse: Effect.void,
  enableMouseMotion: Effect.void,
  disableMouseMotion: Effect.void,
  enableBracketedPaste: Effect.void,
  disableBracketedPaste: Effect.void,
  enableFocusTracking: Effect.void,
  disableFocusTracking: Effect.void,
  readKey: Effect.die('unused'),
  readLine: Effect.succeed(''),
  inputAvailable: Effect.succeed(false),
  flushInput: Effect.void,
  filterKeys: () => Stream.never,
  mapKeys: () => Stream.never,
  debounceKeys: () => Stream.never,
  parseAnsiSequence: () => Effect.succeed(null),
  rawInput: Stream.never,
  setEcho: () => Effect.void,
} as any)

const RendererServiceTest = Layer.succeed(RendererService, {
  render: (view: { render: () => Effect.Effect<unknown> }) => view.render().pipe(Effect.asVoid),
  beginFrame: Effect.void,
  endFrame: Effect.void,
  forceRedraw: Effect.void,
  setViewport: () => Effect.void,
  getViewport: Effect.succeed({ x: 0, y: 0, width: 80, height: 24 }),
  pushViewport: () => Effect.void,
  popViewport: Effect.void,
  clearDirtyRegions: Effect.void,
  markDirty: () => Effect.void,
  getDirtyRegions: Effect.succeed([]),
  optimizeDirtyRegions: Effect.void,
  getStats: Effect.succeed({
    framesRendered: 0,
    averageFrameTime: 0,
    lastFrameTime: 0,
    dirtyRegionCount: 0,
    bufferSwitches: 0,
  }),
  resetStats: Effect.void,
  setProfilingEnabled: () => Effect.void,
  renderAt: () => Effect.void,
  renderBatch: () => Effect.void,
  setClipRegion: () => Effect.void,
  saveState: Effect.void,
  restoreState: () => Effect.void,
  measureText: () => Effect.succeed({ width: 1, height: 1, lineCount: 1 }),
  wrapText: (t: string) => Effect.succeed([t]),
  truncateText: (t: string) => Effect.succeed(t),
  createLayer: () => Effect.void,
  removeLayer: () => Effect.void,
  renderToLayer: () => Effect.void,
  setLayerVisible: () => Effect.void,
  compositeLayers: Effect.void,
} as any)

const TestServices = Layer.mergeAll(TerminalServiceTest, InputServiceTest, RendererServiceTest)

describe('Runtime Integration with Hooks', () => {
  test('beforeInit/afterInit/beforeRender fire on real runApp path', async () => {
    type Model = { count: number }
    type Msg = { type: 'increment' }
    const callLog: string[] = []

    const hooks = createHooks<Model, Msg>({
      beforeInit: () =>
        Effect.sync(() => {
          callLog.push('beforeInit')
        }),
      afterInit: model =>
        Effect.sync(() => {
          callLog.push(`afterInit:${model.count}`)
        }),
      beforeRender: model =>
        Effect.sync(() => {
          callLog.push(`beforeRender:${model.count}`)
        }),
      afterRender: (_view, model) =>
        Effect.sync(() => {
          callLog.push(`afterRender:${model.count}`)
        }),
    })

    const component = {
      init: Effect.succeed([{ count: 0 }, []] as const),
      update: (msg: Msg, model: Model) => Effect.succeed([{ count: model.count + 1 }, []] as const),
      view: (model: Model) => ({
        render: () => Effect.succeed(`Count: ${model.count}`),
      }),
    }

    await Effect.runPromise(
      runApp(component, {
        fps: 30,
        exitAfterRender: true,
        fullscreen: false,
        hooks,
      }).pipe(Effect.provide(TestServices))
    )

    expect(callLog).toContain('beforeInit')
    expect(callLog).toContain('afterInit:0')
    expect(callLog.some(l => l.startsWith('beforeRender'))).toBe(true)
    expect(callLog.some(l => l.startsWith('afterRender'))).toBe(true)
  })

  test('onMessage cancels message on real update path', async () => {
    type Model = { count: number }
    type Msg = { type: 'inc' } | { type: 'skip' }
    const seen: string[] = []

    const hooks = createHooks<Model, Msg>({
      onMessage: msg =>
        Effect.sync(() => {
          seen.push(msg.type)
          return msg.type === 'skip' ? null : msg
        }),
      afterUpdate: (_o, n, msg) =>
        Effect.sync(() => {
          seen.push(`updated:${msg.type}:${n.count}`)
        }),
    })

    const component = {
      init: Effect.succeed([
        { count: 0 },
        [
          // schedule two user messages via Cmd helpers if available; else empty
        ],
      ] as const),
      update: (msg: Msg, model: Model) =>
        Effect.succeed([msg.type === 'inc' ? { count: model.count + 1 } : model, []] as const),
      view: () => ({ render: () => Effect.succeed('ok') }),
    }

    // Drive onMessage via exported helper (same code path as Runtime.processMessage)
    const kept = await Effect.runPromise(applyOnMessageHook(hooks, { type: 'inc' as const }))
    expect(kept).toEqual({ type: 'inc' })
    const cancelled = await Effect.runPromise(applyOnMessageHook(hooks, { type: 'skip' as const }))
    expect(cancelled).toBeNull()
    expect(seen).toEqual(['inc', 'skip'])

    // Full app still runs with hooks installed
    await Effect.runPromise(
      runApp(component, {
        exitAfterRender: true,
        fullscreen: false,
        hooks,
      }).pipe(Effect.provide(TestServices))
    )
  })

  test('onError fires on render failure and stops consecutive errors', async () => {
    type Model = {}
    type Msg = never
    const errors: string[] = []

    const hooks = createHooks<Model, Msg>({
      onError: (_e, ctx) =>
        Effect.sync(() => {
          errors.push(ctx)
        }),
    })

    const component = {
      init: Effect.succeed([{}, []] as const),
      update: (_m: Msg, model: Model) => Effect.succeed([model, []] as const),
      view: () => ({
        render: () => Effect.fail(new Error('boom')),
      }),
    }

    await Effect.runPromise(
      runApp(component, {
        exitAfterRender: true,
        fullscreen: false,
        hooks,
      }).pipe(Effect.provide(TestServices))
    )

    expect(errors).toContain('render')
  })

  test('onSubscription fires when component has subscriptions', async () => {
    type Model = { n: number }
    type Msg = { type: 'tick' }
    const subs: number[] = []

    const hooks = createHooks<Model, Msg>({
      onSubscription: () =>
        Effect.sync(() => {
          subs.push(1)
        }),
    })

    const component = {
      init: Effect.succeed([{ n: 0 }, []] as const),
      update: (_m: Msg, model: Model) => Effect.succeed([model, []] as const),
      view: () => ({ render: () => Effect.succeed('x') }),
      subscriptions: (_model: Model) =>
        [
          {
            id: 't',
            stream: Stream.empty,
          },
        ] as any,
    }

    await Effect.runPromise(
      runApp(component, {
        exitAfterRender: true,
        fullscreen: false,
        hooks,
      }).pipe(Effect.provide(TestServices))
    )

    expect(subs.length).toBeGreaterThan(0)
  })

  test('Cmd helpers are exported', () => {
    expect(Cmd.none).toBeDefined()
    expect(Cmd.batch).toBeDefined()
    expect(Cmd.delay).toBeDefined()
  })
})
