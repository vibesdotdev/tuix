import { describe, expect, test } from 'bun:test'

import {
  stripAnsi,
  hasAnsi,
  countAnsi,
  extractAnsi,
  splitAnsiSegments,
  visualWidth,
  truncate,
  pad,
} from './index'

describe('ANSI core utilities', () => {
  test('stripAnsi removes escape sequences', () => {
    expect(stripAnsi('\u001b[31mRed\u001b[0m')).toBe('Red')
    expect(stripAnsi('\u001b[1mBold\u001b[0m')).toBe('Bold')
  })

  test('hasAnsi detects presence of escape sequences', () => {
    expect(hasAnsi('\u001b[32mGreen\u001b[0m')).toBe(true)
    expect(hasAnsi('Plain text')).toBe(false)
  })

  test('countAnsi counts all sequences', () => {
    expect(countAnsi('\u001b[31mRed\u001b[0m')).toBe(2)
    expect(countAnsi('No codes here')).toBe(0)
  })

  test('extractAnsi returns encountered codes', () => {
    expect(extractAnsi('X\u001b[31mR\u001b[0m')).toEqual(['\u001b[31m', '\u001b[0m'])
  })

  test('splitAnsiSegments keeps style context', () => {
    const segments = splitAnsiSegments('Hello \u001b[31mRed\u001b[0m')
    expect(segments).toEqual([
      { text: 'Hello ', codes: [] },
      { text: 'Red', codes: ['\u001b[31m'] },
    ])
  })

  test('visualWidth counts wide characters properly', () => {
    expect(visualWidth('hello')).toBe(5)
    expect(visualWidth('コンニチハ')).toBe(10)
    expect(visualWidth('\u001b[31mred\u001b[0m')).toBe(3)
  })

  test('truncate respects max width', () => {
    expect(truncate('hello world', 5)).toBe('he...')
    expect(truncate('短い', 4)).toBe('短い')
  })

  test('truncate keeps styling when nothing is truncated', () => {
    expect(truncate('\u001b[31mred\u001b[0m', 10)).toBe('\u001b[31mred\u001b[0m')
  })

  test('truncate keeps SGR prefix across the cut', () => {
    const result = truncate('\u001b[1mhello world\u001b[0m', 8)
    expect(visualWidth(result)).toBe(8)
    expect(result.startsWith('\u001b[1m')).toBe(true)
    expect(result).toContain('...')
  })

  test('truncate slices the suffix itself when it cannot fit', () => {
    expect(truncate('hello', 2)).toBe('..')
    expect(visualWidth(truncate('hello', 2))).toBe(2)
  })

  test('pad adds spacing according to alignment', () => {
    expect(pad('hi', 4)).toBe('hi  ')
    expect(pad('hi', 4, 'right')).toBe('  hi')
    expect(pad('hi', 5, 'center')).toBe(' hi  ')
  })
})
