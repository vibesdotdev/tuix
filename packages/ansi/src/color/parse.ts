/**
 * Color parsing utilities
 * Centralized place for parsing color values from various formats
 */

import type { Color } from './types'
import * as colorPresets from './presets'
import { hex } from './utils'

/**
 * Parse a color value from string or Color object
 * Accepts:
 * - Color objects (passed through)
 * - Hex strings (#RRGGBB)
 * - Named colors (red, green, blue, etc.)
 */
export function parseColor(colorValue: Color | string | undefined): Color | undefined {
  if (!colorValue) return undefined

  // Already a Color object
  if (typeof colorValue !== 'string') return colorValue

  // Hex color
  if (colorValue.startsWith('#')) return hex(colorValue)

  // Named colors - use the presets directly
  const namedColor = (colorPresets as any)[colorValue]
  if (namedColor) return namedColor

  // Fallback: try to parse as hex anyway
  return hex(colorValue)
}
