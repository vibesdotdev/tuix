/**
 * Color Class Tests
 */

import { describe, test, expect } from 'bun:test'
import { Color } from './def'

describe('Color class', () => {
  describe('Factory methods', () => {
    test('Color.from should create from color definition', () => {
      const colorDef = { type: 'rgb' as const, r: 255, g: 0, b: 0 }
      const color = Color.from(colorDef)
      expect(color.def).toEqual(colorDef)
    })

    test('Color.ansi should create ANSI color', () => {
      const color = Color.ansi(1)
      expect(color.def).toEqual({ type: 'ansi', code: 1 })
    })

    test('Color.ansi256 should create ANSI 256 color', () => {
      const color = Color.ansi256(128)
      expect(color.def).toEqual({ type: 'ansi256', code: 128 })
    })

    test('Color.hex should create hex color', () => {
      const color = Color.hex('#ff0000')
      expect(color.def).toEqual({ type: 'hex', value: '#ff0000' })
    })

    test('Color.rgb should create RGB color', () => {
      const color = Color.rgb(255, 128, 64)
      expect(color.def).toEqual({ type: 'rgb', r: 255, g: 128, b: 64 })
    })

    test('Color.adaptive should create adaptive color', () => {
      const light = { type: 'rgb' as const, r: 255, g: 255, b: 255 }
      const dark = { type: 'rgb' as const, r: 0, g: 0, b: 0 }
      const color = Color.adaptive(light, dark)
      expect(color.def).toEqual({ type: 'adaptive', light, dark })
    })

    test('Color.none should create no color', () => {
      const color = Color.none()
      expect(color.def).toEqual({ type: 'none' })
    })
  })

  describe('Instance methods', () => {
    test('isVisible should return true for visible colors', () => {
      expect(Color.hex('#ff0000').isVisible()).toBe(true)
      expect(Color.rgb(255, 0, 0).isVisible()).toBe(true)
      expect(Color.ansi(1).isVisible()).toBe(true)
    })

    test('isVisible should return false for no color', () => {
      expect(Color.none().isVisible()).toBe(false)
    })

    test('blend should blend two colors', () => {
      const red = Color.rgb(255, 0, 0)
      const blue = Color.rgb(0, 0, 255)
      const blended = red.blend(blue, 0.5)

      expect(blended.def.type).toBe('rgb')
      if (blended.def.type === 'rgb') {
        // Blending should produce values between the two colors (allow for rounding)
        expect(blended.def.r).toBeGreaterThan(120)
        expect(blended.def.r).toBeLessThan(135)
        expect(blended.def.g).toBe(0)
        expect(blended.def.b).toBeGreaterThan(120)
        expect(blended.def.b).toBeLessThan(135)
      }
    })

    test('lighten should lighten a color', () => {
      const color = Color.rgb(100, 100, 100)
      const lightened = color.lighten(0.2)

      expect(lightened.def.type).toBe('rgb')
      if (lightened.def.type === 'rgb') {
        expect(lightened.def.r).toBeGreaterThan(100)
        expect(lightened.def.g).toBeGreaterThan(100)
        expect(lightened.def.b).toBeGreaterThan(100)
      }
    })

    test('darken should darken a color', () => {
      const color = Color.rgb(200, 200, 200)
      const darkened = color.darken(0.2)

      expect(darkened.def.type).toBe('rgb')
      if (darkened.def.type === 'rgb') {
        expect(darkened.def.r).toBeLessThan(200)
        expect(darkened.def.g).toBeLessThan(200)
        expect(darkened.def.b).toBeLessThan(200)
      }
    })

    test('gradient should create color array between two colors', () => {
      const red = Color.rgb(255, 0, 0)
      const blue = Color.rgb(0, 0, 255)
      const gradient = red.gradient(blue, 5)

      expect(gradient).toHaveLength(5)
      expect(gradient[0].def).toEqual(red.def)
      expect(gradient[4].def).toEqual(blue.def)
    })
  })

  describe('Static methods', () => {
    test('Color.isVisible should check color visibility', () => {
      expect(Color.isVisible({ type: 'rgb', r: 255, g: 0, b: 0 })).toBe(true)
      expect(Color.isVisible({ type: 'none' })).toBe(false)
    })

    test('Color.blend should blend two colors', () => {
      const red = Color.rgb(255, 0, 0)
      const blue = Color.rgb(0, 0, 255)
      const blended = Color.blend(red, blue, 0.5)

      expect(blended.def.type).toBe('rgb')
      if (blended.def.type === 'rgb') {
        expect(blended.def.r).toBeGreaterThan(120)
        expect(blended.def.r).toBeLessThan(135)
        expect(blended.def.b).toBeGreaterThan(120)
        expect(blended.def.b).toBeLessThan(135)
      }
    })

    test('Color.lighten should lighten a color', () => {
      const color = Color.rgb(100, 100, 100)
      const lightened = Color.lighten(color, 0.2)

      expect(lightened.def.type).toBe('rgb')
      if (lightened.def.type === 'rgb') {
        expect(lightened.def.r).toBeGreaterThan(100)
      }
    })

    test('Color.darken should darken a color', () => {
      const color = Color.rgb(200, 200, 200)
      const darkened = Color.darken(color, 0.2)

      expect(darkened.def.type).toBe('rgb')
      if (darkened.def.type === 'rgb') {
        expect(darkened.def.r).toBeLessThan(200)
      }
    })

    test('Color.gradient should create gradient', () => {
      const red = Color.rgb(255, 0, 0)
      const blue = Color.rgb(0, 0, 255)
      const gradient = Color.gradient(red, blue, 3)

      expect(gradient).toHaveLength(3)
      expect(gradient[0].def).toEqual(red.def)
      expect(gradient[2].def).toEqual(blue.def)
    })
  })
})
