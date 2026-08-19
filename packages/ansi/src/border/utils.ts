/**
 * Border Utility Functions
 *
 * Helper functions for working with borders and border styles.
 */
import type { Border, BorderSide, BorderStyle, Color } from '../types'
import { BorderSide as BSide } from '../types'
import { border } from './presets'
import { pad as padToWidth, truncate, visualWidth } from '../core/width'

/** Truncate a string to a visual width (no suffix). */
const truncateToWidth = (input: string, maxWidth: number): string => {
  if (maxWidth <= 0) return ''
  return truncate(input, maxWidth, '')
}

// =============================================================================
// Border Utilities
// =============================================================================

/**
 * Create a border style configuration
 */
export const borderStyle = (
  type: BorderStyle['type'],
  options?: {
    sides?: BorderSide
    color?: Color
  }
): BorderStyle => ({
  type,
  sides: options?.sides ?? BSide.All,
  color: options?.color,
})

/**
 * Get border characters based on style type
 */
export const getBorderFromStyle = (style: BorderStyle): Border => {
  switch (style.type) {
    case 'thin':
      return border.thin
    case 'thick':
    case 'solid':
      return border.thick
    case 'double':
    case 'double-dashed':
      return border.double
    case 'rounded':
      return border.rounded
    case 'ascii':
      return border.ascii
    case 'dotted':
      return border.dotted
    case 'dashed':
      return border.dashed ?? border.thin
    default:
      return border.thin
  }
}

/**
 * Check if a side is included in the border sides
 */
export const hasSide = (sides: BorderSide, side: BorderSide): boolean => (sides & side) === side

/**
 * Combine multiple border sides
 */
export const combineSides = (...sides: BorderSide[]): BorderSide =>
  sides.reduce((acc, side) => acc | side, BSide.None)

/**
 * Remove a side from border sides
 */
export const removeSide = (sides: BorderSide, side: BorderSide): BorderSide => sides & ~side

// =============================================================================
// Custom Border Creation
// =============================================================================

/**
 * Create a custom border from a pattern string
 * Pattern format: "TL T TR L C R BL B BR"
 * Example: "+ - + | + | + - +"
 */
export const fromPattern = (pattern: string): Border => {
  const parts = pattern.split(' ')
  if (parts.length < 6) {
    throw new Error('Border pattern must have at least 6 parts')
  }

  return {
    topLeft: parts[0] ?? '+',
    horizontal: parts[1] ?? '-',
    topRight: parts[2] ?? '+',
    vertical: parts[3] ?? '|',
    cross: parts[4] ?? '+',
    verticalRight: parts[5] ?? '|',
    bottomLeft: parts[6] ?? parts[0] ?? '+',
    bottomRight: parts[8] ?? parts[2] ?? '+',
    horizontalDown: parts[9] ?? parts[1] ?? '-',
    horizontalUp: parts[10] ?? parts[1] ?? '-',
    verticalLeft: parts[11] ?? parts[3] ?? '|',
  }
}

// =============================================================================
// Box Rendering
// =============================================================================

/**
 * Options for rendering a box
 */
export interface BoxOptions {
  readonly width: number
  readonly height: number
  readonly border: Border
  readonly sides?: BorderSide
  readonly content?: string[]
  readonly padding?: number
}

/**
 * Render a box with the given options
 */
export const renderBox = (options: BoxOptions): string => {
  const { width, height, border, sides = BSide.All, content = [], padding = 0 } = options
  const lines: string[] = []

  // Inner width accounts for side borders only when they're present.
  const hasLeft = hasSide(sides, BSide.Left)
  const hasRight = hasSide(sides, BSide.Right)
  const sideBorderWidth = (hasLeft ? 1 : 0) + (hasRight ? 1 : 0)
  const innerWidth = Math.max(0, width - sideBorderWidth)
  const paddedWidth = Math.max(0, innerWidth - padding * 2)

  // Top border
  if (hasSide(sides, BSide.Top)) {
    const left = hasLeft ? border.topLeft : ''
    const right = hasRight ? border.topRight : ''
    const middle = border.horizontal.repeat(innerWidth)
    lines.push(left + middle + right)
  }

  // Content lines with side borders. Truncate content wider than the
  // inner width so it can't overflow past the right border — pad() only
  // pads, so we truncate first.
  const contentHeight =
    height - (hasSide(sides, BSide.Top) ? 1 : 0) - (hasSide(sides, BSide.Bottom) ? 1 : 0)
  for (let i = 0; i < contentHeight; i++) {
    const left = hasLeft ? border.vertical : ''
    const right = hasRight ? border.vertical : ''

    let line = content[i] ?? ''
    if (padding > 0) {
      const paddingStr = ' '.repeat(padding)
      line = truncateToWidth(line, paddedWidth)
      line = paddingStr + padToWidth(line, paddedWidth) + paddingStr
    } else {
      line = padToWidth(truncateToWidth(line, innerWidth), innerWidth)
    }

    lines.push(left + line + right)
  }

  // Bottom border
  if (hasSide(sides, BSide.Bottom)) {
    const left = hasLeft ? border.bottomLeft : ''
    const right = hasRight ? border.bottomRight : ''
    const middle = border.horizontal.repeat(innerWidth)
    lines.push(left + middle + right)
  }

  return lines.join('\n')
}

// =============================================================================
// Gradient Box Rendering
// =============================================================================

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const value = hex.replace('#', '')
  const full =
    value.length === 3
      ? value
          .split('')
          .map(c => c + c)
          .join('')
      : value
  return {
    r: Number.parseInt(full.slice(0, 2), 16) || 0,
    g: Number.parseInt(full.slice(2, 4), 16) || 0,
    b: Number.parseInt(full.slice(4, 6), 16) || 0,
  }
}

function lerpColor(
  from: { r: number; g: number; b: number },
  to: { r: number; g: number; b: number },
  t: number
): { r: number; g: number; b: number } {
  return {
    r: Math.round(from.r + (to.r - from.r) * t),
    g: Math.round(from.g + (to.g - from.g) * t),
    b: Math.round(from.b + (to.b - from.b) * t),
  }
}

function fgSequence(color: { r: number; g: number; b: number }): string {
  return `\x1b[38;2;${color.r};${color.g};${color.b}m`
}

/**
 * Options for rendering a box whose border color blends between two colors.
 */
export interface GradientBoxOptions extends BoxOptions {
  /** Perimeter color blend endpoints (hex). Each side interpolates from → to. */
  readonly gradient: { from: string; to: string }
}

/**
 * Render a box with a gradient border: each side's color interpolates from
 * `gradient.from` to `gradient.to` along that side, Lipgloss
 * `BorderForegroundBlend`-style. Emits truecolor SGR per border cell; content
 * rows keep their own styling. Sides default to all; partial sides blend
 * across their own extent.
 */
export const renderGradientBox = (options: GradientBoxOptions): string => {
  const { width, height, border, sides = BSide.All, content = [], padding = 0 } = options
  const from = hexToRgb(options.gradient.from)
  const to = hexToRgb(options.gradient.to)
  const lines: string[] = []

  const innerWidth = width - 2
  const paddedWidth = innerWidth - padding * 2

  if (hasSide(sides, BSide.Top)) {
    const left = hasSide(sides, BSide.Left) ? border.topLeft : ''
    const right = hasSide(sides, BSide.Right) ? border.topRight : ''
    const middle = innerWidth
    let line = ''
    let index = 0
    const total = Math.max(1, innerWidth + left.length + right.length - 1)
    for (const glyph of [left, border.horizontal.repeat(middle), right].join('')) {
      const color = lerpColor(from, to, index / total)
      line += fgSequence(color) + glyph
      index++
    }
    lines.push(line + '\x1b[0m')
  }

  const contentHeight = height - 2
  for (let i = 0; i < contentHeight; i++) {
    const t = contentHeight > 1 ? i / (contentHeight - 1) : 0
    const left = hasSide(sides, BSide.Left)
      ? fgSequence(lerpColor(from, to, t)) + border.vertical
      : ''
    const right = hasSide(sides, BSide.Right)
      ? fgSequence(lerpColor(from, to, t)) + border.vertical
      : ''

    let line = content[i] ?? ''
    if (padding > 0) {
      const paddingStr = ' '.repeat(padding)
      line = paddingStr + padToWidth(line, paddedWidth) + paddingStr
    } else {
      line = padToWidth(line, innerWidth)
    }

    lines.push(left + line + (right ? right + '\x1b[0m' : ''))
  }

  if (hasSide(sides, BSide.Bottom)) {
    const left = hasSide(sides, BSide.Left) ? border.bottomLeft : ''
    const right = hasSide(sides, BSide.Right) ? border.bottomRight : ''
    let line = ''
    let index = 0
    const total = Math.max(1, innerWidth + left.length + right.length - 1)
    for (const glyph of [left, border.horizontal.repeat(innerWidth), right].join('')) {
      const color = lerpColor(from, to, index / total)
      line += fgSequence(color) + glyph
      index++
    }
    lines.push(line + '\x1b[0m')
  }

  return lines.join('\n')
}
