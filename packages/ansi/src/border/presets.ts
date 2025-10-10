/**
 * Border Preset Definitions
 *
 * Pre-defined border styles and configurations.
 */
import type { Border } from '../types'
import { BorderSide as BSide } from '../types'

// =============================================================================
// Border Character Sets
// =============================================================================

/**
 * Pre-defined border character sets
 */
export const border = {
  /**
   * Thin single-line border
   * ┌─┐
   * │ │
   * └─┘
   */
  thin: {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    horizontal: '─',
    vertical: '│',
    cross: '┼',
    horizontalDown: '┬',
    horizontalUp: '┴',
    verticalLeft: '┤',
    verticalRight: '├',
  } as Border,

  /**
   * Thick single-line border
   * ┏━┓
   * ┃ ┃
   * ┗━┛
   */
  thick: {
    topLeft: '┏',
    topRight: '┓',
    bottomLeft: '┗',
    bottomRight: '┛',
    horizontal: '━',
    vertical: '┃',
    cross: '╋',
    horizontalDown: '┳',
    horizontalUp: '┻',
    verticalLeft: '┫',
    verticalRight: '┣',
  } as Border,

  /**
   * Double-line border
   * ╔═╗
   * ║ ║
   * ╚═╝
   */
  double: {
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    horizontal: '═',
    vertical: '║',
    cross: '╬',
    horizontalDown: '╦',
    horizontalUp: '╩',
    verticalLeft: '╣',
    verticalRight: '╠',
  } as Border,

  /**
   * Rounded border
   * ╭─╮
   * │ │
   * ╰─╯
   */
  rounded: {
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
    horizontal: '─',
    vertical: '│',
    cross: '┼',
    horizontalDown: '┬',
    horizontalUp: '┴',
    verticalLeft: '┤',
    verticalRight: '├',
  } as Border,

  /**
   * ASCII border for compatibility
   * +--+
   * |  |
   * +--+
   */
  ascii: {
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    horizontal: '-',
    vertical: '|',
    cross: '+',
    horizontalDown: '+',
    horizontalUp: '+',
    verticalLeft: '+',
    verticalRight: '+',
  } as Border,

  /**
   * Dotted border
   * ···
   * : :
   * ···
   */
  dotted: {
    topLeft: '·',
    topRight: '·',
    bottomLeft: '·',
    bottomRight: '·',
    horizontal: '·',
    vertical: ':',
    cross: '·',
    horizontalDown: '·',
    horizontalUp: '·',
    verticalLeft: ':',
    verticalRight: ':',
  } as Border,

  /**
   * Dashed border
   * ┌╌┐
   * ╎ ╎
   * └╌┘
   */
  dashed: {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    horizontal: '╌',
    vertical: '╎',
    cross: '┼',
    horizontalDown: '┬',
    horizontalUp: '┴',
    verticalLeft: '┤',
    verticalRight: '├',
  } as Border,
} as const

// Export individual borders for convenience (Borders.Rounded, Borders.Thin, etc.)
export const Thin = border.thin
export const Thick = border.thick
export const Double = border.double
export const Rounded = border.rounded
export const Ascii = border.ascii
export const Dotted = border.dotted
export const Dashed = border.dashed

// =============================================================================
// Border Presets
// =============================================================================

/**
 * Common border style presets
 */
export const borderPresets = {
  /**
   * Simple box with thin borders on all sides
   */
  box: {
    type: 'thin' as const,
    sides: BSide.All
  },

  /**
   * Rounded box for softer appearance
   */
  roundedBox: {
    type: 'rounded' as const,
    sides: BSide.All
  },

  /**
   * Heavy box for emphasis
   */
  heavyBox: {
    type: 'thick' as const,
    sides: BSide.All
  },

  /**
   * Double-line box for strong emphasis
   */
  doubleBox: {
    type: 'double' as const,
    sides: BSide.All
  },

  /**
   * Top and bottom borders only
   */
  horizontal: {
    type: 'thin' as const,
    sides: BSide.Top | BSide.Bottom
  },

  /**
   * Left and right borders only
   */
  vertical: {
    type: 'thin' as const,
    sides: BSide.Left | BSide.Right
  },

  /**
   * ASCII-only for compatibility
   */
  compatible: {
    type: 'ascii' as const,
    sides: BSide.All
  }
} as const
