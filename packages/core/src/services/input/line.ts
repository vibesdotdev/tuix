/**
 * Line accumulation from key events — pure, unit-testable without a TTY.
 * Live Input.readLine drains a continuous Queue (PubSub subscription) with this logic.
 */

import { Effect, Queue } from 'effect'
import type { KeyEvent } from '../../types'
import { KeyType } from '@tuix/input/keyboard/keys'

export function isEnterKey(key: KeyEvent): boolean {
  if (key.type === KeyType.Enter) return true
  const k = (key.key || '').toLowerCase()
  if (k === 'enter' || k === 'return') return true
  if (key.runes === '\r' || key.runes === '\n') return true
  if (key.sequence === '\r' || key.sequence === '\n') return true
  return false
}

export function isBackspaceKey(key: KeyEvent): boolean {
  if (key.type === KeyType.Backspace) return true
  const k = (key.key || '').toLowerCase()
  return k === 'backspace' || key.sequence === '\x7f' || key.sequence === '\b'
}

/**
 * Fold one key into a line buffer. When done is true, Enter was pressed.
 */
export function applyKeyToLine(line: string, key: KeyEvent): { line: string; done: boolean } {
  if (isEnterKey(key)) {
    return { line, done: true }
  }
  if (isBackspaceKey(key)) {
    return { line: line.slice(0, -1), done: false }
  }
  // Ctrl+C / Ctrl+D do not complete a normal line (caller may cancel)
  if (key.ctrl && (key.runes === 'c' || key.runes === 'd' || key.key === 'ctrl+c')) {
    return { line, done: false }
  }
  if (key.runes && key.runes.length > 0 && !key.ctrl && !key.alt && !key.meta) {
    // Skip control runes
    if (key.runes.charCodeAt(0) >= 32 || key.runes === '\t') {
      return { line: line + key.runes, done: false }
    }
  }
  // Printable single-char key field fallback
  if (key.key && key.key.length === 1 && !key.ctrl && !key.alt && key.key.charCodeAt(0) >= 32) {
    return { line: line + key.key, done: false }
  }
  return { line, done: false }
}

/**
 * Apply a sequence of keys until Enter (or end of list).
 */
export function accumulateLineFromKeys(keys: ReadonlyArray<KeyEvent>): string {
  let line = ''
  for (const key of keys) {
    const next = applyKeyToLine(line, key)
    line = next.line
    if (next.done) return line
  }
  return line
}

/**
 * Continuous line reader: single Queue subscription, no re-subscribe per key.
 * This is the shipped Live readLine consume path (PubSub.subscribe → Queue.take loop).
 */
export function readLineFromQueue(
  queue: Queue.Queue<KeyEvent>,
  onKey?: () => Effect.Effect<void, never, never>
): Effect.Effect<string, never, never> {
  return Effect.gen(function* (_) {
    let line = ''
    while (true) {
      const key = yield* _(Queue.take(queue))
      if (onKey) yield* _(onKey())
      const next = applyKeyToLine(line, key)
      line = next.line
      if (next.done) return line
    }
  })
}
