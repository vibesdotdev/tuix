// =============================================================================
// Border Types
// =============================================================================

import type { Color } from '../color/types'

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
  readonly type:
    | 'thin'
    | 'thick'
    | 'double'
    | 'rounded'
    | 'ascii'
    | 'dotted'
    | 'dashed'
    | 'solid'
    | 'double-dashed'
  readonly sides?: BorderSide
  readonly color?: Color
}
