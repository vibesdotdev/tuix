/**
 * Keyboard table tests — the parse surface every live input path depends on.
 */
import { describe, expect, it } from 'bun:test'
import { ANSI_SEQUENCES, parseChar, KeyType, KeyUtils } from './keys'

describe('ANSI_SEQUENCES table', () => {
  it('covers the arrow keys', () => {
    expect(ANSI_SEQUENCES.get('\x1b[A')?.key).toBe('up')
    expect(ANSI_SEQUENCES.get('\x1b[B')?.key).toBe('down')
    expect(ANSI_SEQUENCES.get('\x1b[C')?.key).toBe('right')
    expect(ANSI_SEQUENCES.get('\x1b[D')?.key).toBe('left')
  })

  it('covers home/end/page keys', () => {
    for (const seq of ['\x1b[H', '\x1b[F', '\x1b[5~', '\x1b[6~']) {
      expect(ANSI_SEQUENCES.has(seq)).toBe(true)
    }
  })

  it('maps every entry to a KeyEvent with a type', () => {
    for (const [seq, partial] of ANSI_SEQUENCES) {
      expect(partial.type, `entry ${JSON.stringify(seq)} missing type`).toBeDefined()
    }
  })

  it('has no duplicate sequences', () => {
    // A Map cannot hold duplicates by construction — this pins the
    // invariant and guards against future regressions to a plain object.
    expect(ANSI_SEQUENCES.size).toBeGreaterThan(40)
  })
})

describe('parseChar', () => {
  it('maps control characters to ctrl+<letter>', () => {
    expect(parseChar('\x03')).toMatchObject({ key: 'ctrl+c', ctrl: true })
    expect(parseChar('\x13')).toMatchObject({ key: 'ctrl+s', ctrl: true })
  })

  it('gives tab/enter/escape their KeyTypes', () => {
    expect(parseChar('\t').type).toBe(KeyType.Tab)
    expect(parseChar('\r').type).toBe(KeyType.Enter)
    expect(parseChar('\n').type).toBe(KeyType.Enter)
    expect(parseChar('\x1b').type).toBe(KeyType.Escape)
  })

  it('maps backspace and delete distinctly', () => {
    expect(parseChar('\b').type).toBe(KeyType.Backspace)
    // 0x7f is what terminals send for the backspace key.
    expect(parseChar('\x7f').type).toBe(KeyType.Backspace)
  })

  it('passes regular characters through as runes', () => {
    const event = parseChar('q')
    expect(event.type).toBe(KeyType.Runes)
    expect(event.runes).toBe('q')
    expect(event.key.toLowerCase()).toContain('q')
  })

  it('carries modifiers', () => {
    expect(parseChar('x', true, false, false).ctrl).toBe(true)
    expect(parseChar('x', false, true, false).alt).toBe(true)
    expect(parseChar('x', false, false, true).shift).toBe(true)
  })
})

describe('KeyUtils', () => {
  it('matches named keys', () => {
    expect(KeyUtils.matches(parseChar('\x03'), 'ctrl+c')).toBe(true)
    expect(KeyUtils.matches(parseChar('q'), 'q')).toBe(true)
  })

  it('matches any of several bindings', () => {
    expect(KeyUtils.matches(parseChar('q'), 'ctrl+c', 'q')).toBe(true)
    expect(KeyUtils.matches(parseChar('\x03'), 'ctrl+c', 'q')).toBe(true)
    expect(KeyUtils.matches(parseChar('x'), 'ctrl+c', 'q')).toBe(false)
  })

  it('isQuit matches the keys the live parser actually produces', () => {
    // The parser bakes modifiers into `key`: \x03 parses as key 'ctrl+c'.
    expect(KeyUtils.isQuit(parseChar('\x03'))).toBe(true)
    expect(KeyUtils.isQuit(parseChar('\x04'))).toBe(true)
    expect(KeyUtils.isQuit(parseChar('c'))).toBe(false)
    expect(KeyUtils.isQuit(parseChar('q'))).toBe(false)
  })

  it('isQuit also accepts the bare-letter convention', () => {
    expect(KeyUtils.isQuit({ ...parseChar('c'), ctrl: true })).toBe(true)
    expect(KeyUtils.isQuit({ ...parseChar('d'), ctrl: true })).toBe(true)
  })
})
