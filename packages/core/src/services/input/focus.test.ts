import { describe, test, expect } from 'bun:test'
import { extractFocusEvent, drainFocusEvents, FOCUS_IN, FOCUS_OUT } from './focus'

describe('focus CSI parse (shipped Live focusEvents path)', () => {
  test('FOCUS_IN / FOCUS_OUT constants', () => {
    expect(FOCUS_IN).toBe('\x1b[I')
    expect(FOCUS_OUT).toBe('\x1b[O')
  })

  test('extractFocusEvent focus in', () => {
    const r = extractFocusEvent(FOCUS_IN + 'abc')
    expect(r).toEqual({ event: { focused: true }, rest: 'abc' })
  })

  test('extractFocusEvent focus out', () => {
    const r = extractFocusEvent(FOCUS_OUT)
    expect(r).toEqual({ event: { focused: false }, rest: '' })
  })

  test('incomplete ESC[ waits', () => {
    expect(extractFocusEvent('\x1b')).toBeNull()
    expect(extractFocusEvent('\x1b[')).toBeNull()
  })

  test('drainFocusEvents collects sequence', () => {
    const { events, rest } = drainFocusEvents(FOCUS_IN + FOCUS_OUT + 'x')
    expect(events).toEqual([{ focused: true }, { focused: false }])
    expect(rest).toBe('x')
  })
})
