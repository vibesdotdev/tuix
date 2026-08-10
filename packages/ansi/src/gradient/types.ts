// =============================================================================
// Gradient Types
// =============================================================================

import type { Color } from '../color/types'

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
