import { describe, expect, test } from 'bun:test'

import { useViewport, setViewportSize } from './viewport'

describe('viewport store', () => {
  test('initializes from the current stdout size', () => {
    const vp = useViewport()
    const size = vp()
    expect(size.cols).toBeGreaterThanOrEqual(1)
    expect(size.rows).toBeGreaterThanOrEqual(1)
  })

  test('setViewportSize updates the rune', () => {
    const vp = useViewport()
    setViewportSize(120, 40)
    expect(vp()).toEqual({ cols: 120, rows: 40 })
    setViewportSize(80, 24)
    expect(vp()).toEqual({ cols: 80, rows: 24 })
  })

  test('rejects invalid and no-op sizes', () => {
    setViewportSize(100, 30)
    setViewportSize(0, 30)
    setViewportSize(Number.NaN, 30)
    const vp = useViewport()
    expect(vp()).toEqual({ cols: 100, rows: 30 })
    // same size is a no-op (no change notification)
    setViewportSize(100, 30)
    expect(vp()).toEqual({ cols: 100, rows: 30 })
  })
})
