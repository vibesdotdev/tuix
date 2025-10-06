/**
 * Matrix Effects - Terminal UI matrix animation utilities
 *
 * Provides matrix-style effects for terminal UI applications.
 */

/**
 * Create a matrix-style effect
 *
 * Creates falling character effect like in The Matrix.
 *
 * @param width - Effect width
 * @param height - Effect height
 * @param density - Character density (0-1)
 * @returns Matrix effect pattern
 */
export const createMatrixEffect = (
  width: number,
  height: number,
  density: number = 0.1
): string[] => {
  const chars = '01'
  const lines: string[] = []

  for (let y = 0; y < height; y++) {
    let line = ''
    for (let x = 0; x < width; x++) {
      if (Math.random() < density) {
        line += chars[Math.floor(Math.random() * chars.length)]
      } else {
        line += ' '
      }
    }
    lines.push(line)
  }

  return lines
}
