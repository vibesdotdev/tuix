/**
 * Pattern Effects Tests
 */

import { describe, test, expect } from 'bun:test'
import { generatePattern, applyPattern } from './pattern'
import { rgb } from '../color'

describe('Pattern effects', () => {
  describe('generatePattern', () => {
    test('should generate dots pattern', () => {
      const result = generatePattern(10, 5, {
        type: 'dots',
        foreground: rgb(255, 255, 255),
        background: rgb(0, 0, 0),
        scale: 1
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(5)
      result.forEach(line => expect(line.length).toBeGreaterThan(0))
    })

    test('should generate stripes pattern', () => {
      const result = generatePattern(10, 5, {
        type: 'stripes',
        foreground: rgb(255, 0, 0),
        background: rgb(0, 0, 255),
        scale: 2
      })

      expect(result.length).toBe(5)
    })

    test('should generate checkerboard pattern', () => {
      const result = generatePattern(8, 8, {
        type: 'checkerboard',
        foreground: rgb(255, 255, 255),
        background: rgb(0, 0, 0),
        scale: 2
      })

      expect(result.length).toBe(8)
    })

    test('should generate diagonal pattern', () => {
      const result = generatePattern(10, 5, {
        type: 'diagonal',
        foreground: rgb(255, 255, 0),
        background: rgb(128, 0, 128),
        scale: 1
      })

      expect(result.length).toBe(5)
    })

    test('should generate cross pattern', () => {
      const result = generatePattern(10, 5, {
        type: 'cross',
        foreground: rgb(0, 255, 0),
        background: rgb(0, 0, 0),
        scale: 3
      })

      expect(result.length).toBe(5)
    })

    test('should generate wave pattern', () => {
      const result = generatePattern(10, 5, {
        type: 'wave',
        foreground: rgb(0, 0, 255),
        background: rgb(255, 255, 255),
        scale: 2
      })

      expect(result.length).toBe(5)
    })

    test('should handle zero dimensions', () => {
      const result = generatePattern(0, 0, {
        type: 'dots',
        foreground: rgb(255, 255, 255),
        background: rgb(0, 0, 0),
        scale: 1
      })

      expect(result).toEqual([])
    })

    test('should handle different scales', () => {
      const small = generatePattern(10, 5, {
        type: 'dots',
        foreground: rgb(255, 255, 255),
        background: rgb(0, 0, 0),
        scale: 1
      })

      const large = generatePattern(10, 5, {
        type: 'dots',
        foreground: rgb(255, 255, 255),
        background: rgb(0, 0, 0),
        scale: 3
      })

      expect(small.length).toBe(5)
      expect(large.length).toBe(5)
    })
  })

  describe('applyPattern', () => {
    test('should apply pattern to content', () => {
      const content = ['Hello', 'World']
      const result = applyPattern(content, {
        type: 'dots',
        foreground: rgb(255, 255, 255),
        background: rgb(0, 0, 0),
        scale: 1
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThanOrEqual(content.length)
    })

    test('should handle different pattern types', () => {
      const content = ['Test']

      const dots = applyPattern(content, {
        type: 'dots',
        foreground: rgb(255, 255, 255),
        background: rgb(0, 0, 0),
        scale: 1
      })

      const stripes = applyPattern(content, {
        type: 'stripes',
        foreground: rgb(255, 255, 255),
        background: rgb(0, 0, 0),
        scale: 1
      })

      expect(dots).toBeDefined()
      expect(stripes).toBeDefined()
    })

    test('should handle empty content', () => {
      const result = applyPattern([], {
        type: 'dots',
        foreground: rgb(255, 255, 255),
        background: rgb(0, 0, 0),
        scale: 1
      })

      expect(result).toEqual([])
    })

    test('should handle multi-line content', () => {
      const content = ['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5']
      const result = applyPattern(content, {
        type: 'checkerboard',
        foreground: rgb(255, 0, 0),
        background: rgb(0, 0, 255),
        scale: 2
      })

      expect(result.length).toBeGreaterThanOrEqual(content.length)
    })
  })
})
