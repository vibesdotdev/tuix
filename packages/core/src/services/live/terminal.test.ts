/**
 * Terminal Service Implementation Tests
 *
 * Tests for the terminal service that handles low-level terminal operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { Effect } from 'effect'
import { TerminalServiceLive } from './terminal'
import { TerminalService } from '../terminal'

describe('Terminal Service Implementation', () => {
  describe('Basic operations', () => {
    it('should get terminal size', async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const terminal = yield* TerminalService
          const size = yield* terminal.getSize
          return size
        }).pipe(Effect.provide(TerminalServiceLive))
      )

      expect(result.width).toBeGreaterThan(0)
      expect(result.height).toBeGreaterThan(0)
    })

    it('should check terminal capabilities', async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const terminal = yield* TerminalService
          const capabilities = yield* terminal.getCapabilities
          return capabilities
        }).pipe(Effect.provide(TerminalServiceLive))
      )

      expect(result).toBeDefined()
      expect(['none', 'basic', '256', 'truecolor']).toContain(result.colors)
      expect(typeof result.unicode).toBe('boolean')
    })

    it('should support truecolor detection', async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const terminal = yield* TerminalService
          return yield* terminal.supportsTrueColor
        }).pipe(Effect.provide(TerminalServiceLive))
      )

      expect(typeof result).toBe('boolean')
    })

    it('should support 256 color detection', async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const terminal = yield* TerminalService
          return yield* terminal.supports256Colors
        }).pipe(Effect.provide(TerminalServiceLive))
      )

      expect(typeof result).toBe('boolean')
    })

    it('should support unicode detection', async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const terminal = yield* TerminalService
          return yield* terminal.supportsUnicode
        }).pipe(Effect.provide(TerminalServiceLive))
      )

      expect(typeof result).toBe('boolean')
    })
  })

  describe('Cursor operations', () => {
    let originalStdout: typeof process.stdout.write
    let writes: string[]

    beforeEach(() => {
      writes = []
      originalStdout = process.stdout.write
      process.stdout.write = ((data: unknown): boolean => {
        if (typeof data === 'string') writes.push(data)
        else if (data && typeof (data as { toString?: () => string }).toString === 'function')
          writes.push(String(data))
        return true
      }) as unknown as typeof process.stdout.write
    })

    afterEach(() => {
      process.stdout.write = originalStdout
    })

    it('should move cursor to position', async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const terminal = yield* TerminalService
          yield* terminal.moveCursor(10, 5)
        }).pipe(Effect.provide(TerminalServiceLive))
      )

      expect(writes.some(w => w.includes('\x1b['))).toBe(true)
    })

    it('should move cursor relatively', async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const terminal = yield* TerminalService
          yield* terminal.moveCursorRelative(2, -1)
        }).pipe(Effect.provide(TerminalServiceLive))
      )

      expect(writes.some(w => w.includes('\x1b['))).toBe(true)
    })

    it('should hide cursor', async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const terminal = yield* TerminalService
          yield* terminal.hideCursor
        }).pipe(Effect.provide(TerminalServiceLive))
      )

      expect(writes).toContain('\x1b[?25l')
    })

    it('should show cursor', async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const terminal = yield* TerminalService
          yield* terminal.showCursor
        }).pipe(Effect.provide(TerminalServiceLive))
      )

      expect(writes).toContain('\x1b[?25h')
    })

    it('should save and restore cursor', async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const terminal = yield* TerminalService
          yield* terminal.saveCursor
          yield* terminal.restoreCursor
        }).pipe(Effect.provide(TerminalServiceLive))
      )

      expect(writes).toContain('\x1b[s')
      expect(writes).toContain('\x1b[u')
    })
  })

  describe('Screen operations', () => {
    let originalStdout: typeof process.stdout.write
    let writes: string[]

    beforeEach(() => {
      writes = []
      originalStdout = process.stdout.write
      process.stdout.write = ((data: unknown): boolean => {
        if (typeof data === 'string') writes.push(data)
        else if (data && typeof (data as { toString?: () => string }).toString === 'function')
          writes.push(String(data))
        return true
      }) as unknown as typeof process.stdout.write
    })

    afterEach(() => {
      process.stdout.write = originalStdout
    })

    it('should clear screen', async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const terminal = yield* TerminalService
          yield* terminal.clear
        }).pipe(Effect.provide(TerminalServiceLive))
      )

      expect(writes).toContain('\x1b[2J\x1b[H')
    })

    it('should write text', async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const terminal = yield* TerminalService
          yield* terminal.write('Hello, World!')
        }).pipe(Effect.provide(TerminalServiceLive))
      )

      expect(writes).toContain('Hello, World!')
    })

    it('should write line', async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const terminal = yield* TerminalService
          yield* terminal.writeLine('Hello, World!')
        }).pipe(Effect.provide(TerminalServiceLive))
      )

      expect(writes).toContain('Hello, World!\n')
    })

    it('should clear to end of line', async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const terminal = yield* TerminalService
          yield* terminal.clearToEndOfLine
        }).pipe(Effect.provide(TerminalServiceLive))
      )

      expect(writes).toContain('\x1b[K')
    })

    it('should clear entire line', async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const terminal = yield* TerminalService
          yield* terminal.clearLine
        }).pipe(Effect.provide(TerminalServiceLive))
      )

      expect(writes).toContain('\x1b[2K')
    })
  })

  describe('Screen modes', () => {
    let originalStdout: typeof process.stdout.write
    let writes: string[]

    beforeEach(() => {
      writes = []
      originalStdout = process.stdout.write
      process.stdout.write = ((data: unknown): boolean => {
        if (typeof data === 'string') writes.push(data)
        else if (data && typeof (data as { toString?: () => string }).toString === 'function')
          writes.push(String(data))
        return true
      }) as unknown as typeof process.stdout.write
    })

    afterEach(() => {
      process.stdout.write = originalStdout
    })

    it('should enable alternate screen', async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const terminal = yield* TerminalService
          yield* terminal.setAlternateScreen(true)
        }).pipe(Effect.provide(TerminalServiceLive))
      )

      expect(writes).toContain('\x1b[?47h')
    })

    it('should disable alternate screen', async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const terminal = yield* TerminalService
          // Enable first so disabling emits the sequence
          yield* terminal.setAlternateScreen(true)
          yield* terminal.setAlternateScreen(false)
        }).pipe(Effect.provide(TerminalServiceLive))
      )

      expect(writes).toContain('\x1b[?47l')
    })
  })

  describe('Scrolling', () => {
    let originalStdout: typeof process.stdout.write
    let writes: string[]

    beforeEach(() => {
      writes = []
      originalStdout = process.stdout.write
      process.stdout.write = ((data: unknown): boolean => {
        if (typeof data === 'string') writes.push(data)
        else if (data && typeof (data as { toString?: () => string }).toString === 'function')
          writes.push(String(data))
        return true
      }) as unknown as typeof process.stdout.write
    })

    afterEach(() => {
      process.stdout.write = originalStdout
    })

    it('should scroll up', async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const terminal = yield* TerminalService
          yield* terminal.scrollUp(3)
        }).pipe(Effect.provide(TerminalServiceLive))
      )

      expect(writes).toContain('\x1b[3S')
    })

    it('should scroll down', async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const terminal = yield* TerminalService
          yield* terminal.scrollDown(2)
        }).pipe(Effect.provide(TerminalServiceLive))
      )

      expect(writes).toContain('\x1b[2T')
    })
  })

  describe('Terminal title and bell', () => {
    let originalStdout: typeof process.stdout.write
    let writes: string[]

    beforeEach(() => {
      writes = []
      originalStdout = process.stdout.write
      process.stdout.write = ((data: unknown): boolean => {
        if (typeof data === 'string') writes.push(data)
        else if (data && typeof (data as { toString?: () => string }).toString === 'function')
          writes.push(String(data))
        return true
      }) as unknown as typeof process.stdout.write
    })

    afterEach(() => {
      process.stdout.write = originalStdout
    })

    it('should set terminal title', async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const terminal = yield* TerminalService
          yield* terminal.setTitle('Test Application')
        }).pipe(Effect.provide(TerminalServiceLive))
      )

      expect(writes).toContain('\x1b]2;Test Application\x1b\\')
    })

    it('should ring bell', async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const terminal = yield* TerminalService
          yield* terminal.bell
        }).pipe(Effect.provide(TerminalServiceLive))
      )

      expect(writes).toContain('\x07')
    })
  })

  describe('Cursor style', () => {
    let originalStdout: typeof process.stdout.write
    let writes: string[]

    beforeEach(() => {
      writes = []
      originalStdout = process.stdout.write
      process.stdout.write = ((data: unknown): boolean => {
        if (typeof data === 'string') writes.push(data)
        else if (data && typeof (data as { toString?: () => string }).toString === 'function')
          writes.push(String(data))
        return true
      }) as unknown as typeof process.stdout.write
    })

    afterEach(() => {
      process.stdout.write = originalStdout
    })

    it('should set cursor shape to block', async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const terminal = yield* TerminalService
          yield* terminal.setCursorShape('block')
        }).pipe(Effect.provide(TerminalServiceLive))
      )

      expect(writes).toContain('\x1b[1 q')
    })

    it('should set cursor shape to underline', async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const terminal = yield* TerminalService
          yield* terminal.setCursorShape('underline')
        }).pipe(Effect.provide(TerminalServiceLive))
      )

      expect(writes).toContain('\x1b[3 q')
    })

    it('should set cursor shape to bar', async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const terminal = yield* TerminalService
          yield* terminal.setCursorShape('bar')
        }).pipe(Effect.provide(TerminalServiceLive))
      )

      expect(writes).toContain('\x1b[5 q')
    })
  })

  describe('Error handling', () => {
    it('should handle write errors gracefully', async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const terminal = yield* TerminalService

          // Mock a write error
          const originalWrite = process.stdout.write
          process.stdout.write = ((...args: Parameters<typeof process.stdout.write>): boolean => {
            void args
            throw new Error('Write failed')
          }) as typeof process.stdout.write

          try {
            return yield* Effect.either(terminal.write('test'))
          } finally {
            process.stdout.write = originalWrite
          }
        }).pipe(Effect.provide(TerminalServiceLive))
      )

      expect(result._tag).toBe('Left')
    })
  })

  describe('Performance', () => {
    it('should handle many operations efficiently', async () => {
      const startTime = performance.now()

      await Effect.runPromise(
        Effect.gen(function* () {
          const terminal = yield* TerminalService

          for (let i = 0; i < 1000; i++) {
            yield* terminal.moveCursor(i % 80, i % 24)
          }
        }).pipe(Effect.provide(TerminalServiceLive))
      )

      const endTime = performance.now()
      const operationTime = endTime - startTime

      expect(operationTime).toBeLessThan(1000) // Should complete within 1 second
    })
  })
})
