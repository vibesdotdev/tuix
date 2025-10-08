
// =============================================================================
// Style Types
// =============================================================================

import type { BorderStyle } from "../border/types"
import type { Color } from "../color/types"

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
