/**
 * Glow Effects - Terminal UI glow styling utilities
 *
 * Provides glow effects for terminal UI applications.
 */

import { type Color } from '../color'

/**
 * Glow configuration
 *
 * @example
 * ```typescript
 * const glow: GlowConfig = {
 *   radius: 2,
 *   color: Colors.Blue,
 *   intensity: 0.8
 * }
 * ```
 */
export interface GlowConfig {
  readonly radius: number
  readonly color: Color
  readonly intensity: number
}

/**
 * Create a glow effect around content
 *
 * Adds a colored halo effect around text using gradient characters.
 *
 * @param content - Array of text lines
 * @param config - Glow configuration
 * @returns Array of lines with glow effect
 */
export const createGlow = (content: string[], config: GlowConfig): string[] => {
  const { radius, intensity } = config
  const glowChars = ['░', '▒', '▓']
  const glowChar = glowChars[Math.min(Math.floor(intensity * 3), 2)] ?? '░'

  const result: string[] = []
  const maxWidth = Math.max(...content.map(line => line.length))

  // Add glow around content
  const padding = Math.ceil(radius)

  // Top glow
  for (let i = 0; i < padding; i++) {
    result.push(glowChar.repeat(maxWidth + padding * 2))
  }

  // Content with side glow
  content.forEach(line => {
    result.push(glowChar.repeat(padding) + line.padEnd(maxWidth) + glowChar.repeat(padding))
  })

  // Bottom glow
  for (let i = 0; i < padding; i++) {
    result.push(glowChar.repeat(maxWidth + padding * 2))
  }

  return result
}
