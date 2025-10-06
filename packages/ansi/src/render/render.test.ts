import { describe, expect, test } from 'bun:test'

import { renderStyled, renderStyledSync } from './index'
import { style } from '../style'
import { colors, color } from '../color'
import { ColorProfile } from '../color/profile'

describe('Render utilities', () => {
  test('renderStyled returns plain text when no styles applied', () => {
    expect(renderStyled('Hello', style())).toBe('Hello')
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
