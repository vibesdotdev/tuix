import { Option } from 'effect';
import type { ColorDef } from './types';
import { ColorProfile } from './profile';

// =============================================================================
// Color Conversion
// =============================================================================

/**
 * Convert hex string to RGB components
 */
export function hexToRgb(hex: string): Option.Option<{ r: number; g: number; b: number }> {
  const cleaned = hex.replace('#', '')
  if (cleaned.length !== 6) return Option.none()

  const r = parseInt(cleaned.substring(0, 2), 16)
  const g = parseInt(cleaned.substring(2, 4), 16)
  const b = parseInt(cleaned.substring(4, 6), 16)

  if (isNaN(r) || isNaN(g) || isNaN(b)) return Option.none()
  return Option.some({ r, g, b })
}

/**
 * Convert RGB to ANSI 256 color code
 */
export function rgbToAnsi256(r: number, g: number, b: number): number {
  // Grayscale check
  if (r === g && g === b) {
    if (r < 8) return 16
    if (r > 248) return 231
    return Math.round(((r - 8) / 247) * 24) + 232
  }

  // Color cube (6x6x6)
  const rn = Math.round(r / 51)
  const gn = Math.round(g / 51)
  const bn = Math.round(b / 51)
  return 16 + 36 * rn + 6 * gn + bn
}

/**
 * Convert RGB to basic ANSI 16 color
 */
export function rgbToAnsi(r: number, g: number, b: number): number {
  const intensity = (r + g + b) / 3
  const bright = intensity > 127

  // Find dominant color
  if (r > g && r > b) return bright ? 9 : 1 // Red
  if (g > r && g > b) return bright ? 10 : 2 // Green
  if (b > r && b > g) return bright ? 12 : 4 // Blue
  if (r > b && g > b) return bright ? 11 : 3 // Yellow
  if (r > g && b > g) return bright ? 13 : 5 // Magenta
  if (g > r && b > r) return bright ? 14 : 6 // Cyan

  // Grayscale
  if (intensity < 64) return 0 // Black
  if (intensity < 192) return 8 // Gray
  return bright ? 15 : 7 // White
}

/**
 * Convert color to ANSI escape sequence
 */
export function toAnsiSequence(c: ColorDef, profile: ColorProfile, background = false): string {
  const prefix = background ? 4 : 3

  switch (c.type) {
    case 'none':
      return ''

    case 'ansi':
      if (profile === ColorProfile.NoColor) return ''
      return `\x1b[${prefix}${c.code}m`

    case 'ansi256':
      if (profile === ColorProfile.NoColor) return ''
      if (profile === ColorProfile.ANSI) {
        // Downgrade to 16 colors
        const basic =
          c.code < 16
            ? c.code
            : rgbToAnsi(
                ((c.code - 16) % 36) * 51,
                (Math.floor((c.code - 16) / 36) % 6) * 51,
                Math.floor((c.code - 16) / 216) * 51
              )
        return `\x1b[${prefix}${basic}m`
      }
      return `\x1b[${prefix}8;5;${c.code}m`

    case 'hex':
      if (profile === ColorProfile.NoColor) return ''
      const rgb = hexToRgb(c.value)
      if (Option.isNone(rgb)) return ''
      const { r, g, b } = rgb.value
      if (profile === ColorProfile.TrueColor) {
        return `\x1b[${prefix}8;2;${r};${g};${b}m`
      }
      if (profile === ColorProfile.ANSI256) {
        return `\x1b[${prefix}8;5;${rgbToAnsi256(r, g, b)}m`
      }
      return `\x1b[${prefix}${rgbToAnsi(r, g, b)}m`

    case 'rgb':
      if (profile === ColorProfile.NoColor) return ''
      if (profile === ColorProfile.TrueColor) {
        return `\x1b[${prefix}8;2;${c.r};${c.g};${c.b}m`
      }
      if (profile === ColorProfile.ANSI256) {
        return `\x1b[${prefix}8;5;${rgbToAnsi256(c.r, c.g, c.b)}m`
      }
      return `\x1b[${prefix}${rgbToAnsi(c.r, c.g, c.b)}m`

    case 'adaptive':
      // TODO: Detect terminal theme
      const isDark = true // For now, assume dark mode
      return toAnsiSequence(isDark ? c.dark : c.light, profile, background)
  }
}
