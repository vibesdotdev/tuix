/**
 * Layer Effects Tests
 */

import { describe, test, expect } from 'bun:test'
import { applyLayerEffect } from './layer'

describe('Layer effects', () => {
  describe('applyLayerEffect', () => {
    test('should apply overlay blend mode', () => {
      const base = ['Base text']
      const overlay = ['Overlay']
      const result = applyLayerEffect(base, overlay, {
        type: 'overlay',
        opacity: 0.5
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThanOrEqual(base.length)
    })

    test('should apply multiply blend mode', () => {
      const base = ['Hello']
      const overlay = ['World']
      const result = applyLayerEffect(base, overlay, {
        type: 'multiply',
        opacity: 1.0
      })

      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThanOrEqual(base.length)
    })

    test('should apply screen blend mode', () => {
      const base = ['Test']
      const overlay = ['Layer']
      const result = applyLayerEffect(base, overlay, {
        type: 'screen',
        opacity: 0.7
      })

      expect(result).toBeDefined()
    })

    test('should apply color-dodge blend mode', () => {
      const base = ['Base']
      const overlay = ['Top']
      const result = applyLayerEffect(base, overlay, {
        type: 'color-dodge',
        opacity: 0.5
      })

      expect(result).toBeDefined()
    })

    test('should apply color-burn blend mode', () => {
      const base = ['Content']
      const overlay = ['Effect']
      const result = applyLayerEffect(base, overlay, {
        type: 'color-burn',
        opacity: 0.5
      })

      expect(result).toBeDefined()
    })

    test('should handle different opacities', () => {
      const base = ['Text']
      const overlay = ['Layer']

      const transparent = applyLayerEffect(base, overlay, {
        type: 'overlay',
        opacity: 0.1
      })

      const opaque = applyLayerEffect(base, overlay, {
        type: 'overlay',
        opacity: 1.0
      })

      expect(transparent).toBeDefined()
      expect(opaque).toBeDefined()
    })

    test('should handle empty base', () => {
      const result = applyLayerEffect([], ['Overlay'], {
        type: 'overlay',
        opacity: 0.5
      })

      expect(result).toBeDefined()
    })

    test('should handle empty overlay', () => {
      const result = applyLayerEffect(['Base'], [], {
        type: 'overlay',
        opacity: 0.5
      })

      expect(result).toBeDefined()
    })

    test('should handle multi-line content', () => {
      const base = ['Line 1', 'Line 2', 'Line 3']
      const overlay = ['Over 1', 'Over 2']
      const result = applyLayerEffect(base, overlay, {
        type: 'multiply',
        opacity: 0.5
      })

      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThanOrEqual(Math.max(base.length, overlay.length))
    })
  })
})
