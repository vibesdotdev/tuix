/**
 * Color Conversion Tests
 */

import { describe, test, expect } from 'bun:test'
import {
  ANSI_16_RGB,
  hexToRgb,
  colorToRgb,
  rgbToAnsi256,
  rgbToAnsi,
  toAnsiSequence,
  type RGB,
} from './convert'
import { ColorProfile } from './profile'
import { rgb, hex, ansi, ansi256, adaptive, none } from './utils'

describe('ANSI_16_RGB', () => {
  test('should have 16 color mappings', () => {
    expect(Object.keys(ANSI_16_RGB).length).toBe(16)
  })

  test('should have black at index 0', () => {
    expect(ANSI_16_RGB[0]).toEqual({ r: 0, g: 0, b: 0 })
  })

  test('should have white at index 15', () => {
    expect(ANSI_16_RGB[15]).toEqual({ r: 255, g: 255, b: 255 })
  })

  test('should have red at index 1', () => {
    const red = ANSI_16_RGB[1]
    expect(red?.r).toBeGreaterThan(100)
    expect(red?.g).toBeLessThan(50)
    expect(red?.b).toBeLessThan(50)
  })

  test('should have green at index 2', () => {
    const green = ANSI_16_RGB[2]
    expect(green?.r).toBeLessThan(50)
    expect(green?.g).toBeGreaterThan(100)
    expect(green?.b).toBeLessThan(50)
  })

  test('should have blue at index 4', () => {
    const blue = ANSI_16_RGB[4]
    expect(blue?.r).toBeLessThan(50)
    expect(blue?.g).toBeLessThan(50)
    expect(blue?.b).toBeGreaterThan(100)
  })
})

describe('hexToRgb', () => {
  test('should convert 6-digit hex to RGB', () => {
    const result = hexToRgb('#ff0000')
    expect(result._tag).toBe('Some')
    if (result._tag === 'Some') {
      expect(result.value).toEqual({ r: 255, g: 0, b: 0 })
    }
  })

  test('should handle hex without hash', () => {
    const result = hexToRgb('00ff00')
    expect(result._tag).toBe('Some')
    if (result._tag === 'Some') {
      expect(result.value).toEqual({ r: 0, g: 255, b: 0 })
    }
  })

  test('should handle uppercase hex', () => {
    const result = hexToRgb('#0000FF')
    expect(result._tag).toBe('Some')
    if (result._tag === 'Some') {
      expect(result.value).toEqual({ r: 0, g: 0, b: 255 })
    }
  })

  test('should return None for invalid hex', () => {
    const result = hexToRgb('#gggggg')
    expect(result._tag).toBe('None')
  })

  test('should return None for wrong length hex', () => {
    const result = hexToRgb('#ff')
    expect(result._tag).toBe('None')
  })

  test('should handle grayscale colors', () => {
    const result = hexToRgb('#808080')
    expect(result._tag).toBe('Some')
    if (result._tag === 'Some') {
      expect(result.value).toEqual({ r: 128, g: 128, b: 128 })
    }
  })
})

describe('colorToRgb', () => {
  test('should convert RGB color', () => {
    const result = colorToRgb(rgb(255, 128, 64))
    expect(result).toEqual({ r: 255, g: 128, b: 64 })
  })

  test('should convert hex color', () => {
    const result = colorToRgb(hex('#ff8040'))
    expect(result).toEqual({ r: 255, g: 128, b: 64 })
  })

  test('should convert ANSI color', () => {
    const result = colorToRgb(ansi(1)) // Red
    expect(result).toEqual(ANSI_16_RGB[1])
  })

  test('should convert ANSI 256 color (16-color range)', () => {
    const result = colorToRgb(ansi256(1))
    expect(result).toEqual(ANSI_16_RGB[1])
  })

  test('should convert ANSI 256 grayscale', () => {
    const result = colorToRgb(ansi256(244)) // Gray
    expect(result.r).toBe(result.g)
    expect(result.g).toBe(result.b)
  })

  test('should convert ANSI 256 color cube', () => {
    const result = colorToRgb(ansi256(196)) // Bright red
    expect(result.r).toBeGreaterThan(200)
    expect(result.g).toBeLessThan(50)
    expect(result.b).toBeLessThan(50)
  })

  test('should convert adaptive color (use dark)', () => {
    const lightColor = rgb(255, 255, 255)
    const darkColor = rgb(0, 0, 0)
    const result = colorToRgb(adaptive(lightColor, darkColor))
    expect(result).toEqual({ r: 0, g: 0, b: 0 })
  })

  test('should convert none color to black', () => {
    const result = colorToRgb(none())
    expect(result).toEqual({ r: 0, g: 0, b: 0 })
  })
})

describe('rgbToAnsi', () => {
  test('should convert black to ANSI 0', () => {
    const result = rgbToAnsi(0, 0, 0)
    expect(result).toBe(0)
  })

  test('should convert white to ANSI 15', () => {
    const result = rgbToAnsi(255, 255, 255)
    expect(result).toBe(15)
  })

  test('should convert red to ANSI red', () => {
    const result = rgbToAnsi(255, 0, 0)
    expect([1, 9]).toContain(result) // Red or bright red
  })

  test('should convert green to ANSI green', () => {
    const result = rgbToAnsi(0, 255, 0)
    expect([2, 10]).toContain(result) // Green or bright green
  })

  test('should convert blue to ANSI blue', () => {
    const result = rgbToAnsi(0, 0, 255)
    expect([4, 12]).toContain(result) // Blue or bright blue
  })

  test('should handle grayscale', () => {
    const result = rgbToAnsi(128, 128, 128)
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(15)
  })
})

describe('rgbToAnsi256', () => {
  test('should convert black to 0', () => {
    const result = rgbToAnsi256(0, 0, 0)
    expect(result).toBe(16) // or black in 256 palette
  })

  test('should convert white to 255 color', () => {
    const result = rgbToAnsi256(255, 255, 255)
    expect(result).toBeGreaterThan(230)
  })

  test('should convert pure red', () => {
    const result = rgbToAnsi256(255, 0, 0)
    expect(result).toBeGreaterThan(0)
    expect(result).toBeLessThan(256)
  })

  test('should convert pure green', () => {
    const result = rgbToAnsi256(0, 255, 0)
    expect(result).toBeGreaterThan(0)
    expect(result).toBeLessThan(256)
  })

  test('should convert pure blue', () => {
    const result = rgbToAnsi256(0, 0, 255)
    expect(result).toBeGreaterThan(0)
    expect(result).toBeLessThan(256)
  })

  test('should handle grayscale values', () => {
    const result = rgbToAnsi256(128, 128, 128)
    expect(result).toBeGreaterThan(0)
    expect(result).toBeLessThan(256)
  })

  test('should return different values for different grays', () => {
    const dark = rgbToAnsi256(64, 64, 64)
    const mid = rgbToAnsi256(128, 128, 128)
    const light = rgbToAnsi256(192, 192, 192)

    expect(dark).not.toBe(mid)
    expect(mid).not.toBe(light)
  })
})

describe('toAnsiSequence', () => {
  test('should generate TrueColor foreground sequence', () => {
    const color = rgb(255, 128, 64)
    const result = toAnsiSequence(color, ColorProfile.TrueColor, false)
    expect(result).toContain('38;2;') // Foreground TrueColor
    expect(result).toContain('255')
    expect(result).toContain('128')
    expect(result).toContain('64')
  })

  test('should generate TrueColor background sequence', () => {
    const color = rgb(255, 128, 64)
    const result = toAnsiSequence(color, ColorProfile.TrueColor, true)
    expect(result).toContain('48;2;') // Background TrueColor
  })

  test('should generate ANSI256 sequence', () => {
    const color = rgb(255, 0, 0)
    const result = toAnsiSequence(color, ColorProfile.ANSI256, false)
    expect(result).toContain('38;5;') // Foreground 256-color
  })

  test('should generate ANSI sequence', () => {
    const color = ansi(1)
    const result = toAnsiSequence(color, ColorProfile.ANSI, false)
    expect(result).toMatch(/\[3[0-9]m/) // Foreground ANSI
  })

  test('should map bright ANSI codes 8-15 to 90-97 / 100-107', () => {
    expect(toAnsiSequence(ansi(9), ColorProfile.ANSI, false)).toBe('\x1b[91m')
    expect(toAnsiSequence(ansi(8), ColorProfile.ANSI, true)).toBe('\x1b[100m')
  })

  test('should downgrade ansi256 to a sensible basic color', () => {
    // 196 is pure red in the 6x6x6 cube; the ANSI downgrade must be red.
    expect(toAnsiSequence(ansi256(196), ColorProfile.ANSI, false)).toBe('\x1b[31m')
    // 21 is pure blue.
    expect(toAnsiSequence(ansi256(21), ColorProfile.ANSI, false)).toBe('\x1b[34m')
  })

  test('should return empty for NoColor profile', () => {
    const color = rgb(255, 0, 0)
    const result = toAnsiSequence(color, ColorProfile.NoColor, false)
    expect(result).toBe('')
  })

  test('should return empty for none color', () => {
    const color = none()
    const result = toAnsiSequence(color, ColorProfile.TrueColor, false)
    expect(result).toBe('')
  })
})
