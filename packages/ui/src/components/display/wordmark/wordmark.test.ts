import { describe, expect, test } from 'bun:test'

import { wordmarkRows } from './Wordmark'
import { sparklineBraille } from '../../data/sparkline/Sparkline'
import { stripAnsi } from '@tuix/ansi'

describe('wordmarkRows', () => {
  test('renders two terminal rows for the banner', () => {
    const [top, bottom] = wordmarkRows({ text: 'HI', from: '#ffffff', to: '#ffffff' })
    expect(typeof top).toBe('string')
    expect(typeof bottom).toBe('string')
    expect(stripAnsi(top).length).toBeGreaterThan(0)
  })

  test('each glyph is 3 columns wide with 1-column gaps', () => {
    const [top] = wordmarkRows({ text: 'AB', from: '#111111', to: '#222222' })
    expect(stripAnsi(top).length).toBe(3 + 1 + 3)
  })

  test('I is a serifed column: full-width bars top and bottom', () => {
    const [top, bottom] = wordmarkRows({ text: 'I', from: '#333333', to: '#333333' })
    // I = [111,010,010,111]: top pair (111,010) → ▀█▀; bottom pair (010,111) → ▄█▄
    expect(stripAnsi(top)).toBe('▀█▀')
    expect(stripAnsi(bottom)).toBe('▄█▄')
  })

  test('T has a bar over a bare stem', () => {
    const [top, bottom] = wordmarkRows({ text: 'T', from: '#333333', to: '#333333' })
    expect(stripAnsi(top)).toBe('▀█▀')
    expect(stripAnsi(bottom)).toBe(' █ ')
  })

  test('gradient interpolates per glyph', () => {
    const [top] = wordmarkRows({ text: 'AAA', from: '#000000', to: '#ffffff' })
    const colors = [...top.matchAll(/38;2;(\d+);(\d+);(\d+)/g)].map(m => Number(m[1]))
    expect(colors[0]!).toBe(0)
    expect(colors[colors.length - 1]!).toBe(255)
    expect(colors[1]!).toBeGreaterThan(0)
    expect(colors[1]!).toBeLessThan(255)
  })

  test('unknown characters fall back to blank glyphs', () => {
    const [top] = wordmarkRows({ text: '@', from: '#000000', to: '#ffffff' })
    expect(stripAnsi(top)).toBe('   ')
  })
})

describe('sparklineBraille', () => {
  test('flat series renders a constant full band (matches bar behavior)', () => {
    // span 0 → step 1, same convention as sparklineBars: constant signal
    // fills the chart height.
    const out = sparklineBraille([0, 0, 0, 0])
    expect(out).toMatch(/⣿+/)
  })

  test('all-max series fills every dot row (⣿) at height 1', () => {
    const out = sparklineBraille([9, 9, 9, 9], 2)
    expect(out).toContain('⣿')
  })

  test('two rows tall returns two lines', () => {
    const out = sparklineBraille([1, 5, 2, 8, 3], 10, 2)
    const lines = out.split('\n')
    expect(lines.length).toBe(2)
    expect(lines[0]!.length).toBe(lines[1]!.length)
  })

  test('a peak fills the top row of the top cell', () => {
    // min=0 max=1: peak point at full height 4 → dot row 0 of cell row 0.
    const out = sparklineBraille([0, 1, 0], 3)
    const line = out.split('\n')[0]!
    // The middle cell should have dot 1 set (bit 0) — glyph in range ⠁..⠿.
    const code = line.codePointAt(1)
    expect(code).toBeGreaterThanOrEqual(0x2801)
    expect(code!).toBeLessThanOrEqual(0x28ff)
  })

  test('non-finite values leave an empty column', () => {
    const out = sparklineBraille([1, Number.NaN, 1], 3)
    const line = out.split('\n')[0]!
    expect(line[1]).toBe('⠀')
  })
})
