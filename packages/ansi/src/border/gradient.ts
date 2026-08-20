/**
 * Gradient border utilities for terminal UI.
 *
 * Generates border strings where the color varies per row (warm→cool
 * top-to-bottom gradient effect for depth and visual interest).
 *
 * @since 1.0.0
 */

export interface GradientBorderConfig {
  /** Width of the bordered area (inner content width) */
  width: number
  /** Height of the bordered area (inner content height) */
  height: number
  /** Start color (top) */
  startColor: { r: number; g: number; b: number }
  /** End color (bottom) */
  endColor: { r: number; g: number; b: number }
  /** Border style: 'rounded' | 'single' | 'double' | 'heavy' */
  style?: 'rounded' | 'single' | 'double' | 'heavy'
}

/** Interpolate between two colors at position t (0-1). */
function lerpColor(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number
): { r: number; g: number; b: number } {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  }
}

/** Border character sets. */
const BORDER_CHARS = {
  rounded: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
  single: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
  double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
  heavy: { tl: '┏', tr: '┓', bl: '┗', br: '┛', h: '━', v: '┃' },
} as const

/**
 * Generate gradient border lines with per-row color interpolation.
 *
 * Returns an array of ANSI-styled strings (one per row including borders).
 * Each row's border characters are colored at the interpolated gradient position.
 *
 * @example
 * ```ts
 * const lines = renderGradientBorder({
 *   width: 40,
 *   height: 10,
 *   startColor: { r: 255, g: 150, b: 50 },  // warm orange
 *   endColor: { r: 100, g: 150, b: 255 },    // cool blue
 *   style: 'rounded',
 * })
 * ```
 */
export function renderGradientBorder(config: GradientBorderConfig): string[] {
  const { width, height, startColor, endColor, style: borderStyle = 'rounded' } = config
  const chars = BORDER_CHARS[borderStyle]
  const totalHeight = height + 2 // including top and bottom border rows
  const lines: string[] = []

  for (let row = 0; row < totalHeight; row++) {
    const t = totalHeight > 1 ? row / (totalHeight - 1) : 0
    const color = lerpColor(startColor, endColor, t)
    const sgr = `\x1b[38;2;${color.r};${color.g};${color.b}m`
    const reset = '\x1b[0m'

    if (row === 0) {
      // Top border
      lines.push(`${sgr}${chars.tl}${chars.h.repeat(width)}${chars.tr}${reset}`)
    } else if (row === totalHeight - 1) {
      // Bottom border
      lines.push(`${sgr}${chars.bl}${chars.h.repeat(width)}${chars.br}${reset}`)
    } else {
      // Side borders (content goes between)
      lines.push(`${sgr}${chars.v}${reset}${' '.repeat(width)}${sgr}${chars.v}${reset}`)
    }
  }

  return lines
}

/**
 * Get the border color at a specific row position in the gradient.
 * Useful for per-row styling without full border rendering.
 */
export function gradientColorAtRow(
  row: number,
  totalRows: number,
  startColor: { r: number; g: number; b: number },
  endColor: { r: number; g: number; b: number }
): { r: number; g: number; b: number } {
  const t = totalRows > 1 ? row / (totalRows - 1) : 0
  return lerpColor(startColor, endColor, t)
}
