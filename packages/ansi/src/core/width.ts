import { stripAnsi } from './strip'
import { joinVisualCells, parseVisualCells } from '../graphics/cells'

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

const sliceByWidth = (input: string, maxWidth: number): string => {
  const cells = parseVisualCells(input)
  let width = 0
  let used = 0
  for (; used < cells.length; used++) {
    const cell = cells[used]!
    const charWidth = Bun.stringWidth(cell.char)
    if (width + charWidth > maxWidth) break
    width += charWidth
  }
  return joinVisualCells(cells.slice(0, used))
}

export const truncate = (input: string, maxWidth: number, suffix = '...'): string => {
  if (maxWidth <= 0) return ''

  const inputWidth = visualWidth(input)
  if (inputWidth <= maxWidth) return input

  const suffixWidth = visualWidth(suffix)
  if (suffixWidth >= maxWidth) return sliceByWidth(suffix, maxWidth)

  return sliceByWidth(input, maxWidth - suffixWidth) + suffix
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
