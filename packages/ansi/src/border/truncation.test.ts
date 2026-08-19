import { describe, expect, test } from 'bun:test'
import { renderBox, getBorderFromStyle } from './utils'
import { border } from './presets'
import { BorderSide } from './types'
import { truncate, pad, visualWidth } from '../core/width'

describe('renderBox truncation', () => {
  test('truncates content wider than innerWidth', () => {
    const result = renderBox({
      width: 6,
      height: 3,
      border: border.thin,
      content: ['xxxxxxxxxxxxxxxxxxxxxxxx'],
      padding: 0,
    })
    const lines = result.split('\n')
    // Top border: ┌────┐ (6 wide)
    expect(visualWidth(lines[0]!)).toBe(6)
    // Content line: │xxxx│ (4 content + 2 borders = 6)
    expect(visualWidth(lines[1]!)).toBe(6)
    // Content truncated to 4 chars, not overflowing
    expect(lines[1]!.replace(/\x1b\[[0-9;]*m/g, '').length).toBe(6)
    // Bottom border
    expect(visualWidth(lines[2]!)).toBe(6)
  })

  test('pads content narrower than innerWidth', () => {
    const result = renderBox({
      width: 10,
      height: 3,
      border: border.thin,
      content: ['hi'],
      padding: 0,
    })
    const lines = result.split('\n')
    expect(visualWidth(lines[0]!)).toBe(10)
    expect(lines[1]!.includes('hi')).toBe(true)
    expect(visualWidth(lines[1]!)).toBe(10)
  })

  test('partial borders (top+bottom only) use full width', () => {
    const result = renderBox({
      width: 7,
      height: 3,
      border: border.ascii,
      sides: BorderSide.Top | BorderSide.Bottom,
      content: ['abcde'],
      padding: 0,
    })
    const lines = result.split('\n')
    // No side borders → innerWidth = width = 7
    expect(visualWidth(lines[0]!)).toBe(7)
    expect(visualWidth(lines[1]!)).toBe(7)
    expect(visualWidth(lines[2]!)).toBe(7)
  })

  test('partial borders (left+right only) have no top/bottom', () => {
    const result = renderBox({
      width: 6,
      height: 2,
      border: border.thin,
      sides: BorderSide.Left | BorderSide.Right,
      content: ['ab', 'cd'],
      padding: 0,
    })
    const lines = result.split('\n')
    expect(lines.length).toBe(2)
    expect(lines[0]!.startsWith('│')).toBe(true)
    expect(lines[0]!.endsWith('│')).toBe(true)
  })
})

describe('getBorderFromStyle', () => {
  test('solid maps to thick', () => {
    const b = getBorderFromStyle({ type: 'solid' })
    expect(b.horizontal).toBe(border.thick.horizontal)
  })

  test('double-dashed maps to double', () => {
    const b = getBorderFromStyle({ type: 'double-dashed' })
    expect(b.horizontal).toBe(border.double.horizontal)
  })

  test('dashed maps to dashed preset', () => {
    const b = getBorderFromStyle({ type: 'dashed' })
    expect(b).toBeDefined()
    expect(b.horizontal.length).toBeGreaterThan(0)
  })
})
