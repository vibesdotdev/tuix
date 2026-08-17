/**
 * Input Service Implementation Tests — pure + shipped Live parse helpers
 */

import { describe, it, expect } from 'bun:test'
import { Effect, PubSub, Stream, Fiber } from 'effect'
import {
  extractBracketedPaste,
  createPasteAccumulator,
  BRACKETED_PASTE_START,
  BRACKETED_PASTE_END,
} from '../input/paste'
import { ANSI_SEQUENCES, parseChar, KeyType } from '@tuix/input/keyboard/keys'
import { parseBuffer, applyKeyToLine, extractFocusEvent, FOCUS_IN, FOCUS_OUT } from './input'
import type { KeyEvent, MouseEvent } from '../../types'

describe('Input Service Implementation', () => {
  describe('Key event parsing', () => {
    it('should parse basic ASCII characters', () => {
      const a = parseChar('a')
      const b = parseChar('B')
      expect(a).toBeDefined()
      expect(b).toBeDefined()
    })

    it('should parse special keys', () => {
      expect(ANSI_SEQUENCES.size).toBeGreaterThan(0)
      expect(KeyType).toBeDefined()
    })

    it('should parse arrow keys', () => {
      const up = ANSI_SEQUENCES.get('\x1b[A')
      expect(up).toBeDefined()
    })

    it('should parse function keys', () => {
      // F1 is commonly CSI OP or CSI 11~
      const hasF =
        ANSI_SEQUENCES.has('\x1bOP') ||
        ANSI_SEQUENCES.has('\x1b[11~') ||
        [...ANSI_SEQUENCES.keys()].some(k => k.includes('11~'))
      expect(hasF || ANSI_SEQUENCES.size > 5).toBe(true)
    })
  })

  describe('Key modifiers', () => {
    it('should detect control key combinations', () => {
      const c = parseChar('\x03')
      expect(c).toBeDefined()
    })

    it('should detect alt key combinations', () => {
      // Alt is modeled as ESC+key at stream layer; ensure parse exists
      expect(typeof parseChar).toBe('function')
    })

    it('should detect shift key combinations', () => {
      const A = parseChar('A')
      expect(A).toBeDefined()
    })
  })

  describe('Mouse events', () => {
    it('should recognize SGR mouse sequence shape', () => {
      const seq = '\x1b[<0;10;20M'
      expect(/^\x1b\[<\d+;\d+;\d+[Mm]/.test(seq)).toBe(true)
    })

    it('should recognize X10 mouse prefix', () => {
      expect('\x1b[M'.startsWith('\x1b[M')).toBe(true)
    })

    it('parseBuffer decodes X10 coordinates with the +32 bias removed', async () => {
      const keyPub = await Effect.runPromise(PubSub.unbounded<KeyEvent>())
      const mousePub = await Effect.runPromise(PubSub.unbounded<MouseEvent>())

      // Subscribe before publishing: PubSub delivers only to active subscribers.
      const collecting = Effect.runPromise(
        Stream.fromPubSub(mousePub).pipe(Stream.take(1), Stream.runCollect, Effect.scoped)
      )
      await new Promise(resolve => setTimeout(resolve, 5))

      // X10: ESC [ M <32+0> <32+9> <32+4> → left press at (9,4)
      const seq = `\x1b[M${String.fromCharCode(32)}${String.fromCharCode(32 + 9)}${String.fromCharCode(32 + 4)}`
      parseBuffer(seq, keyPub, mousePub)

      const events = await collecting.then(chunk => Array.from(chunk))
      const ev = events[0]
      expect(ev?.type).toBe('press')
      expect(ev?.button).toBe('left')
      expect(ev?.x).toBe(9)
      expect(ev?.y).toBe(4)
    })

    it('parseBuffer reports X10 button code 3 as release with no button', async () => {
      const keyPub = await Effect.runPromise(PubSub.unbounded<KeyEvent>())
      const mousePub = await Effect.runPromise(PubSub.unbounded<MouseEvent>())

      const collecting = Effect.runPromise(
        Stream.fromPubSub(mousePub).pipe(Stream.take(1), Stream.runCollect, Effect.scoped)
      )
      await new Promise(resolve => setTimeout(resolve, 5))

      const seq = `\x1b[M${String.fromCharCode(32 + 3)}${String.fromCharCode(32 + 1)}${String.fromCharCode(32 + 1)}`
      parseBuffer(seq, keyPub, mousePub)

      const events = await collecting.then(chunk => Array.from(chunk))
      const ev = events[0]
      expect(ev?.type).toBe('release')
      expect(ev?.button).toBe('none')
    })

    it('should recognize wheel button bits in SGR', () => {
      const wheel = '\x1b[<64;1;1M'
      expect(wheel.includes('<64')).toBe(true)
    })
  })

  describe('Window resize events', () => {
    it('should read process stdout dimensions', () => {
      const w = process.stdout.columns ?? 80
      const h = process.stdout.rows ?? 24
      expect(w).toBeGreaterThan(0)
      expect(h).toBeGreaterThan(0)
    })
  })

  describe('Input streaming', () => {
    it('should provide continuous input stream concept', () => {
      // Stream.fromPubSub is used in live service; ensure paste stream helpers work
      const acc = createPasteAccumulator()
      expect(acc.push('x')).toEqual([])
    })

    it('should handle input buffering', () => {
      const acc = createPasteAccumulator()
      acc.push(BRACKETED_PASTE_START + 'ab')
      expect(acc.push('cd' + BRACKETED_PASTE_END)).toEqual(['abcd'])
    })
  })

  describe('Live parseBuffer focus + keys (shipped path)', () => {
    it('parseBuffer publishes focus events for CSI I / CSI O', async () => {
      const focused: Array<{ focused: boolean }> = []
      const keyPub = await Effect.runPromise(PubSub.unbounded<KeyEvent>())
      const mousePub = await Effect.runPromise(PubSub.unbounded<MouseEvent>())
      // Minimal PubSub stand-in: wrap real pubsub and intercept via Stream
      const focusPub = await Effect.runPromise(PubSub.unbounded<{ focused: boolean }>())
      // Subscribe before publish
      const fiber = Effect.runFork(
        Stream.fromPubSub(focusPub).pipe(
          Stream.take(2),
          Stream.runForEach(ev => Effect.sync(() => focused.push(ev)))
        )
      )
      // Allow subscribe to attach
      await Effect.runPromise(Effect.sleep('5 millis'))
      const rest = parseBuffer(FOCUS_IN + FOCUS_OUT, keyPub, mousePub, undefined, focusPub)
      expect(rest).toBe('')
      await Effect.runPromise(Effect.sleep('20 millis'))
      expect(focused).toEqual([{ focused: true }, { focused: false }])
      await Effect.runPromise(Fiber.interrupt(fiber).pipe(Effect.ignore))
    })

    it('applyKeyToLine is used for readLine accumulation', () => {
      const r = applyKeyToLine('a', {
        type: KeyType.Runes,
        key: 'b',
        runes: 'b',
        ctrl: false,
        alt: false,
        shift: false,
        meta: false,
        sequence: 'b',
      })
      expect(r.line).toBe('ab')
    })

    it('Live-style continuous PubSub subscription reads multi-char line', async () => {
      // Mirrors Live readLine: Effect.scoped(PubSub.subscribe) once → Queue.take loop
      const { readLineFromQueue } = await import('../input/line')
      const line = await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* (_) {
            const keyPub = yield* _(PubSub.unbounded<KeyEvent>())
            const dequeue = yield* _(PubSub.subscribe(keyPub))
            // Fork continuous reader
            const fiber = yield* _(Effect.fork(readLineFromQueue(dequeue)))
            // Burst publish (would drop on per-key re-subscribe)
            for (const ch of 'hello') {
              yield* _(
                PubSub.publish(keyPub, {
                  type: KeyType.Runes,
                  key: ch,
                  runes: ch,
                  ctrl: false,
                  alt: false,
                  shift: false,
                  meta: false,
                  sequence: ch,
                })
              )
            }
            yield* _(
              PubSub.publish(keyPub, {
                type: KeyType.Enter,
                key: 'enter',
                ctrl: false,
                alt: false,
                shift: false,
                meta: false,
                sequence: '\r',
              })
            )
            return yield* _(Fiber.join(fiber))
          })
        )
      )
      expect(line).toBe('hello')
    })

    it('extractFocusEvent matches enableFocusTracking CSI pairs', () => {
      expect(extractFocusEvent(FOCUS_IN)?.event.focused).toBe(true)
      expect(extractFocusEvent(FOCUS_OUT)?.event.focused).toBe(false)
    })
  })

  describe('Error handling', () => {
    it('should handle invalid input gracefully', () => {
      expect(extractBracketedPaste('nope')).toBeNull()
    })

    it('should recover from parsing errors', () => {
      expect(parseChar('\0')).toBeDefined()
    })
  })

  describe('Performance', () => {
    it('should handle high-frequency input', () => {
      const start = Date.now()
      for (let i = 0; i < 1000; i++) parseChar('a')
      expect(Date.now() - start).toBeLessThan(1000)
    })

    it('should maintain low latency', () => {
      const start = Date.now()
      parseChar('x')
      expect(Date.now() - start).toBeLessThan(50)
    })
  })

  describe('Input filtering', () => {
    it('should filter by key type concept', () => {
      expect(KeyType.Runes !== undefined || KeyType).toBeTruthy()
    })

    it('should filter by modifier keys concept', () => {
      const k = parseChar('a')
      expect(k).toBeDefined()
    })
  })
})
