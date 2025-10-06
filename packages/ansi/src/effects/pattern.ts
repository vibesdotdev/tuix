/**
 * Pattern Effects - Terminal UI pattern styling utilities
 *
 * Provides pattern generation for terminal UI applications including
 * dots, stripes, checkerboard, and other patterns.
 */

import { type Color } from '../color'

/**
 * Pattern configuration for fills
 */
export interface PatternConfig {
  readonly type: 'dots' | 'stripes' | 'checkerboard' | 'diagonal' | 'cross' | 'wave'
  readonly foreground: Color
  readonly background: Color
  readonly scale: number
}

/**
 * Generate a pattern fill
 *
 * Creates various patterns for backgrounds or fills.
 *
 * @param width - Pattern width
 * @param height - Pattern height
 * @param config - Pattern configuration
 * @returns 2D array of pattern characters
 */
export const generatePattern = (
  width: number,
  height: number,
  config: PatternConfig
): string[][] => {
  const pattern: string[][] = []
  const { type, scale } = config

  for (let y = 0; y < height; y++) {
    const row: string[] = []
    for (let x = 0; x < width; x++) {
      let usePattern = false

      switch (type) {
        case 'dots':
          usePattern = x % scale === 0 && y % scale === 0
          break
        case 'stripes':
          usePattern = x % scale < scale / 2
          break
        case 'checkerboard':
          usePattern = (Math.floor(x / scale) + Math.floor(y / scale)) % 2 === 0
          break
        case 'diagonal':
          usePattern = (x + y) % scale < scale / 2
          break
        case 'cross':
          usePattern = x % scale === Math.floor(scale / 2) || y % scale === Math.floor(scale / 2)
          break
        case 'wave':
          usePattern = Math.sin(x / scale) * Math.cos(y / scale) > 0
          break
      }

      row.push(usePattern ? '█' : ' ')
    }
    pattern.push(row)
  }

  return pattern
}

/**
 * Apply a pattern to content
 *
 * Overlays a pattern on existing content.
 *
 * @param content - Array of text lines
 * @param config - Pattern configuration
 * @returns Array of lines with pattern applied
 */
export const applyPattern = (content: string[], config: PatternConfig): string[] => {
  const maxWidth = Math.max(...content.map(line => line.length))
  const pattern = generatePattern(maxWidth, content.length, config)

  return content.map((line, y) => {
    return line
      .split('')
      .map((char, x) => {
        const patternChar = pattern[y]?.[x]
        return patternChar && patternChar !== ' ' && char === ' ' ? patternChar : char
      })
      .join('')
  })
}
