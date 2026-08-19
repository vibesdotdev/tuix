import { describe, expect, test } from 'bun:test'

import { renderStyled, renderStyledSync, wrapStyledLine } from './index'
import { style } from '../style'
import { colors, color } from '../color'
import { ColorProfile } from '../color/profile'

describe('Render utilities', () => {
  test('renderStyled wraps unstyled text with reset to prevent bg bleed', () => {
    const result = renderStyled('Hello', style())
    expect(result).toContain('Hello')
    expect(result).toMatch(/^\x1b\[0m.*\x1b\[0m$/)
  })

  test('bg color does not bleed into following unstyled cells', () => {
    const greenBg = style().bg('#22c55e')
    const noStyle = style()
    const cellA = renderStyled('vibes', greenBg)
    const cellB = renderStyled(' next', noStyle)
    const combined = cellA + cellB
    expect(cellA).toContain('\x1b[48;2;34;197;94m')
    expect(cellB).toMatch(/^\x1b\[0m/)
    expect(combined).toContain('\x1b[0m')
    const lastResetIndex = combined.lastIndexOf('\x1b[0m')
    const afterReset = combined.slice(lastResetIndex + 4)
    expect(afterReset).not.toContain('\x1b[')
  })

  test('hex string foreground does not paint literal undefined', () => {
    // Theme tokens often store "#RRGGBB" strings; must coerce before ANSI.
    const result = renderStyledSync('────', { foreground: '#222222' } as any)
    expect(result).not.toContain('undefined')
    expect(result).toContain('────')
    expect(result.startsWith('\x1b[')).toBe(true)
  })

  test('wrap never splits an escape sequence', () => {
    // Escape lands exactly on the wrap boundary; the row break must not
    // slice into it (regression: literal "1m" leaking onto the next row).
    const result = renderStyledSync(
      'x'.repeat(30) + '\x1b[1mvibes',
      {},
      { width: 30, wrapText: true }
    )
    const rows = result.split('\n')
    for (const row of rows) {
      expect(row).not.toMatch(/(^|[^[])1m/) // no literal 1m without a full CSI before it
    }
    expect(rows.length).toBeGreaterThan(1)
    expect(rows[1]).toContain('vibes')
  })

  test('wrap re-emits SGR state on continuation rows', () => {
    const result = renderStyledSync(
      '\x1b[1m' + 'word '.repeat(12) + '\x1b[0m',
      {},
      { width: 30, wrapText: true }
    )
    const rows = result.split('\n')
    expect(rows.length).toBeGreaterThan(1)
    for (const row of rows) {
      expect(row.startsWith('\x1b[1m')).toBe(true)
    }
    expect(rows[rows.length - 1].endsWith('\x1b[0m')).toBe(true)
  })

  test('wrap accumulates multiple SGR sequences on continuation rows', () => {
    const rows = wrapStyledLine('\x1b[1m\x1b[31m' + 'word '.repeat(12) + '\x1b[0m', 30)
    expect(rows.length).toBeGreaterThan(1)
    for (const row of rows) {
      expect(row).toContain('\x1b[1m')
      expect(row).toContain('\x1b[31m')
    }
    expect(rows[rows.length - 1].endsWith('\x1b[0m')).toBe(true)
  })

  test('applies foreground color sequences', () => {
    const result = renderStyledSync('Hello', style().fg(colors.red))
    expect(result).toContain('\u001b[')
    expect(result).toContain('Hello')
    expect(result.endsWith('\u001b[0m')).toBe(true)
  })

  test('applies background color sequences', () => {
    const result = renderStyledSync('Hi', style().bg(colors.blue))
    expect(result).toContain('\u001b[44m')
  })

  test('applies text decorations', () => {
    const result = renderStyledSync('Hi', style().bold().underline())
    expect(result).toContain('\u001b[1m')
    expect(result).toContain('\u001b[4m')
  })

  test('adds padding around content', () => {
    const result = renderStyledSync('Hi', style().padding(1))
    const lines = result.split('\n')
    expect(lines).toHaveLength(3)
  })

  test('wraps long lines when width provided', () => {
    const result = renderStyledSync('abcdef', style(), { width: 3 })
    expect(result.split('\n')).toHaveLength(2)
  })

  test('applies borders when configured', () => {
    const result = renderStyledSync('Hi', style().border({ type: 'ascii' }))
    expect(result).toContain('+')
  })

  test('respects ColorProfile.NoColor', () => {
    const result = renderStyledSync('Hi', style().fg(color.rgb(200, 0, 0)), {
      colorProfile: ColorProfile.NoColor,
    })
    expect(result).toBe('Hi')
  })
})
