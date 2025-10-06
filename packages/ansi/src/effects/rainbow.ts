/**
 * Rainbow Text Effects - Terminal UI rainbow text styling utilities
 *
 * Provides rainbow text effects for terminal UI applications.
 */

import { type Style, style } from '../style'
import { Colors } from '../color'

/**
 * Create rainbow text
 *
 * Applies rainbow gradient to text.
 *
 * @param text - Text to colorize
 * @returns Rainbow-colored text
 */
export const createRainbowText = (text: string): Style[] => {
  const colors = [Colors.red, Colors.yellow, Colors.green, Colors.cyan, Colors.blue, Colors.magenta]

  return text.split('').map((char, i) => {
    const colorIndex = i % colors.length
    return style().foreground(colors[colorIndex]!)
  })
}
