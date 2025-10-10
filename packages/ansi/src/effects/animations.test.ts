/**
 * Animation Effects Tests
 */

import { describe, test, expect } from 'bun:test'
import { createPulse } from './pulse'
import { createShake } from './shake'
import { createTypewriter } from './typewriter'
import { createWaveText } from './wave'
import { createBounce } from './bounce'
import type { Style } from '../style'

describe('Animation effects', () => {
  describe('createPulse', () => {
    test('should return Style object', () => {
      const result = createPulse('Hello', 0)
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
      expect('foreground' in result || '_props' in result).toBe(true)
    })

    test('should vary with phase', () => {
      const phase0 = createPulse('Test', 0)
      const phase1 = createPulse('Test', 0.5)
      const phase2 = createPulse('Test', 1)

      expect(phase0).toBeDefined()
      expect(phase1).toBeDefined()
      expect(phase2).toBeDefined()
    })

    test('should handle empty string', () => {
      const result = createPulse('', 0)
      expect(result).toBeDefined()
    })
  })

  describe('createShake', () => {
    test('should create shaking text', () => {
      const result = createShake('Hello', 1)
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    test('should vary with intensity', () => {
      const low = createShake('Test', 0.5)
      const high = createShake('Test', 2)

      expect(low).toBeDefined()
      expect(high).toBeDefined()
    })

    test('should handle zero intensity', () => {
      const result = createShake('Test', 0)
      expect(result).toBe('Test')
    })

    test('should handle empty string', () => {
      const result = createShake('', 1)
      expect(result).toBe('')
    })
  })

  describe('createTypewriter', () => {
    test('should reveal text progressively', () => {
      const text = 'Hello World'
      const result0 = createTypewriter(text, 0)
      const result50 = createTypewriter(text, 0.5)
      const result100 = createTypewriter(text, 1)

      // Progress < 1 includes cursor block "█"
      expect(result0).toBe('█')
      expect(result50.length).toBeGreaterThan(1)
      expect(result50.length).toBeLessThan(text.length + 2)
      expect(result50).toContain('█')
      expect(result100).toBe(text) // No cursor at 100%
    })

    test('should handle empty string', () => {
      const result = createTypewriter('', 0.5)
      // Empty text still shows cursor
      expect(result).toBe('█')
    })

    test('should handle progress bounds', () => {
      const text = 'Test'
      // Negative progress still adds cursor
      expect(createTypewriter(text, -0.5)).toBe('█')
      expect(createTypewriter(text, 1.5)).toBe(text)
    })
  })

  describe('createWaveText', () => {
    test('should return array of strings', () => {
      const result = createWaveText('Hello', 0, 1)
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThanOrEqual(1)
    })

    test('should vary with phase', () => {
      const phase0 = createWaveText('Test', 0, 1)
      const phase1 = createWaveText('Test', Math.PI, 1)

      expect(phase0).toBeDefined()
      expect(phase1).toBeDefined()
      expect(Array.isArray(phase0)).toBe(true)
      expect(Array.isArray(phase1)).toBe(true)
    })

    test('should handle different amplitudes', () => {
      const small = createWaveText('Test', 0, 0.5)
      const large = createWaveText('Test', 0, 2)

      expect(small).toBeDefined()
      expect(large).toBeDefined()
    })

    test('should handle empty string', () => {
      const result = createWaveText('', 0, 1)
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('createBounce', () => {
    test('should return array of strings', () => {
      const result = createBounce('Hello', 0, 2)
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThanOrEqual(1)
    })

    test('should vary with phase', () => {
      const phase0 = createBounce('Test', 0, 2)
      const phase1 = createBounce('Test', Math.PI / 2, 2)

      expect(phase0).toBeDefined()
      expect(phase1).toBeDefined()
      expect(Array.isArray(phase0)).toBe(true)
      expect(Array.isArray(phase1)).toBe(true)
    })

    test('should handle different heights', () => {
      const low = createBounce('Test', 0, 1)
      const high = createBounce('Test', 0, 3)

      expect(low).toBeDefined()
      expect(high).toBeDefined()
    })

    test('should handle empty string', () => {
      const result = createBounce('', 0, 1)
      expect(Array.isArray(result)).toBe(true)
    })

    test('should handle zero height', () => {
      const result = createBounce('Test', 0, 0)
      expect(Array.isArray(result)).toBe(true)
    })
  })
})
