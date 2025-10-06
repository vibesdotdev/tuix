/**
 * Border Utility Functions
 *
 * Helper functions for working with borders and border styles.
 */
import type { Border, BorderSide, BorderStyle, Color } from '../types'
import { BorderSide as BSide } from '../types'
import { border } from './presets'

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
      return border.thick
    case 'double':
      return border.double
    case 'rounded':
      return border.rounded
    case 'ascii':
      return border.ascii
    case 'dotted':
      return border.dotted
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

  const innerWidth = width - 2
  const paddedWidth = innerWidth - padding * 2

  // Top border
  if (hasSide(sides, BSide.Top)) {
    const left = hasSide(sides, BSide.Left) ? border.topLeft : ''
    const right = hasSide(sides, BSide.Right) ? border.topRight : ''
    const middle = border.horizontal.repeat(innerWidth)
    lines.push(left + middle + right)
  }

  // Content lines with side borders
  const contentHeight = height - 2
  for (let i = 0; i < contentHeight; i++) {
    const left = hasSide(sides, BSide.Left) ? border.vertical : ''
    const right = hasSide(sides, BSide.Right) ? border.vertical : ''

    let line = content[i] ?? ''
    if (padding > 0) {
      const paddingStr = ' '.repeat(padding)
      line = paddingStr + line.padEnd(paddedWidth) + paddingStr
    } else {
      line = line.padEnd(innerWidth)
    }

    lines.push(left + line + right)
  }

  // Bottom border
  if (hasSide(sides, BSide.Bottom)) {
    const left = hasSide(sides, BSide.Left) ? border.bottomLeft : ''
    const right = hasSide(sides, BSide.Right) ? border.bottomRight : ''
    const middle = border.horizontal.repeat(innerWidth)
    lines.push(left + middle + right)
  }

  return lines.join('\n')
}
