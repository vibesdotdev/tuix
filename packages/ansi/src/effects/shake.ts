/**
 * Shake Effects - Terminal UI shake animation utilities
 *
 * Provides shake effects for terminal UI applications.
 */

/**
 * Create a shake effect
 *
 * Randomly offsets characters to create a shaking appearance.
 *
 * @param text - Text to shake
 * @param intensity - Shake intensity (0-1)
 * @returns Text with random offsets
 */
export const createShake = (text: string, intensity: number): string => {
  return text
    .split('')
    .map(char => {
      if (char === ' ' || Math.random() > intensity) return char

      const offset = Math.random() > 0.5 ? ' ' : ''
      return offset + char
    })
    .join('')
}
