/**
 * Bounce Effects - Terminal UI bounce animation utilities
 *
 * Provides bounce effects for terminal UI applications.
 */

/**
 * Create a bounce effect for characters
 *
 * Makes characters appear to bounce by varying vertical position.
 *
 * @param text - Text to animate
 * @param phase - Animation phase (0-1)
 * @param height - Bounce height in lines
 * @returns Array of lines with bouncing text
 */
export const createBounce = (text: string, phase: number, height: number = 3): string[] => {
  const lines: string[] = Array(height).fill('')
  const bounce = Math.abs(Math.sin(phase * Math.PI))
  const yPos = Math.floor(bounce * (height - 1))

  lines[yPos] = text
  return lines
}
