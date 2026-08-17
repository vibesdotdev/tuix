/**
 * E2E Test Harness for CLI-Kit Applications
 *
 * This module provides utilities for testing CLI applications by:
 * - Capturing terminal output
 * - Simulating keyboard input
 * - Taking screenshots of terminal state
 * - Recording and replaying sessions
 */

import { Effect, Stream, Queue, Fiber, Ref } from 'effect'
import { spawn, type ChildProcess } from 'child_process'
import * as pty from 'node-pty'
import { writeFileSync } from 'fs'
import { join } from 'path'

// =============================================================================
// Types
// =============================================================================

export interface TestHarnessOptions {
  readonly command: string
  readonly args?: string[]
  readonly env?: Record<string, string>
  readonly cols?: number
  readonly rows?: number
  readonly cwd?: string
  readonly recordSession?: boolean
  readonly screenshotDir?: string
}

export interface KeySequence {
  readonly key: string
  readonly delay?: number // ms to wait after key
}

export interface TerminalSnapshot {
  readonly timestamp: number
  readonly content: string
  readonly cursorX: number
  readonly cursorY: number
  readonly cols: number
  readonly rows: number
}

export interface TestSession {
  readonly start: () => Effect.Effect<void, Error, never>
  readonly stop: () => Effect.Effect<void, Error, never>
  readonly sendKey: (key: string) => Effect.Effect<void, Error, never>
  readonly sendKeys: (keys: KeySequence[]) => Effect.Effect<void, Error, never>
  /** Type a literal string (no special-key mapping). */
  readonly sendText: (text: string) => Effect.Effect<void, Error, never>
  /** Resize the PTY grid. */
  readonly resize: (cols: number, rows: number) => Effect.Effect<void, Error, never>
  readonly waitForText: (text: string, timeout?: number) => Effect.Effect<void, Error, never>
  /** Wait until the decoded screen contains the text (escape-safe). */
  readonly waitForScreenText: (text: string, timeout?: number) => Effect.Effect<void, Error, never>
  readonly screenshot: (name?: string) => Effect.Effect<string, Error, never>
  readonly getOutput: () => Effect.Effect<string, Error, never>
  readonly clearOutput: () => Effect.Effect<void, Error, never>
  /** One row of the decoded screen grid (0-based, no SGR codes). */
  readonly getScreenLine: (row: number) => Effect.Effect<string, Error, never>
  /** The full decoded screen grid, one string per row. */
  readonly getScreen: () => Effect.Effect<string[], Error, never>
}

// =============================================================================
// VT100 screen emulator
// =============================================================================

interface ScreenState {
  grid: string[][]
  cursorX: number
  cursorY: number
}

/**
 * Minimal VT100 screen emulator: replays a raw PTY stream onto a cell grid,
 * tracking CUP/CR/LF, ED/EL erases, and relative cursor moves. SGR codes are
 * consumed (not rendered) so `waitForScreenText` matches visible text even
 * when the raw stream interleaves escape sequences inside words.
 */
export function decodeScreen(stream: string, cols: number, rows: number): ScreenState {
  const grid: string[][] = Array.from({ length: rows }, () => Array<string>(cols).fill(' '))
  let cursorX = 0
  let cursorY = 0
  let index = 0

  while (index < stream.length) {
    const ch = stream[index]
    if (ch === '\x1b') {
      const next = stream[index + 1]
      if (next === '[') {
        const match = /^\x1b\[([0-9;?]*)([A-Za-z])/.exec(stream.slice(index))
        if (match) {
          const params = match[1]
          const final = match[2]
          if (final === 'H' || final === 'f') {
            const [r = '1', c = '1'] = params.split(';')
            cursorY = Math.max(0, (Number(r) || 1) - 1)
            cursorX = Math.max(0, (Number(c) || 1) - 1)
          } else if (final === 'J') {
            const mode = params || '0'
            if (mode === '2') {
              for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) grid[y]![x] = ' '
            } else if (mode === '0') {
              for (let x = cursorX; x < cols; x++) grid[cursorY]![x] = ' '
              for (let y = cursorY + 1; y < rows; y++)
                for (let x = 0; x < cols; x++) grid[y]![x] = ' '
            }
          } else if (final === 'K') {
            const mode = params || '0'
            if (mode === '0') for (let x = cursorX; x < cols; x++) grid[cursorY]![x] = ' '
            else if (mode === '2') for (let x = 0; x < cols; x++) grid[cursorY]![x] = ' '
          } else if (final === 'C') cursorX = Math.min(cols - 1, cursorX + Number(params || 1))
          else if (final === 'D') cursorX = Math.max(0, cursorX - Number(params || 1))
          else if (final === 'A') cursorY = Math.max(0, cursorY - Number(params || 1))
          else if (final === 'B') cursorY = Math.min(rows - 1, cursorY + Number(params || 1))
          // SGR ('m') and everything else: consumed, zero width.
          index += match[0].length
          continue
        }
      } else if (next === ']') {
        const match = /^\x1b\][^\x07]*(?:\x07|\x1b\\)/.exec(stream.slice(index))
        if (match) {
          index += match[0].length
          continue
        }
      }
      index += 1
      continue
    }
    if (ch === '\r') {
      cursorX = 0
      index += 1
      continue
    }
    if (ch === '\n') {
      cursorY += 1
      cursorX = 0
      index += 1
      continue
    }
    if (ch === '\b') {
      cursorX = Math.max(0, cursorX - 1)
      index += 1
      continue
    }
    if (ch >= ' ') {
      for (const c of Array.from(ch)) {
        if (cursorY < rows && cursorX < cols) {
          grid[cursorY]![cursorX] = c
          cursorX += 1
        }
      }
    }
    index += Array.from(ch).length
  }

  return { grid, cursorX, cursorY }
}

function screenToLines(state: ScreenState): string[] {
  return state.grid.map(line => line.join('').replace(/\s+$/, ''))
}

// =============================================================================
// Implementation
// =============================================================================

class TestHarnessImpl implements TestSession {
  private ptyProcess: pty.IPty | null = null
  private output: string = ''
  private outputRef = Ref.unsafeMake('')
  private screenshotCount = 0

  private options: TestHarnessOptions

  constructor(options: TestHarnessOptions) {
    this.options = options
  }

  start(): Effect.Effect<void, Error, never> {
    const self = this
    return Effect.gen(
      function* (_) {
        if (self.ptyProcess) {
          yield* _(Effect.fail(new Error('Test harness already started')))
        }

        // Create pseudo-terminal
        self.ptyProcess = pty.spawn(self.options.command, self.options.args || [], {
          cols: self.options.cols || 80,
          rows: self.options.rows || 24,
          cwd: self.options.cwd || process.cwd(),
          env: { ...process.env, ...self.options.env },
        })

        // Capture output
        self.ptyProcess.on('data', (data: string) => {
          self.output += data
          Effect.runSync(Ref.update(self.outputRef, current => current + data))
        })

        // Wait a bit for process to start
        yield* _(Effect.sleep(100))
      }.bind(this)
    )
  }

  stop(): Effect.Effect<void, Error, never> {
    const self = this
    return Effect.gen(
      function* (_) {
        if (!self.ptyProcess) {
          yield* _(Effect.fail(new Error('Test harness not started')))
        }

        self.ptyProcess.kill()
        self.ptyProcess = null

        // Save final output if recording
        if (self.options.recordSession) {
          const timestamp = new Date().toISOString()
          const filename = `session-${timestamp}.txt`
          writeFileSync(filename, self.output)
        }
      }.bind(this)
    )
  }

  sendKey(key: string): Effect.Effect<void, Error, never> {
    const self = this
    return Effect.gen(function* (_) {
      if (!self.ptyProcess) {
        yield* _(Effect.fail(new Error('Test harness not started')))
      }

      // Handle special keys
      const keyMap: Record<string, string> = {
        enter: '\r',
        tab: '\t',
        backspace: '\x7f',
        escape: '\x1b',
        up: '\x1b[A',
        down: '\x1b[B',
        right: '\x1b[C',
        left: '\x1b[D',
        home: '\x1b[H',
        end: '\x1b[F',
        pageup: '\x1b[5~',
        pagedown: '\x1b[6~',
        delete: '\x1b[3~',
        'ctrl+c': '\x03',
        'ctrl+d': '\x04',
        'ctrl+z': '\x1a',
      }

      const sequence = keyMap[key.toLowerCase()] || key
      self.ptyProcess.write(sequence)

      // Small delay to let the app process the key
      yield* _(Effect.sleep(50))
    })
  }

  sendKeys(keys: KeySequence[]): Effect.Effect<void, Error, never> {
    const self = this
    return Effect.gen(function* (_) {
      for (const { key, delay } of keys) {
        yield* _(self.sendKey(key))
        if (delay) {
          yield* _(Effect.sleep(delay))
        }
      }
    })
  }

  sendText(text: string): Effect.Effect<void, Error, never> {
    const self = this
    return Effect.gen(function* (_) {
      if (!self.ptyProcess) {
        yield* _(Effect.fail(new Error('Test harness not started')))
      }
      self.ptyProcess.write(text)
      yield* _(Effect.sleep(50))
    })
  }

  resize(cols: number, rows: number): Effect.Effect<void, Error, never> {
    const self = this
    return Effect.gen(function* (_) {
      if (!self.ptyProcess) {
        yield* _(Effect.fail(new Error('Test harness not started')))
      }
      self.ptyProcess.resize(cols, rows)
      self.options = { ...self.options, cols, rows }
      yield* _(Effect.sleep(120))
    })
  }

  getScreenLine(row: number): Effect.Effect<string, Error, never> {
    const self = this
    return Effect.gen(function* (_) {
      const lines = yield* _(self.getScreen())
      return lines[row] ?? ''
    })
  }

  getScreen(): Effect.Effect<string[], Error, never> {
    const self = this
    return Effect.gen(function* (_) {
      const output = yield* _(Ref.get(self.outputRef))
      const cols = self.options.cols || 80
      const rows = self.options.rows || 24
      return screenToLines(decodeScreen(output, cols, rows))
    })
  }

  waitForScreenText(text: string, timeout: number = 5000): Effect.Effect<void, Error, never> {
    const self = this
    return Effect.gen(function* (_) {
      const startTime = Date.now()

      while (true) {
        const lines = yield* _(self.getScreen())
        if (lines.some(line => line.includes(text))) {
          return
        }

        if (Date.now() - startTime > timeout) {
          yield* _(
            Effect.fail(
              new Error(`Timeout waiting for screen text: ${text}\nScreen:\n${lines.join('\n')}`)
            )
          )
        }

        yield* _(Effect.sleep(100))
      }
    })
  }

  waitForText(text: string, timeout: number = 5000): Effect.Effect<void, Error, never> {
    const self = this
    return Effect.gen(function* (_) {
      const startTime = Date.now()

      while (true) {
        const currentOutput = yield* _(Ref.get(self.outputRef))
        if (currentOutput.includes(text)) {
          return
        }

        if (Date.now() - startTime > timeout) {
          yield* _(Effect.fail(new Error(`Timeout waiting for text: ${text}`)))
        }

        yield* _(Effect.sleep(100))
      }
    })
  }

  screenshot(name?: string): Effect.Effect<string, Error, never> {
    const self = this
    return Effect.gen(function* (_) {
      if (!self.ptyProcess) {
        yield* _(Effect.fail(new Error('Test harness not started')))
      }

      // Get current terminal state
      const cols = self.options.cols || 80
      const rows = self.options.rows || 24
      const screen = decodeScreen(self.output, cols, rows)
      const snapshot: TerminalSnapshot = {
        timestamp: Date.now(),
        content: self.output,
        cursorX: screen.cursorX,
        cursorY: screen.cursorY,
        cols,
        rows,
      }

      // Generate filename
      const filename = name || `screenshot-${self.screenshotCount++}.txt`
      const filepath = self.options.screenshotDir
        ? join(self.options.screenshotDir, filename)
        : filename

      // Save screenshot (text representation for now)
      writeFileSync(filepath, JSON.stringify(snapshot, null, 2))

      return filepath
    })
  }

  getOutput(): Effect.Effect<string, Error, never> {
    return Ref.get(this.outputRef)
  }

  clearOutput(): Effect.Effect<void, Error, never> {
    const self = this
    return Effect.gen(function* (_) {
      self.output = ''
      yield* _(Ref.set(self.outputRef, ''))
    })
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a test harness for a CLI application
 */
export const createTestHarness = (options: TestHarnessOptions): TestSession => {
  return new TestHarnessImpl(options)
}

/**
 * Run a test scenario with automatic cleanup
 */
export const runTest = <R, E, A>(
  options: TestHarnessOptions,
  test: (harness: TestSession) => Effect.Effect<A, E, R>
): Effect.Effect<A, E | Error, R> =>
  Effect.gen(function* (_) {
    const harness = createTestHarness(options)

    yield* _(harness.start())

    try {
      return yield* _(test(harness))
    } finally {
      yield* _(harness.stop())
    }
  })

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Capture a series of screenshots while performing actions
 */
export const captureScreenshots = (
  harness: TestSession,
  actions: Array<{ action: Effect.Effect<void, Error, never>; name: string }>
): Effect.Effect<string[], Error, never> =>
  Effect.gen(function* (_) {
    const screenshots: string[] = []

    for (const { action, name } of actions) {
      yield* _(action)
      const path = yield* _(harness.screenshot(name))
      screenshots.push(path)
    }

    return screenshots
  })

/**
 * Create a test script from user actions
 */
export const recordScript = (
  harness: TestSession,
  outputFile: string
): Effect.Effect<void, Error, never> =>
  Effect.gen(function* (_) {
    // This would record all interactions and generate a replayable script
    // For now, just save the session
    const output = yield* _(harness.getOutput())
    writeFileSync(outputFile, output)
  })
