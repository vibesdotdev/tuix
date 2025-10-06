/**
 * Shadow Effects - Terminal UI shadow styling utilities
 *
 * Provides shadow effects for terminal UI applications including
 * drop shadows and inner shadows.
 */

import { type Color, Colors } from '../color'

/**
 * Shadow configuration
 *
 * @example
 * ```typescript
 * const shadow: ShadowConfig = {
 *   offset: { x: 2, y: 1 },
 *   blur: 0,
 *   color: Colors.Black,
 *   opacity: 0.5
 * }
 * ```
 */
export interface ShadowConfig {
  readonly offset: { x: number; y: number }
  readonly blur: number
  readonly color: Color
  readonly opacity: number
}

/**
 * Create a drop shadow effect
 *
 * Simulates depth by rendering shadow characters offset from content.
 * Works best with block characters for the shadow.
 *
 * @param content - Array of text lines
 * @param config - Shadow configuration
 * @returns Array of lines with shadow applied
 *
 * @example
 * ```typescript
 * const shadowed = createDropShadow(
 *   ["Hello", "World"],
 *   { offset: { x: 2, y: 1 }, blur: 0, color: Colors.Gray, opacity: 0.5 }
 * )
 * ```
 */
export const createDropShadow = (content: string[], config: ShadowConfig): string[] => {
  const { offset } = config
  const result: string[] = []
  const maxWidth = Math.max(...content.map(line => line.length))

  // Create shadow lines
  const shadowLines = content.map(line => {
    const paddedLine = line.padEnd(maxWidth)
    return paddedLine
      .split('')
      .map(char => (char === ' ' ? ' ' : '░'))
      .join('')
  })

  // Apply offset
  if (offset.y > 0) {
    // Shadow below content
    result.push(...content)
    for (let i = 0; i < offset.y && i < shadowLines.length; i++) {
      result.push(' '.repeat(offset.x) + (shadowLines[i] ?? ''))
    }
  } else if (offset.y < 0) {
    // Shadow above content
    for (let i = 0; i < -offset.y && i < shadowLines.length; i++) {
      result.push(shadowLines[i] ?? '')
    }
    result.push(...content)
  } else {
    // No vertical offset
    result.push(...content)
  }

  return result
}

/**
 * Create an inner shadow effect
 *
 * Darkens the edges of content to create an inset appearance.
 *
 * @param content - Array of text lines
 * @param config - Shadow configuration
 * @returns Array of lines with inner shadow
 */
export const createInnerShadow = (content: string[], config: ShadowConfig): string[] => {
  // Inner shadow darkens edges of content
  return content.map((line, y) => {
    return line
      .split('')
      .map((char, x) => {
        const isEdge = x === 0 || x === line.length - 1 || y === 0 || y === content.length - 1
        return isEdge && char !== ' ' ? '▓' : char
      })
      .join('')
  })
}
