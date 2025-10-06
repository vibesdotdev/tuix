/**
 * Pulse Effects - Terminal UI pulse animation utilities
 *
 * Provides pulse animation effects for terminal UI applications.
 */

import { type Style, style } from '../style'

/**
 * Create a pulse animation frame
 *
 * Generates text that appears to pulse by varying intensity.
 *
 * @param text - Text to animate
 * @param phase - Animation phase (0-1)
 * @returns Styled text for current phase
 */
export const createPulse = (text: string, phase: number): Style => {
  const intensity = (Math.sin(phase * Math.PI * 2) + 1) / 2
  const color = {
    _tag: 'RGB' as const,
    r: Math.floor(255 * intensity),
    g: Math.floor(255 * intensity),
    b: Math.floor(255 * intensity),
  }

  return style().foreground(color)
}
