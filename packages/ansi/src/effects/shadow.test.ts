/**
 * Shadow Effects Tests
 */

import { describe, test, expect } from 'bun:test'
import { createDropShadow, createInnerShadow } from './shadow'
import { rgb } from '../color'

describe('Shadow effects', () => {
  describe('createDropShadow', () => {
    test('should create drop shadow with config', () => {
      const content = ['Hello']
      const result = createDropShadow(content, {
        offset: { x: 1, y: 1 },
        blur: 0,
        color: rgb(0, 0, 0),
        opacity: 0.5
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThanOrEqual(content.length)
    })

    test('should create drop shadow with custom offset', () => {
      const content = ['Test']
      const result = createDropShadow(content, {
        offset: { x: 2, y: 2 },
        blur: 1,
        color: rgb(0, 0, 0),
        opacity: 0.5
      })

      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    })

    test('should handle multi-line content', () => {
      const content = ['Line 1', 'Line 2', 'Line 3']
      const result = createDropShadow(content, {
        offset: { x: 1, y: 1 },
        blur: 0,
        color: rgb(0, 0, 0),
        opacity: 1
      })

      expect(result.length).toBeGreaterThanOrEqual(content.length)
    })

    test('should handle empty content', () => {
      const result = createDropShadow([], {
        offset: { x: 1, y: 1 },
        blur: 0,
        color: rgb(0, 0, 0),
        opacity: 0.5
      })
      expect(result).toEqual([])
    })

    test('should handle single space lines', () => {
      const content = [' ']
      const result = createDropShadow(content, {
        offset: { x: 1, y: 1 },
        blur: 0,
        color: rgb(0, 0, 0),
        opacity: 0.5
      })
      expect(result).toBeDefined()
    })
  })

  describe('createInnerShadow', () => {
    test('should create inner shadow with config', () => {
      const content = ['Hello']
      const result = createInnerShadow(content, {
        offset: { x: 0, y: 0 },
        blur: 1,
        color: rgb(0, 0, 0),
        opacity: 0.5
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThanOrEqual(content.length)
    })

    test('should create inner shadow with custom config', () => {
      const content = ['Test']
      const result = createInnerShadow(content, {
        offset: { x: 1, y: 1 },
        blur: 2,
        color: rgb(0, 0, 0),
        opacity: 0.7
      })

      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThanOrEqual(content.length)
    })

    test('should handle multi-line content', () => {
      const content = ['Line 1', 'Line 2', 'Line 3']
      const result = createInnerShadow(content, {
        offset: { x: 0, y: 1 },
        blur: 1,
        color: rgb(0, 0, 0),
        opacity: 0.5
      })

      expect(result.length).toBeGreaterThanOrEqual(content.length)
    })

    test('should handle empty content', () => {
      const result = createInnerShadow([], {
        offset: { x: 1, y: 1 },
        blur: 1,
        color: rgb(0, 0, 0),
        opacity: 0.5
      })
      expect(result).toEqual([])
    })
  })
})
