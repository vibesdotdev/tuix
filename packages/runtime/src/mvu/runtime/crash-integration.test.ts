/**
 * Integration: a render crash surfaces a visible overlay + a formatted error
 * log through the real runApp path (not a unit mock of handleRenderFailure).
 */

import { test, expect, describe } from 'bun:test'
import { Effect, Layer, Stream, Duration } from 'effect'
import { runApp } from './factory'
import { TerminalService, InputService, RendererService } from '@tuix/core/services'

describe('render-crash surfacing', () => {
  test('a crashing view writes a visible overlay + logs the real error', async () => {
    const writes: string[] = []
    const logs: string[] = []
    const realErr = console.log
    console.log = (...a: unknown[]) => {
      logs.push(a.map(x => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '))
    }

    const CapturingTerminal = Layer.succeed(TerminalService, {
      clear: Effect.sync(() => writes.push('\x1b[2J')),
      write: (text: string) => Effect.sync(() => writes.push(text)),
      writeLine: (text: string) => Effect.sync(() => writes.push(text + '\n')),
      moveCursor: () => Effect.void,
      moveCursorRelative: () => Effect.void,
      hideCursor: Effect.sync(() => writes.push('\x1b[?25l')),
      showCursor: Effect.sync(() => writes.push('\x1b[?25h')),
      getSize: Effect.succeed({ width: 80, height: 24 }),
      setRawMode: () => Effect.void,
      setAlternateScreen: () => Effect.void,
      saveCursor: Effect.void,
      restoreCursor: Effect.void,
      getCapabilities: Effect.succeed({
        colors: 'truecolor',
        unicode: true,
        mouse: true,
        clipboard: false,
        sixel: false,
        kitty: false,
        iterm2: false,
        windowTitle: true,
        columns: 80,
        rows: 24,
      }),
      supportsTrueColor: Effect.succeed(true),
      supports256Colors: Effect.succeed(true),
      supportsUnicode: Effect.succeed(true),
      clearToEndOfLine: Effect.void,
      clearToStartOfLine: Effect.void,
      clearLine: Effect.void,
      clearToEndOfScreen: Effect.void,
      clearToStartOfScreen: Effect.void,
      scrollUp: () => Effect.void,
      scrollDown: () => Effect.void,
      setTitle: () => Effect.void,
      bell: Effect.void,
      getCursorPosition: Effect.succeed({ x: 1, y: 1 }),
      queryBackgroundColor: Effect.succeed(null),
      setCursorShape: () => Effect.void,
      setCursorBlink: () => Effect.void,
      writeGraphics: () => Effect.succeed({ protocol: 'none' as const, fallback: true }),
    } as any)

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
      popViewport: () => Effect.void,
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
      getLayers: Effect.succeed([]),
    } as any)

    const TestServices = Layer.mergeAll(CapturingTerminal, InputServiceTest, RendererServiceTest)

    type Model = { n: number }
    type Msg = { type: 'noop' }
    const crashView = {
      render: () => Effect.die(new RangeError('Array length must be a positive integer')),
    }
    const component = {
      init: Effect.succeed([{ n: 0 }, []] as const),
      update: (_msg: Msg, model: Model) => Effect.succeed([model, []] as const),
      view: () => crashView as any,
    }

    await Effect.runPromise(
      runApp(component as any, {
        fps: 30,
        exitAfterRender: true,
        fullscreen: false,
      }).pipe(Effect.provide(TestServices), Effect.timeout(Duration.seconds(5)))
    ).catch(() => {})

    console.log = realErr

    const allWrites = writes.join('')
    const allLogs = logs.join('\n')

    // The overlay reached the terminal — a bordered box with the error.
    expect(allWrites).toContain('╭')
    expect(allWrites).toContain('╰')
    expect(allWrites).toContain('render error')
    // The real error message surfaced in both the overlay and the log
    // (was "Render error" message={} before the fix).
    expect(allWrites).toContain('Array length must be a positive integer')
    expect(allLogs).toContain('RangeError')
    expect(allLogs).toContain('Array length must be a positive integer')
  })
})
