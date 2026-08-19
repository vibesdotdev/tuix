import { describe, expect, test } from 'bun:test'

import { renderGradientBox } from './utils'
import { border } from './presets'
import { stripAnsi } from '../core/strip'

describe('renderGradientBox', () => {
  test('emits truecolor SGR around border glyphs', () => {
    const out = renderGradientBox({
      width: 12,
      height: 5,
      border: border.rounded,
      gradient: { from: '#ff0000', to: '#0000ff' },
      content: ['hello'],
    })
    expect(out).toContain('38;2;255;0;0')
    expect(out).toContain('38;2;0;0;255')
    expect(out).toContain('╭')
    expect(out).toContain('╰')
  })

  test('content row text survives unstyled between colored verticals', () => {
    const out = renderGradientBox({
      width: 12,
      height: 5,
      border: border.thin,
      gradient: { from: '#101010', to: '#f0f0f0' },
      content: ['mid'],
    })
    const rows = out.split('\n')
    expect(rows.length).toBe(5)
    expect(rows[1]).toContain('mid')
    expect(rows[1]).toContain('│')
    // Empty content rows still carry both gradient verticals.
    expect(rows[2]).toContain('│')
  })

  test('top border endpoints interpolate through intermediate colors', () => {
    const out = renderGradientBox({
      width: 14,
      height: 4,
      border: border.thin,
      gradient: { from: '#000000', to: '#ffffff' },
    })
    // Mid-glyph of the top row should be roughly 50% gray.
    expect(out).toContain('38;2;')
    const grays = [...out.matchAll(/38;2;(\d+);(\d+);(\d+)/g)].filter(
      m => m[1] === m[2] && m[2] === m[3]
    )
    expect(grays.length).toBeGreaterThan(0)
    const values = grays.map(m => Number(m[1]))
    expect(Math.min(...values)).toBeLessThanOrEqual(64)
    expect(Math.max(...values)).toBeGreaterThanOrEqual(191)
  })

  test('structure matches a plain box when styling is stripped', () => {
    const plain = stripAnsi(
      renderGradientBox({
        width: 10,
        height: 4,
        border: border.rounded,
        content: ['ab'],
        gradient: { from: '#123456', to: '#654321' },
      })
    )
    expect(plain.split('\n')).toEqual(['╭────────╮', '│ab      │', '│        │', '╰────────╯'])
  })

  test('3-digit hex colors expand', () => {
    const out = renderGradientBox({
      width: 6,
      height: 3,
      border: border.thin,
      gradient: { from: '#f00', to: '#00f' },
    })
    expect(out).toContain('38;2;255;0;0')
  })
})
