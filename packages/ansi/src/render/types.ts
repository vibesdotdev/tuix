
// =============================================================================
// Render Types
// =============================================================================

import type { ColorProfile } from "../color/profile"

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
