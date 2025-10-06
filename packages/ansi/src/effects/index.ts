/**
 * Advanced Styling Utilities - Extended styling capabilities
 *
 * Provides advanced styling effects for terminal UI applications including
 * shadows, glows, patterns, and special text effects. These utilities
 * complement the core styling system with visual enhancements.
 *
 * Key features:
 * - Shadow effects (drop shadow, inner shadow)
 * - Glow and highlight effects
 * - Pattern generation (dots, stripes, checkerboard)
 * - Complex border styles
 * - Special text effects
 */

// Export shadow effects
export type { ShadowConfig } from './shadow'
export { createDropShadow, createInnerShadow } from './shadow'

// Export glow effects
export type { GlowConfig } from './glow'
export { createGlow } from './glow'

// Export pattern effects
export type { PatternConfig } from './pattern'
export { generatePattern, applyPattern } from './pattern'

// Export border effects
export type { BorderStyle } from './border'
export { createStyledBorder } from './border'

// Export layer effects
export type { LayerEffect } from './layer'
export { applyLayerEffect } from './layer'

// Export pulse effects
export { createPulse } from './pulse'

// Export shake effects
export { createShake } from './shake'

// Export typewriter effects
export { createTypewriter } from './typewriter'

// Export wave text effects
export { createWaveText } from './wave'

// Export rainbow text effects
export { createRainbowText } from './rainbow'

// Export bounce effects
export { createBounce } from './bounce'

// Export neon effects
export { createNeonEffect } from './neon'

// Export matrix effects
export { createMatrixEffect } from './matrix'

// Export hologram effects
export { createHologramEffect } from './hologram'
