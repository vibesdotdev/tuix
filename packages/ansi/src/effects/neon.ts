/**
 * Neon Effects - Terminal UI neon styling utilities
 *
 * Provides neon effects for terminal UI applications.
 */

import { type Color } from '../color'
import { type Style, style } from '../style'
import { Colors } from '../color'

/**
 * Create a neon glow effect
 *
 * Simulates neon lighting with colored glow.
 *
 * @param text - Text to style
 * @param color - Neon color
 * @returns Styled text with neon effect
 */
export const createNeonEffect = (text: string, color: Color): Style => {
  return style().foreground(color).bold().background(Colors.black)
}
