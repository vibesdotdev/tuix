import { ColorDefAutoAnsiSchema } from './schemas'
import type { Color, ColorRaw } from './types'

/**
 * No color (transparent/default)
 */
export const none = (): Color => ({ type: 'none' })

/**
 * ANSI 16-color palette (0-15)
 */
export const ansi = (code: number): Color => ColorDefAutoAnsiSchema.parse({ code }) as Color

/**
 * ANSI 256-color palette (0-255)
 */
export const ansi256 = (code: number): Color => ColorDefAutoAnsiSchema.parse({ code }) as Color

/**
 * Hexadecimal color (#RRGGBB)
 */
export const hex = (value: string): Color => ({
  type: 'hex',
  value: value.startsWith('#') ? value : `#${value}`,
})

/**
 * RGB color (0-255 per component)
 */
export const rgb = (r: number, g: number, b: number): Color => ({
  type: 'rgb',
  r: Math.max(0, Math.min(255, Math.floor(r))),
  g: Math.max(0, Math.min(255, Math.floor(g))),
  b: Math.max(0, Math.min(255, Math.floor(b))),
})

/**
 * Adaptive color for light/dark terminals
 */
export const adaptive = (light: ColorRaw, dark: ColorRaw): Color => ({
  type: 'adaptive',
  light,
  dark,
})

/**
 * Check if color is visible (not NoColor)
 */
export const isVisible = (c: Color): boolean => c.type !== 'none'

/**
 * Blend two colors with alpha
 */
export const blend = (fg: Color, bg: Color, alpha: number): Color => {
  if (fg.type !== 'rgb' || bg.type !== 'rgb') return fg

  const a = Math.max(0, Math.min(1, alpha))
  return rgb(fg.r * a + bg.r * (1 - a), fg.g * a + bg.g * (1 - a), fg.b * a + bg.b * (1 - a))
}

/**
 * Lighten a color by amount (0-1)
 */
export const lighten = (c: Color, amount: number): Color => {
  if (c.type !== 'rgb') return c

  const factor = 1 + Math.max(0, Math.min(1, amount))
  return rgb(Math.min(255, c.r * factor), Math.min(255, c.g * factor), Math.min(255, c.b * factor))
}

/**
 * Darken a color by amount (0-1)
 */
export const darken = (c: Color, amount: number): Color => {
  if (c.type !== 'rgb') return c

  const factor = 1 - Math.max(0, Math.min(1, amount))
  return rgb(c.r * factor, c.g * factor, c.b * factor)
}

/**
 * Create a gradient between two colors
 */
export const gradient = (start: Color, end: Color, steps: number): ReadonlyArray<Color> => {
  if (start.type !== 'rgb' || end.type !== 'rgb' || steps < 2) {
    return [start]
  }

  const result: Color[] = []
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    result.push(
      rgb(
        start.r + (end.r - start.r) * t,
        start.g + (end.g - start.g) * t,
        start.b + (end.b - start.b) * t
      )
    )
  }

  return result
}
