/**
 * Tests for Built-in Command Helpers
 */

import { test, expect, describe } from 'bun:test'
import { Effect, Duration, Stream } from 'effect'
import { Cmd, Sub } from './index'

describe('Cmd', () => {
  describe('none', () => {
    test('returns null', async () => {
      const result = await Effect.runPromise(Cmd.none())
      expect(result).toBeNull()
    })
  })

  describe('batch', () => {
    test('executes multiple commands in parallel', async () => {
      const cmd1 = Effect.succeed('msg1' as const)
      const cmd2 = Effect.succeed('msg2' as const)
      const cmd3 = Cmd.none()

      const result = await Effect.runPromise(Cmd.batch([cmd1, cmd2, cmd3]))

      // Returns the first non-null message
      expect(result).toBe('msg1')
    })

    test('returns null if all commands are none', async () => {
      const result = await Effect.runPromise(Cmd.batch([Cmd.none(), Cmd.none(), Cmd.none()]))
      expect(result).toBeNull()
    })
  })

  describe('delay', () => {
    test('delays a message', async () => {
      const start = Date.now()
      const result = await Effect.runPromise(Cmd.delay(Duration.millis(100), 'delayed'))
      const elapsed = Date.now() - start

      expect(result).toBe('delayed')
      expect(elapsed).toBeGreaterThanOrEqual(95) // Allow some tolerance
    })
  })

  describe('fromEffect', () => {
    test('maps success to message', async () => {
      const effect = Effect.succeed(42)
      const cmd = Cmd.fromEffect(
        effect,
        value => ({ type: 'success' as const, value }),
        error => ({ type: 'error' as const, error })
      )

      const result = await Effect.runPromise(cmd)
      expect(result).toEqual({ type: 'success', value: 42 })
    })

    test('maps error to message', async () => {
      const effect = Effect.fail('oops')
      const cmd = Cmd.fromEffect(
        effect,
        value => ({ type: 'success' as const, value }),
        error => ({ type: 'error' as const, error })
      )

      const result = await Effect.runPromise(cmd)
      expect(result).toEqual({ type: 'error', error: 'oops' })
    })
  })

  describe('fetch', () => {
    test('fetches data successfully', async () => {
      // Mock fetch for testing
      global.fetch = async (url: string) =>
        ({
          json: async () => ({ data: 'test' }),
        }) as any

      const cmd = Cmd.fetch(
        'https://api.example.com/data',
        data => ({ type: 'success' as const, data }),
        error => ({ type: 'error' as const, error })
      )

      const result = await Effect.runPromise(cmd)
      expect(result).toEqual({ type: 'success', data: { data: 'test' } })
    })
  })

  describe('exec', () => {
    test('executes shell command', async () => {
      const cmd = Cmd.exec(
        'echo hello',
        output => ({ type: 'success' as const, output }),
        error => ({ type: 'error' as const, error })
      )

      const result = await Effect.runPromise(cmd)
      expect(result).toMatchObject({ type: 'success' })
      if (result && typeof result === 'object' && 'output' in result) {
        expect(result.output).toContain('hello')
      }
    })
  })

  describe('map', () => {
    test('maps command message', async () => {
      const cmd = Effect.succeed('inner')
      const mapped = Cmd.map(cmd, msg => ({ wrapped: msg }))

      const result = await Effect.runPromise(mapped)
      expect(result).toEqual({ wrapped: 'inner' })
    })

    test('preserves null', async () => {
      const cmd = Cmd.none()
      const mapped = Cmd.map(cmd, msg => ({ wrapped: msg }))

      const result = await Effect.runPromise(mapped)
      expect(result).toBeNull()
    })
  })
})

describe('Sub', () => {
  describe('none', () => {
    test('returns empty stream', async () => {
      const sub = Sub.none()
      const items = await Effect.runPromise(Stream.runCollect(sub))
      expect(Array.from(items)).toEqual([])
    })
  })

  describe('interval', () => {
    test('emits messages at interval', async () => {
      const sub = Sub.interval(Duration.millis(50), 'tick')

      // Take first 3 messages
      const items = await Effect.runPromise(Stream.runCollect(Stream.take(sub, 3)))

      const array = Array.from(items)
      expect(array).toEqual(['tick', 'tick', 'tick'])
    })
  })

  describe('fromStream', () => {
    test('maps stream values to messages', async () => {
      const stream = Stream.make(1, 2, 3)
      const sub = Sub.fromStream(stream, n => ({ type: 'number' as const, n }))

      const items = await Effect.runPromise(Stream.runCollect(sub))
      const array = Array.from(items)

      expect(array).toEqual([
        { type: 'number', n: 1 },
        { type: 'number', n: 2 },
        { type: 'number', n: 3 },
      ])
    })
  })

  describe('batch', () => {
    test('merges multiple subscriptions', async () => {
      const sub1 = Stream.make('a', 'b')
      const sub2 = Stream.make('c', 'd')

      const combined = Sub.batch([sub1, sub2])
      const items = await Effect.runPromise(Stream.runCollect(combined))
      const array = Array.from(items)

      // Order might vary due to merging, so check length and contents
      expect(array.length).toBe(4)
      expect(array).toContain('a')
      expect(array).toContain('b')
      expect(array).toContain('c')
      expect(array).toContain('d')
    })

    test('runs non-terminating subscriptions concurrently', async () => {
      // mergeAll defaults to concurrency 1: the first stream never ends and
      // the second never emits. batch must merge all streams unbounded.
      const sub1 = Stream.repeatEffect(
        Effect.sleep(Duration.millis(5)).pipe(Effect.map(() => 'a' as const))
      )
      const sub2 = Stream.repeatEffect(
        Effect.sleep(Duration.millis(7)).pipe(Effect.map(() => 'b' as const))
      )

      const result = await Promise.race([
        Effect.runPromise(Stream.runCollect(Stream.take(Sub.batch([sub1, sub2]), 6))).then(
          chunk => ({ ok: true as const, items: Array.from(chunk) })
        ),
        new Promise<{ ok: false }>(resolve => setTimeout(() => resolve({ ok: false }), 2000)),
      ])

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.items.length).toBe(6)
        expect(result.items).toContain('b')
      }
    })
  })

  describe('map', () => {
    test('maps subscription messages', async () => {
      const sub = Stream.make(1, 2, 3)
      const mapped = Sub.map(sub, n => n * 2)

      const items = await Effect.runPromise(Stream.runCollect(mapped))
      const array = Array.from(items)

      expect(array).toEqual([2, 4, 6])
    })
  })
})
