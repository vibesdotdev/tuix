/**
 * Terminal Service Implementation - Real terminal operations using Bun APIs
 */

import { Effect, Layer, Ref } from 'effect'
import { TerminalService } from '../terminal'
import { TerminalError } from '../../types/errors'
import type { TerminalCapabilities } from '../../types/schemas'
import { detectCapabilities as detectCapsFromEnv } from '../capabilities/detect'
import { probeFromEnv, mergeProbeResults } from '../capabilities/da'
import { parseCursorPositionReport, REQUEST_CURSOR_POSITION } from '../capabilities/cpr'
import { parseOscColorReport, REQUEST_BG_COLOR } from '../capabilities/osc'
import { encodeGraphics } from '../graphics'

// ANSI Escape Sequences
const ESC = '\x1b'
const CSI = `${ESC}[`

const ANSI = {
  // Cursor Movement
  cursorTo: (x: number, y: number) => `${CSI}${y};${x}H`,
  cursorUp: (n: number) => `${CSI}${n}A`,
  cursorDown: (n: number) => `${CSI}${n}B`,
  cursorForward: (n: number) => `${CSI}${n}C`,
  cursorBack: (n: number) => `${CSI}${n}D`,

  // Cursor Visibility
  cursorHide: `${CSI}?25l`,
  cursorShow: `${CSI}?25h`,
  cursorSave: `${CSI}s`,
  cursorRestore: `${CSI}u`,

  // Screen
  clear: `${CSI}2J${CSI}H`,
  clearLine: `${CSI}2K`,
  clearToEOL: `${CSI}K`,
  clearToSOL: `${CSI}1K`,
  clearToEOS: `${CSI}0J`,
  clearToSOS: `${CSI}1J`,

  // Scrolling
  scrollUp: (n: number) => `${CSI}${n}S`,
  scrollDown: (n: number) => `${CSI}${n}T`,

  // Modes — ?1049 is the modern alt-screen switch: save cursor, switch to
  // the alternate buffer, and clear it. Legacy ?47 left the cursor
  // un-restored and didn't guarantee a cleared buffer.
  alternateScreenEnable: `${CSI}?1049h`,
  alternateScreenDisable: `${CSI}?1049l`,
  mouseTrackingEnable: `${CSI}?1000h`,
  mouseTrackingDisable: `${CSI}?1000l`,

  // Styling
  reset: `${CSI}0m`,
  bold: `${CSI}1m`,
  dim: `${CSI}2m`,
  italic: `${CSI}3m`,
  underline: `${CSI}4m`,

  // Other
  bell: '\x07',
  setTitle: (title: string) => `${ESC}]2;${title}\x1b\\`,
  requestCursorPosition: `${CSI}6n`,

  // Cursor Shapes
  cursorBlock: `${CSI}1 q`,
  cursorUnderline: `${CSI}3 q`,
  cursorBar: `${CSI}5 q`,
  cursorBlinkingBlock: `${CSI}0 q`,
  cursorBlinkingUnderline: `${CSI}4 q`,
  cursorBlinkingBar: `${CSI}6 q`,
} as const

/**
 * Platform abstraction for terminal operations
 */
interface PlatformTerminal {
  readonly stdout: {
    readonly columns?: number
    readonly rows?: number
    write: (data: string) => void
  }
  readonly stdin: {
    readonly isTTY?: boolean
    setRawMode?: (enabled: boolean) => void
  }
  readonly env: Record<string, string | undefined>
  readonly platform: string
}

/**
 * Get platform-specific terminal interface
 */
const getPlatform = (): PlatformTerminal => ({
  stdout: process.stdout,
  stdin: process.stdin,
  env: process.env,
  platform: process.platform,
})

/**
 * Create the live Terminal service implementation
 */
export const TerminalServiceLive = Layer.effect(
  TerminalService,
  Effect.gen(function* (_) {
    const platform = getPlatform()
    const isRawMode = yield* _(Ref.make(false))
    const isAlternateScreen = yield* _(Ref.make(false))

    // Helper to write to stdout
    const write = (data: string) =>
      Effect.try({
        try: () => {
          platform.stdout.write(data)
        },
        catch: error =>
          new TerminalError({
            operation: 'write',
            cause: error,
          }),
      })

    // Probe-backed capability detection:
    // pure env heuristics + TUIX_PROBE_* overrides (shared with DA parse helpers).
    // Live DA send is optional (TTY); pure protocol is unit-tested in capabilities/da.ts.
    const detectCapabilities = (): TerminalCapabilities => {
      const env = platform.env
      const probe = mergeProbeResults(probeFromEnv(env as Record<string, string | undefined>))
      const hasProbe = Object.keys(probe).length > 0

      return detectCapsFromEnv({
        env,
        platform: platform.platform,
        columns: platform.stdout.columns,
        rows: platform.stdout.rows,
        isTTY: platform.stdin.isTTY,
        probe: hasProbe ? probe : undefined,
      })
    }

    return {
      // Basic Terminal Operations
      clear: write(ANSI.clear),

      write: (text: string) => write(text),

      writeLine: (text: string) => write(text + '\n'),

      moveCursor: (x: number, y: number) => write(ANSI.cursorTo(x, y)),

      moveCursorRelative: (dx: number, dy: number) =>
        Effect.gen(function* (_) {
          if (dx > 0) yield* _(write(ANSI.cursorForward(dx)))
          else if (dx < 0) yield* _(write(ANSI.cursorBack(-dx)))

          if (dy > 0) yield* _(write(ANSI.cursorDown(dy)))
          else if (dy < 0) yield* _(write(ANSI.cursorUp(-dy)))
        }),

      hideCursor: write(ANSI.cursorHide),

      showCursor: write(ANSI.cursorShow),

      // Terminal State Management
      getSize: Effect.sync(() => ({
        width: platform.stdout.columns ?? 80,
        height: platform.stdout.rows ?? 24,
      })),

      setRawMode: (enabled: boolean) =>
        Effect.gen(function* (_) {
          const currentRawMode = yield* _(Ref.get(isRawMode))
          if (currentRawMode === enabled) return

          yield* _(
            Effect.try({
              try: () => {
                if (platform.stdin.isTTY && platform.stdin.setRawMode) {
                  platform.stdin.setRawMode(enabled)
                }
              },
              catch: error =>
                new TerminalError({
                  operation: 'setRawMode',
                  cause: error,
                }),
            })
          )

          yield* _(Ref.set(isRawMode, enabled))
        }),

      setAlternateScreen: (enabled: boolean) =>
        Effect.gen(function* (_) {
          const current = yield* _(Ref.get(isAlternateScreen))
          if (current === enabled) return

          yield* _(write(enabled ? ANSI.alternateScreenEnable : ANSI.alternateScreenDisable))
          yield* _(Ref.set(isAlternateScreen, enabled))
        }),

      saveCursor: write(ANSI.cursorSave),

      restoreCursor: write(ANSI.cursorRestore),

      // Terminal Capabilities
      getCapabilities: Effect.sync(detectCapabilities),

      supportsTrueColor: Effect.sync(() => detectCapabilities().colors === 'truecolor'),

      supports256Colors: Effect.sync(() => {
        const colors = detectCapabilities().colors
        return colors === '256' || colors === 'truecolor'
      }),

      supportsUnicode: Effect.sync(() => detectCapabilities().unicode),

      // Screen Management
      clearToEndOfLine: write(ANSI.clearToEOL),

      clearToStartOfLine: write(ANSI.clearToSOL),

      clearLine: write(ANSI.clearLine),

      clearToEndOfScreen: write(ANSI.clearToEOS),

      clearToStartOfScreen: write(ANSI.clearToSOS),

      scrollUp: (lines: number) => write(ANSI.scrollUp(lines)),

      scrollDown: (lines: number) => write(ANSI.scrollDown(lines)),

      // Advanced Features
      setTitle: (title: string) => write(ANSI.setTitle(title)),

      bell: write(ANSI.bell),

      getCursorPosition: Effect.gen(function* (_) {
        // Send DSR request and parse CPR from stdin (raw mode if available)
        const position = yield* _(
          Effect.tryPromise({
            try: () =>
              new Promise<{ x: number; y: number }>((resolve, reject) => {
                const stdin = platform.stdin as NodeJS.ReadStream & {
                  setRawMode?: (v: boolean) => void
                  isRaw?: boolean
                  isTTY?: boolean
                }
                let buf = ''
                let restored = false
                // Remember whether *we* flipped raw mode so cleanup restores it.
                const wasRaw = Boolean(stdin.isRaw)
                const timeout = setTimeout(() => {
                  cleanup()
                  // Fallback when terminal does not answer (non-TTY/CI)
                  resolve({ x: 1, y: 1 })
                }, 100)

                const onData = (chunk: string | Buffer) => {
                  buf += typeof chunk === 'string' ? chunk : chunk.toString('utf8')
                  const pos = parseCursorPositionReport(buf)
                  if (pos) {
                    cleanup()
                    resolve(pos)
                  }
                }

                const cleanup = () => {
                  if (restored) return
                  restored = true
                  clearTimeout(timeout)
                  stdin.removeListener?.('data', onData)
                  try {
                    if (stdin.isTTY && stdin.setRawMode && !wasRaw) {
                      // Restore only the raw mode we enabled.
                      stdin.setRawMode(false)
                    }
                  } catch {
                    /* ignore */
                  }
                }

                try {
                  if (stdin.isTTY && stdin.setRawMode) {
                    stdin.setRawMode(true)
                  }
                  stdin.setEncoding?.('utf8')
                  stdin.on?.('data', onData)
                  platform.stdout.write(REQUEST_CURSOR_POSITION)
                } catch (err) {
                  cleanup()
                  reject(err)
                }
              }),
            catch: error =>
              new TerminalError({
                operation: 'getCursorPosition',
                cause: error,
              }),
          }).pipe(Effect.catchAll(() => Effect.succeed({ x: 1, y: 1 })))
        )
        return position
      }),

      queryBackgroundColor: Effect.gen(function* (_) {
        const color = yield* _(
          Effect.tryPromise({
            try: () =>
              new Promise<Rgb | null>(resolve => {
                // Deterministic test override: an explicit probe color wins
                // without touching the terminal.
                const probeHex = platform.env.TUIX_PROBE_BG
                if (typeof probeHex === 'string' && /^#?[0-9a-fA-F]{6}$/.test(probeHex)) {
                  const v = probeHex.replace('#', '')
                  resolve({
                    r: Number.parseInt(v.slice(0, 2), 16),
                    g: Number.parseInt(v.slice(2, 4), 16),
                    b: Number.parseInt(v.slice(4, 6), 16),
                  })
                  return
                }
                const stdin = platform.stdin as NodeJS.ReadStream & {
                  setRawMode?: (v: boolean) => void
                  isRaw?: boolean
                  isTTY?: boolean
                }
                if (!stdin.isTTY) {
                  resolve(null)
                  return
                }
                let buf = ''
                let restored = false
                const wasRaw = Boolean(stdin.isRaw)
                const timeout = setTimeout(() => {
                  cleanup()
                  resolve(null)
                }, 150)

                const onData = (chunk: string | Buffer) => {
                  buf += typeof chunk === 'string' ? chunk : chunk.toString('utf8')
                  const report = parseOscColorReport(buf)
                  if (report) {
                    cleanup()
                    resolve(report.rgb)
                  }
                }

                const cleanup = () => {
                  if (restored) return
                  restored = true
                  clearTimeout(timeout)
                  stdin.removeListener?.('data', onData)
                  try {
                    if (stdin.isTTY && stdin.setRawMode && !wasRaw) {
                      stdin.setRawMode(false)
                    }
                  } catch {
                    /* ignore */
                  }
                }

                try {
                  if (stdin.setRawMode) {
                    stdin.setRawMode(true)
                  }
                  stdin.setEncoding?.('utf8')
                  stdin.on?.('data', onData)
                  platform.stdout.write(REQUEST_BG_COLOR)
                } catch {
                  cleanup()
                  resolve(null)
                }
              }),
            catch: () => new TerminalError({ operation: 'queryBackgroundColor' }),
          }).pipe(Effect.catchAll(() => Effect.succeed<Rgb | null>(null)))
        )
        return color
      }),

      setCursorShape: (shape: 'block' | 'underline' | 'bar') =>
        write(
          shape === 'block'
            ? ANSI.cursorBlock
            : shape === 'underline'
              ? ANSI.cursorUnderline
              : ANSI.cursorBar
        ),

      setCursorBlink: (enabled: boolean) =>
        write(enabled ? ANSI.cursorBlinkingBlock : ANSI.cursorBlock),

      writeGraphics: image =>
        Effect.gen(function* (_) {
          const caps = detectCapabilities()
          const encoded = encodeGraphics(caps, image)
          if (!encoded.fallback && encoded.payload) {
            yield* _(write(encoded.payload))
          }
          return {
            protocol: encoded.protocol,
            fallback: encoded.fallback,
          }
        }),
    }
  })
)

/**
 * Create a test/mock Terminal service for testing
 */
export const TerminalServiceTest = Layer.succeed(TerminalService, {
  clear: Effect.void,
  write: (_text: string) => Effect.void,
  writeLine: (_text: string) => Effect.void,
  moveCursor: (_x: number, _y: number) => Effect.void,
  moveCursorRelative: (_dx: number, _dy: number) => Effect.void,
  hideCursor: Effect.void,
  showCursor: Effect.void,
  getSize: Effect.succeed({ width: 80, height: 24 }),
  setRawMode: (_enabled: boolean) => Effect.void,
  setAlternateScreen: (_enabled: boolean) => Effect.void,
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
  scrollUp: (_lines: number) => Effect.void,
  scrollDown: (_lines: number) => Effect.void,
  setTitle: (_title: string) => Effect.void,
  bell: Effect.void,
  getCursorPosition: Effect.succeed({ x: 1, y: 1 }),
  queryBackgroundColor: Effect.succeed(null),
  setCursorShape: (_shape: 'block' | 'underline' | 'bar') => Effect.void,
  setCursorBlink: (_enabled: boolean) => Effect.void,
  writeGraphics: _image => Effect.succeed({ protocol: 'none' as const, fallback: true }),
})
