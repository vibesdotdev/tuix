/**
 * Hologram Effects - Terminal UI hologram styling utilities
 *
 * Provides hologram effects for terminal UI applications.
 */

/**
 * Create a hologram effect
 *
 * Simulates holographic appearance with scan lines.
 *
 * @param content - Content to apply effect to
 * @param phase - Animation phase for scan lines
 * @returns Content with hologram effect
 */
export const createHologramEffect = (content: string[], phase: number): string[] => {
  const scanLineY = Math.floor(phase * content.length)

  return content.map((line, y) => {
    if (y === scanLineY || y === scanLineY - 1) {
      // Scan line effect
      return line
        .split('')
        .map(char => (char === ' ' ? ' ' : '▓'))
        .join('')
    }
    return line
  })
}
