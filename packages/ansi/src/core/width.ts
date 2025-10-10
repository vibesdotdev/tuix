import { stripAnsi } from './strip'

/**
 * Calculate the visual width of a string in terminal columns
 *
 * Uses Bun's native stringWidth for accurate emoji and wide character detection.
 * This ensures consistency across the codebase.
 */
export const visualWidth = (input: string): number => {
  if (!input) return 0

  // Strip ANSI codes and use Bun's native stringWidth
  const cleaned = stripAnsi(input)
  return Bun.stringWidth(cleaned)
}

export const truncate = (input: string, maxWidth: number, suffix = '...'): string => {
  if (maxWidth <= 0) return ''

  const inputWidth = visualWidth(input)
  if (inputWidth <= maxWidth) return stripAnsi(input)

  const suffixWidth = visualWidth(suffix)
  const target = Math.max(0, maxWidth - suffixWidth)

  let width = 0
  let result = ''
  const cleaned = stripAnsi(input)

  // Iterate through grapheme clusters for proper emoji/character handling
  for (const char of cleaned) {
    const charWidth = Bun.stringWidth(char)
    if (width + charWidth > target) break
    width += charWidth
    result += char
  }

  return result + suffix
}

export const pad = (
  input: string,
  width: number,
  align: 'left' | 'right' | 'center' = 'left',
  fillChar = ' '
): string => {
  const currentWidth = visualWidth(input)
  if (currentWidth >= width) return input

  const padWidth = width - currentWidth

  switch (align) {
    case 'right':
      return fillChar.repeat(padWidth) + input
    case 'center': {
      const left = Math.floor(padWidth / 2)
      const right = padWidth - left
      return fillChar.repeat(left) + input + fillChar.repeat(right)
    }
    case 'left':
    default:
      return input + fillChar.repeat(padWidth)
  }
}
