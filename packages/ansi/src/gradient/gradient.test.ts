import { describe, expect, test } from 'bun:test'

import {
  textGradient,
  backgroundGradient,
  createGradient,
  rainbowGradient,
  reverseGradient,
} from './index'

const simpleGradient = createGradient([
  { position: 0, color: { type: 'rgb', r: 255, g: 0, b: 0 } },
  { position: 1, color: { type: 'rgb', r: 0, g: 0, b: 255 } },
])

describe('Gradient utilities', () => {
  test('textGradient applies ANSI sequences to characters', () => {
    const result = textGradient({ gradient: simpleGradient, text: 'Hi' })
    expect(result).toContain('\u001b[')
    expect(result.endsWith('\u001b[0m')).toBe(true)
  })

  test('backgroundGradient returns colored lines', () => {
    const lines = backgroundGradient({ gradient: simpleGradient, width: 3, height: 2 })
    expect(lines).toHaveLength(2)
    expect(lines[0]).toContain('\u001b[')
  })

  test('createGradient keeps stops order', () => {
    const gradient = createGradient([
      { position: 0, color: { type: 'rgb', r: 0, g: 0, b: 0 } },
      { position: 1, color: { type: 'rgb', r: 255, g: 255, b: 255 } },
    ])

    expect(gradient.stops[0]?.position).toBe(0)
    expect(gradient.stops[1]?.position).toBe(1)
  })

  test('reverseGradient flips gradient stops', () => {
    const reversed = reverseGradient(simpleGradient)
    expect(reversed.stops[0]?.position).toBeCloseTo(0)
    expect(reversed.stops[0]?.color).toEqual(simpleGradient.stops.at(-1)?.color)
  })

  test('rainbowGradient provides multiple color stops', () => {
    const rainbow = rainbowGradient()
    expect(rainbow.stops.length).toBeGreaterThan(3)
  })
})
