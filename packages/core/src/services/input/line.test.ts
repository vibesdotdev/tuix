import { describe, test, expect } from 'bun:test'
import { Effect, Queue } from 'effect'
import { applyKeyToLine, accumulateLineFromKeys, isEnterKey, readLineFromQueue } from './line'
import { KeyType } from '@tuix/input/keyboard/keys'
import type { KeyEvent } from '../../types'

const key = (partial: Partial<KeyEvent> & { key?: string }): KeyEvent => ({
  type: KeyType.Runes,
  key: partial.key ?? '',
  runes: partial.runes,
  ctrl: partial.ctrl ?? false,
  alt: partial.alt ?? false,
  shift: partial.shift ?? false,
  meta: partial.meta ?? false,
  sequence: partial.sequence ?? partial.runes ?? partial.key ?? '',
  ...partial,
})

describe('applyKeyToLine (shipped Live readLine logic)', () => {
  test('accumulates printable runes', () => {
    let line = ''
    line = applyKeyToLine(line, key({ runes: 'h' })).line
    line = applyKeyToLine(line, key({ runes: 'i' })).line
    expect(line).toBe('hi')
  })

  test('backspace removes last char', () => {
    let line = 'ab'
    const r = applyKeyToLine(line, key({ type: KeyType.Backspace, key: 'backspace' }))
    expect(r.line).toBe('a')
    expect(r.done).toBe(false)
  })

  test('enter completes line', () => {
    const r = applyKeyToLine('hello', key({ type: KeyType.Enter, key: 'enter' }))
    expect(r.done).toBe(true)
    expect(r.line).toBe('hello')
  })

  test('accumulateLineFromKeys until enter', () => {
    const line = accumulateLineFromKeys([
      key({ runes: 'o' }),
      key({ runes: 'k' }),
      key({ type: KeyType.Enter, key: 'enter' }),
      key({ runes: 'x' }),
    ])
    expect(line).toBe('ok')
  })

  test('isEnterKey recognizes enter variants', () => {
    expect(isEnterKey(key({ type: KeyType.Enter, key: 'enter' }))).toBe(true)
    expect(isEnterKey(key({ runes: '\r' }))).toBe(true)
    expect(isEnterKey(key({ runes: 'a' }))).toBe(false)
  })
})

describe('readLineFromQueue (shipped Live continuous consume path)', () => {
  test('multi-char hello + Enter yields full line (no dropped keys)', async () => {
    const q = await Effect.runPromise(Queue.unbounded<KeyEvent>())
    // Start reader first (continuous subscription) — same order as Live PubSub.subscribe
    const linePromise = Effect.runPromise(readLineFromQueue(q))
    // Publish several keys then Enter (simulates stdin burst before each take)
    for (const ch of 'hello') {
      await Effect.runPromise(Queue.offer(q, key({ runes: ch, key: ch })))
    }
    await Effect.runPromise(Queue.offer(q, key({ type: KeyType.Enter, key: 'enter' })))
    const line = await linePromise
    expect(line).toBe('hello')
  })

  test('backspace mid-line then Enter', async () => {
    const q = await Effect.runPromise(Queue.unbounded<KeyEvent>())
    const linePromise = Effect.runPromise(readLineFromQueue(q))
    await Effect.runPromise(Queue.offer(q, key({ runes: 'a' })))
    await Effect.runPromise(Queue.offer(q, key({ runes: 'b' })))
    await Effect.runPromise(Queue.offer(q, key({ type: KeyType.Backspace, key: 'backspace' })))
    await Effect.runPromise(Queue.offer(q, key({ runes: 'c' })))
    await Effect.runPromise(Queue.offer(q, key({ type: KeyType.Enter, key: 'enter' })))
    expect(await linePromise).toBe('ac')
  })
})
