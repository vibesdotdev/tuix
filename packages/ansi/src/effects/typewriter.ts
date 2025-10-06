/**
 * Typewriter Effects - Terminal UI typewriter animation utilities
 *
 * Provides typewriter effects for terminal UI applications.
 */

/**
 * Create a typewriter effect
 *
 * Reveals text progressively like a typewriter.
 *
 * @param text - Full text
 * @param progress - Reveal progress (0-1)
 * @returns Partially revealed text
 */
export const createTypewriter = (text: string, progress: number): string => {
  const revealLength = Math.floor(text.length * progress)
  return text.substring(0, revealLength) + '█'.repeat(progress < 1 ? 1 : 0)
}
