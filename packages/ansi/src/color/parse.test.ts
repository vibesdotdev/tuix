/**
 * Color Parsing Tests
 */

import { describe, test, expect } from 'bun:test'
import { parseColor } from './parse'
import * as colorPresets from './presets'

describe('parseColor', () => {
  test('should return undefined for undefined input', () => {
    const result = parseColor(undefined)
    expect(result).toBeUndefined()
  })

  test('should return Color object as-is', () => {
    const color = { type: 'rgb' as const, r: 255, g: 0, b: 0 }
    const result = parseColor(color)
    expect(result).toEqual(color)
  })

  test('should parse hex string', () => {
    const result = parseColor('#ff0000')
    expect(result).toEqual({ type: 'hex', value: '#ff0000' })
  })

  test('should parse named color', () => {
    const result = parseColor('red')
    expect(result).toEqual(colorPresets.red)
  })

  test('should parse named color - green', () => {
    const result = parseColor('green')
    expect(result).toEqual(colorPresets.green)
  })

  test('should parse named color - blue', () => {
    const result = parseColor('blue')
    expect(result).toEqual(colorPresets.blue)
  })

  test('should parse named color - white', () => {
    const result = parseColor('white')
    expect(result).toEqual(colorPresets.white)
  })

  test('should parse named color - black', () => {
    const result = parseColor('black')
    expect(result).toEqual(colorPresets.black)
  })

  test('should parse named color - gray', () => {
    const result = parseColor('gray')
    expect(result).toEqual(colorPresets.gray)
  })

  test('should parse brightRed', () => {
    const result = parseColor('brightRed')
    expect(result).toEqual(colorPresets.brightRed)
  })

  test('should fallback to hex for unknown string', () => {
    const result = parseColor('#123456')
    expect(result).toEqual({ type: 'hex', value: '#123456' })
  })

  test('should handle uppercase hex', () => {
    const result = parseColor('#FF00FF')
    expect(result).toEqual({ type: 'hex', value: '#FF00FF' })
  })

  test('should handle empty string', () => {
    const result = parseColor('')
    // Empty string is falsy, so parseColor returns undefined
    expect(result).toBeUndefined()
  })
})
