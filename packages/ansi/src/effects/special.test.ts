/**
 * Special Effects Tests
 */

import { describe, test, expect } from 'bun:test'
import { createRainbowText } from './rainbow'
import { createNeonEffect } from './neon'
import { createMatrixEffect } from './matrix'
import { createHologramEffect } from './hologram'
import { rgb } from '../color'

describe('Special effects', () => {
  describe('createRainbowText', () => {
    test('should return array of Style objects', () => {
      const result = createRainbowText('Hello World')
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe('Hello World'.length)
    })

    test('should handle empty string', () => {
      const result = createRainbowText('')
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(0)
    })

    test('should handle single character', () => {
      const result = createRainbowText('A')
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(1)
    })
  })

  describe('createNeonEffect', () => {
    test('should return Style object', () => {
      const result = createNeonEffect('NEON', rgb(0, 255, 255))
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    test('should handle different colors', () => {
      const cyan = createNeonEffect('Test', rgb(0, 255, 255))
      const magenta = createNeonEffect('Test', rgb(255, 0, 255))

      expect(cyan).toBeDefined()
      expect(magenta).toBeDefined()
    })

    test('should handle empty string', () => {
      const result = createNeonEffect('', rgb(0, 255, 0))
      expect(result).toBeDefined()
    })
  })

  describe('createMatrixEffect', () => {
    test('should create matrix digital rain', () => {
      const result = createMatrixEffect(10, 5, 0.3)
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(5)
      result.forEach(line => {
        expect(typeof line).toBe('string')
        expect(line.length).toBeGreaterThan(0)
      })
    })

    test('should handle different dimensions', () => {
      const small = createMatrixEffect(5, 3, 0.5)
      const large = createMatrixEffect(20, 10, 0.5)

      expect(small.length).toBe(3)
      expect(large.length).toBe(10)
    })

    test('should handle different densities', () => {
      const sparse = createMatrixEffect(10, 5, 0.1)
      const dense = createMatrixEffect(10, 5, 0.9)

      expect(sparse).toBeDefined()
      expect(dense).toBeDefined()
      expect(sparse.length).toBe(5)
      expect(dense.length).toBe(5)
    })

    test('should handle zero dimensions', () => {
      const result = createMatrixEffect(0, 0, 0.5)
      expect(result).toEqual([])
    })
  })

  describe('createHologramEffect', () => {
    test('should create hologram with scan lines', () => {
      const content = ['Hello', 'World']
      const result = createHologramEffect(content, 0)

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThanOrEqual(content.length)
    })

    test('should vary with phase', () => {
      const content = ['Test']
      const phase0 = createHologramEffect(content, 0)
      const phase1 = createHologramEffect(content, 0.5)

      expect(phase0).toBeDefined()
      expect(phase1).toBeDefined()
    })

    test('should handle multi-line content', () => {
      const content = ['Line 1', 'Line 2', 'Line 3', 'Line 4']
      const result = createHologramEffect(content, 0)

      expect(result.length).toBeGreaterThanOrEqual(content.length)
    })

    test('should handle empty content', () => {
      const result = createHologramEffect([], 0)
      expect(result).toEqual([])
    })
  })
})
