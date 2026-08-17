import { describe, expect, it } from 'bun:test'
import { sliderTrack, quantize } from './Slider.tsx'

describe('Slider.quantize', () => {
  it('clamps to 0..1', () => {
    expect(quantize(-1, 0)).toBe(0)
    expect(quantize(2, 0)).toBe(1)
    expect(quantize(Number.NaN, 0)).toBe(0)
  })

  it('snaps to discrete steps', () => {
    expect(quantize(0.34, 4)).toBe(1 / 3)
    expect(quantize(0.24, 5)).toBe(0.25)
    expect(quantize(0.9, 2)).toBe(1)
  })

  it('passes through when continuous', () => {
    expect(quantize(0.42, 0)).toBe(0.42)
  })
})

describe('Slider.sliderTrack', () => {
  it('places the handle at the value position', () => {
    expect(sliderTrack(0, 6)).toBe('●░░░░░')
    expect(sliderTrack(1, 6)).toBe('█████●')
  })

  it('quantizes before drawing', () => {
    expect(sliderTrack(0.34, 6, 4)).toBe(sliderTrack(1 / 3, 6, 4))
  })

  it('enforces a minimum width', () => {
    expect(sliderTrack(0.5, 1)).toHaveLength(3)
  })
})
