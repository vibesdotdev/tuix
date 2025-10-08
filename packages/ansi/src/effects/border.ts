import type { BorderStyle } from "../types"

/**
 * Create a styled border
 *
 * Creates complex borders with gradients or patterns.
 *
 * @param content - Array of text lines
 * @param style - Border style configuration
 * @returns Array of lines with styled border
 */
export const createStyledBorder = (content: string[], borderStyle: BorderStyle): string[] => {
  const { type, width } = borderStyle
  const maxWidth = Math.max(...content.map(line => line.length))
  const result: string[] = []

  // Border characters based on type
  const getBorderChar = () => {
    switch (type) {
      case 'solid':
        return '█'
      case 'dashed':
        return '─'
      case 'dotted':
        return '·'
      case 'double':
        return '═'
      default:
        return '█'
    }
  }

  const borderChar = getBorderChar()

  // Top border
  for (let i = 0; i < width; i++) {
    result.push(borderChar.repeat(maxWidth + width * 2))
  }

  // Content with side borders
  content.forEach(line => {
    result.push(borderChar.repeat(width) + line.padEnd(maxWidth) + borderChar.repeat(width))
  })

  // Bottom border
  for (let i = 0; i < width; i++) {
    result.push(borderChar.repeat(maxWidth + width * 2))
  }

  return result
}
