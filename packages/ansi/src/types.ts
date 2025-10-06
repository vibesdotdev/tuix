/**
 * ANSI Module Types - Consolidated type definitions
 *
 * Single source of truth for all types used in the ANSI module.
 * This eliminates duplication and provides clear imports.
 */

import type { Color } from './color/types'
import { ColorProfile } from './color/profile'

// Re-export for convenience
export type { Color }
export { ColorProfile }

// =============================================================================
// Border Types
// =============================================================================

/**
 * Border character set for drawing boxes
 */
export interface Border {
  readonly topLeft: string
  readonly topRight: string
  readonly bottomLeft: string
  readonly bottomRight: string
  readonly horizontal: string
  readonly vertical: string
  readonly cross?: string
  readonly horizontalDown?: string
  readonly horizontalUp?: string
  readonly verticalLeft?: string
  readonly verticalRight?: string
}

/**
 * Border side flags for partial borders
 */
export enum BorderSide {
  None = 0,
  Top = 1 << 0,
  Right = 1 << 1,
  Bottom = 1 << 2,
  Left = 1 << 3,
  All = Top | Right | Bottom | Left,
}

/**
 * Border style configuration
 */
export interface BorderStyle {
  readonly type: 'thin' | 'thick' | 'double' | 'rounded' | 'ascii' | 'dotted'
  readonly sides?: BorderSide
  readonly color?: Color
}

// =============================================================================
// Style Types
// =============================================================================

/**
 * Text transform function
 */
export type StyleTransform = (text: string) => string

/**
 * Horizontal alignment options
 */
export type HorizontalAlign = 'left' | 'center' | 'right' | 'justify'

/**
 * Vertical alignment options
 */
export type VerticalAlign = 'top' | 'middle' | 'bottom'

/**
 * Style properties - all styling options in one place
 */
export interface StyleProps {
  // Colors
  readonly foreground?: Color
  readonly background?: Color

  // Typography
  readonly bold?: boolean
  readonly italic?: boolean
  readonly underline?: boolean
  readonly strikethrough?: boolean
  readonly faint?: boolean
  readonly blink?: boolean
  readonly reverse?: boolean
  readonly invisible?: boolean

  // Layout
  readonly paddingTop?: number
  readonly paddingRight?: number
  readonly paddingBottom?: number
  readonly paddingLeft?: number
  readonly marginTop?: number
  readonly marginRight?: number
  readonly marginBottom?: number
  readonly marginLeft?: number

  // Dimensions
  readonly width?: number
  readonly height?: number
  readonly maxWidth?: number
  readonly maxHeight?: number
  readonly minWidth?: number
  readonly minHeight?: number

  // Borders
  readonly border?: BorderStyle
  readonly borderForeground?: Color
  readonly borderBackground?: Color

  // Alignment
  readonly align?: HorizontalAlign
  readonly valign?: VerticalAlign

  // Gradient
  readonly gradient?: {
    readonly from: Color
    readonly to: Color
    readonly direction?: 'horizontal' | 'vertical' | 'diagonal'
  }

  // Transform
  readonly transform?: StyleTransform

  // Behavior
  readonly inline?: boolean
  readonly inherit?: boolean
  readonly overflow?: 'visible' | 'hidden' | 'wrap' | 'ellipsis'
  readonly wordBreak?: 'normal' | 'break-all' | 'keep-all'
}

// =============================================================================
// Gradient Types
// =============================================================================

/**
 * Gradient stop for color transitions
 */
export interface GradientStop {
  readonly position: number // 0.0 to 1.0
  readonly color: Color
}

/**
 * Gradient configuration
 */
export interface GradientConfig {
  readonly stops: GradientStop[]
  readonly direction: 'horizontal' | 'vertical' | 'diagonal-down' | 'diagonal-up'
  readonly interpolation: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

// =============================================================================
// Render Types
// =============================================================================

/**
 * Rendering options for styled content
 */
export interface RenderOptions {
  readonly colorProfile?: ColorProfile
  readonly width?: number
  readonly height?: number
  readonly wrapText?: boolean
  readonly preserveANSI?: boolean
}

// =============================================================================
// ANSI Types
// =============================================================================

/**
 * ANSI escape sequence names
 */
export const ANSI_CODES = {
  // Colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',

  // Styles
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  strikethrough: '\x1b[9m',
} as const

export type ANSICode = keyof typeof ANSI_CODES
