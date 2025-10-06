/**
 * Layer Effects - Terminal UI layer compositing utilities
 *
 * Provides layer blending modes for terminal UI applications.
 */

import { type Color } from '../color'

/**
 * Layer effect for compositing
 */
export interface LayerEffect {
  readonly type: 'overlay' | 'multiply' | 'screen' | 'color-dodge' | 'color-burn'
  readonly opacity: number
}

/**
 * Apply a layer effect
 *
 * Simulates layer blending modes for terminal output.
 * Note: Terminal limitations mean these are approximations.
 *
 * @param base - Base layer content
 * @param overlay - Overlay layer content
 * @param effect - Layer effect configuration
 * @returns Blended content
 */
export const applyLayerEffect = (
  base: string[],
  overlay: string[],
  effect: LayerEffect
): string[] => {
  const { type, opacity } = effect

  return base.map((baseLine, y) => {
    const overlayLine = overlay[y] || ''

    return baseLine
      .split('')
      .map((baseChar, x) => {
        const overlayChar = overlayLine[x] || ' '

        // Simple blending based on opacity
        if (overlayChar === ' ' || Math.random() > opacity) {
          return baseChar
        }

        // For terminal, we can only approximate blend modes
        switch (type) {
          case 'overlay':
            return overlayChar
          case 'multiply':
            return baseChar !== ' ' && overlayChar !== ' ' ? '▓' : ' '
          case 'screen':
            return baseChar !== ' ' || overlayChar !== ' ' ? overlayChar : ' '
          default:
            return overlayChar
        }
      })
      .join('')
  })
}
