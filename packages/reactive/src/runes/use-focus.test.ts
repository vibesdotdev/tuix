import { describe, expect, test } from 'bun:test'
import { useFocus, setFocusedId, resetFocus } from '@tuix/reactive'

describe('useFocus', () => {
  test('returns a stable focusId and focused=false by default', () => {
    resetFocus()
    const { focused, focusId } = useFocus('test-element')
    expect(focused).toBe(false)
    expect(focusId).toBe('interactive:test-element')
  })

  test('reflects focused state after setFocusedId', () => {
    resetFocus()
    const { focusId } = useFocus('test-focusable')
    setFocusedId(focusId)
    const { focused } = useFocus('test-focusable')
    expect(focused).toBe(true)
    resetFocus()
  })

  test('auto-generates an id when none is passed', () => {
    resetFocus()
    const a = useFocus()
    const b = useFocus()
    expect(a.focusId).not.toBe(b.focusId)
    expect(a.focusId.startsWith('auto:')).toBe(true)
    resetFocus()
  })
})
