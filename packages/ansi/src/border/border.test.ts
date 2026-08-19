import { test, expect, describe } from 'bun:test'
import { border, borderPresets } from './presets'
import {
  borderStyle,
  getBorderFromStyle,
  hasSide,
  combineSides,
  removeSide,
  fromPattern,
  renderBox,
} from './utils'
import { BorderSide } from '../types'

describe('Border Presets', () => {
  test('should have all required border character sets', () => {
    const borderTypes = ['thin', 'thick', 'double', 'rounded', 'ascii', 'dotted', 'dashed'] as const

    borderTypes.forEach(type => {
      expect(border[type]).toBeDefined()
      expect(border[type].topLeft).toBeTruthy()
      expect(border[type].topRight).toBeTruthy()
      expect(border[type].bottomLeft).toBeTruthy()
      expect(border[type].bottomRight).toBeTruthy()
      expect(border[type].horizontal).toBeTruthy()
      expect(border[type].vertical).toBeTruthy()
    })
  })

  test('should have correct thin border characters', () => {
    expect(border.thin.topLeft).toBe('┌')
    expect(border.thin.horizontal).toBe('─')
    expect(border.thin.topRight).toBe('┐')
    expect(border.thin.vertical).toBe('│')
  })

  test('should have correct ascii border characters', () => {
    expect(border.ascii.topLeft).toBe('+')
    expect(border.ascii.horizontal).toBe('-')
    expect(border.ascii.topRight).toBe('+')
    expect(border.ascii.vertical).toBe('|')
  })

  test('should have all border presets', () => {
    const presetNames = [
      'box',
      'roundedBox',
      'heavyBox',
      'doubleBox',
      'horizontal',
      'vertical',
      'compatible',
    ] as const

    presetNames.forEach(preset => {
      expect(borderPresets[preset]).toBeDefined()
      expect(borderPresets[preset].type).toBeDefined()
      expect(borderPresets[preset].sides).toBeDefined()
    })
  })
})

describe('Border Utilities', () => {
  describe('borderStyle', () => {
    test('should create border style with defaults', () => {
      const style = borderStyle('thin')
      expect(style.type).toBe('thin')
      expect(style.sides).toBe(BorderSide.All)
      expect(style.color).toBeUndefined()
    })

    test('should create border style with options', () => {
      const style = borderStyle('thick', {
        sides: BorderSide.Top | BorderSide.Bottom,
      })
      expect(style.type).toBe('thick')
      expect(style.sides).toBe(BorderSide.Top | BorderSide.Bottom)
    })
  })

  describe('getBorderFromStyle', () => {
    test('should return correct border for each style type', () => {
      expect(getBorderFromStyle({ type: 'thin', sides: BorderSide.All })).toBe(border.thin)
      expect(getBorderFromStyle({ type: 'thick', sides: BorderSide.All })).toBe(border.thick)
      expect(getBorderFromStyle({ type: 'double', sides: BorderSide.All })).toBe(border.double)
      expect(getBorderFromStyle({ type: 'rounded', sides: BorderSide.All })).toBe(border.rounded)
      expect(getBorderFromStyle({ type: 'ascii', sides: BorderSide.All })).toBe(border.ascii)
      expect(getBorderFromStyle({ type: 'dotted', sides: BorderSide.All })).toBe(border.dotted)
    })

    test('should default to thin border for unknown type', () => {
      // @ts-expect-error Testing invalid type
      expect(getBorderFromStyle({ type: 'unknown', sides: BorderSide.All })).toBe(border.thin)
    })
  })

  describe('hasSide', () => {
    test('should correctly identify sides', () => {
      const sides = BorderSide.Top | BorderSide.Right

      expect(hasSide(sides, BorderSide.Top)).toBe(true)
      expect(hasSide(sides, BorderSide.Right)).toBe(true)
      expect(hasSide(sides, BorderSide.Bottom)).toBe(false)
      expect(hasSide(sides, BorderSide.Left)).toBe(false)
    })

    test('should work with All sides', () => {
      expect(hasSide(BorderSide.All, BorderSide.Top)).toBe(true)
      expect(hasSide(BorderSide.All, BorderSide.Right)).toBe(true)
      expect(hasSide(BorderSide.All, BorderSide.Bottom)).toBe(true)
      expect(hasSide(BorderSide.All, BorderSide.Left)).toBe(true)
    })

    test('should work with None sides', () => {
      expect(hasSide(BorderSide.None, BorderSide.Top)).toBe(false)
      expect(hasSide(BorderSide.None, BorderSide.Right)).toBe(false)
      expect(hasSide(BorderSide.None, BorderSide.Bottom)).toBe(false)
      expect(hasSide(BorderSide.None, BorderSide.Left)).toBe(false)
    })
  })

  describe('combineSides', () => {
    test('should combine multiple sides', () => {
      const combined = combineSides(BorderSide.Top, BorderSide.Bottom)
      expect(hasSide(combined, BorderSide.Top)).toBe(true)
      expect(hasSide(combined, BorderSide.Bottom)).toBe(true)
      expect(hasSide(combined, BorderSide.Left)).toBe(false)
      expect(hasSide(combined, BorderSide.Right)).toBe(false)
    })

    test('should handle no sides', () => {
      const combined = combineSides()
      expect(combined).toBe(BorderSide.None)
    })

    test('should handle duplicate sides', () => {
      const combined = combineSides(BorderSide.Top, BorderSide.Top, BorderSide.Right)
      expect(hasSide(combined, BorderSide.Top)).toBe(true)
      expect(hasSide(combined, BorderSide.Right)).toBe(true)
    })
  })

  describe('removeSide', () => {
    test('should remove specific side', () => {
      const sides = BorderSide.All
      const withoutTop = removeSide(sides, BorderSide.Top)

      expect(hasSide(withoutTop, BorderSide.Top)).toBe(false)
      expect(hasSide(withoutTop, BorderSide.Right)).toBe(true)
      expect(hasSide(withoutTop, BorderSide.Bottom)).toBe(true)
      expect(hasSide(withoutTop, BorderSide.Left)).toBe(true)
    })

    test('should handle removing non-existent side', () => {
      const sides = BorderSide.Top
      const result = removeSide(sides, BorderSide.Bottom)
      expect(result).toBe(BorderSide.Top)
    })
  })

  describe('fromPattern', () => {
    test('should create border from valid pattern', () => {
      const pattern = '+ - + | + | + - +'
      const customBorder = fromPattern(pattern)

      expect(customBorder.topLeft).toBe('+')
      expect(customBorder.horizontal).toBe('-')
      expect(customBorder.topRight).toBe('+')
      expect(customBorder.vertical).toBe('|')
      expect(customBorder.cross).toBe('+')
    })

    test('should throw error for insufficient parts', () => {
      expect(() => fromPattern('+ - +')).toThrow('Border pattern must have at least 6 parts')
    })

    test('should handle minimal pattern', () => {
      const pattern = '+ - + | + |'
      const customBorder = fromPattern(pattern)

      expect(customBorder.topLeft).toBe('+')
      expect(customBorder.horizontal).toBe('-')
      expect(customBorder.topRight).toBe('+')
      expect(customBorder.vertical).toBe('|')
    })
  })

  describe('renderBox', () => {
    test('should render simple box', () => {
      const result = renderBox({
        width: 5,
        height: 3,
        border: border.ascii,
        sides: BorderSide.All,
      })

      const expected = ['+---+', '|   |', '+---+'].join('\n')

      expect(result).toBe(expected)
    })

    test('should render box with content', () => {
      const result = renderBox({
        width: 7,
        height: 4,
        border: border.ascii,
        content: ['Hi', 'Test'],
      })

      const expected = ['+-----+', '|Hi   |', '|Test |', '+-----+'].join('\n')

      expect(result).toBe(expected)
    })

    test('should render box with padding', () => {
      const result = renderBox({
        width: 9,
        height: 3,
        border: border.ascii,
        content: ['Hi'],
        padding: 1,
      })

      const expected = ['+-------+', '| Hi    |', '+-------+'].join('\n')

      expect(result).toBe(expected)
    })

    test('should render partial borders', () => {
      const result = renderBox({
        width: 5,
        height: 3,
        border: border.ascii,
        sides: BorderSide.Top | BorderSide.Bottom,
      })

      // No side borders → inner width = width (not width - 2).
      const expected = ['-----', '     ', '-----'].join('\n')

      expect(result).toBe(expected)
    })

    test('should render with unicode borders', () => {
      const result = renderBox({
        width: 4,
        height: 3,
        border: border.thin,
      })

      const expected = ['┌──┐', '│  │', '└──┘'].join('\n')

      expect(result).toBe(expected)
    })
  })
})

describe('BorderSide enum', () => {
  test('should have correct flag values', () => {
    expect(BorderSide.None).toBe(0)
    expect(BorderSide.Top).toBe(1)
    expect(BorderSide.Right).toBe(2)
    expect(BorderSide.Bottom).toBe(4)
    expect(BorderSide.Left).toBe(8)
    expect(BorderSide.All).toBe(15) // 1 + 2 + 4 + 8
  })

  test('should work with bitwise operations', () => {
    const topAndBottom = BorderSide.Top | BorderSide.Bottom
    expect(topAndBottom).toBe(5) // 1 + 4

    const leftAndRight = BorderSide.Left | BorderSide.Right
    expect(leftAndRight).toBe(10) // 2 + 8
  })
})
