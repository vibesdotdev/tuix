import { stripAnsi } from './strip'

const isControl = (codepoint: number): boolean =>
  (codepoint >= 0 && codepoint <= 0x1f) || (codepoint >= 0x7f && codepoint <= 0x9f)

const isCombining = (codepoint: number): boolean =>
  (codepoint >= 0x0300 && codepoint <= 0x036f) ||
  (codepoint >= 0x1ab0 && codepoint <= 0x1aff) ||
  (codepoint >= 0x1dc0 && codepoint <= 0x1dff) ||
  (codepoint >= 0x20d0 && codepoint <= 0x20ff) ||
  (codepoint >= 0xfe20 && codepoint <= 0xfe2f)

const isFullWidth = (codepoint: number): boolean =>
  codepoint >= 0x1100 &&
  (
    codepoint <= 0x115f ||
    codepoint === 0x2329 ||
    codepoint === 0x232a ||
    (codepoint >= 0x2e80 && codepoint <= 0xa4cf && codepoint !== 0x303f) ||
    (codepoint >= 0xac00 && codepoint <= 0xd7a3) ||
    (codepoint >= 0xf900 && codepoint <= 0xfaff) ||
    (codepoint >= 0xfe10 && codepoint <= 0xfe19) ||
    (codepoint >= 0xfe30 && codepoint <= 0xfe6f) ||
    (codepoint >= 0xff00 && codepoint <= 0xff60) ||
    (codepoint >= 0xffe0 && codepoint <= 0xffe6) ||
    (codepoint >= 0x1f300 && codepoint <= 0x1f64f) ||
    (codepoint >= 0x1f900 && codepoint <= 0x1f9ff) ||
    (codepoint >= 0x20000 && codepoint <= 0x3fffd)
  )

const charWidth = (char: string): number => {
  const codepoint = char.codePointAt(0)
  if (codepoint === undefined) return 0
  if (isControl(codepoint) || isCombining(codepoint)) return 0
  return isFullWidth(codepoint) ? 2 : 1
}

export const visualWidth = (input: string): number => {
  if (!input) return 0

  let width = 0
  const normalized = stripAnsi(input).normalize('NFC')

  for (const char of normalized) {
    width += charWidth(char)
  }

  return width
}

const stringIterator = (input: string): string[] => [...stripAnsi(input).normalize('NFC')]

export const truncate = (input: string, maxWidth: number, suffix = '...'): string => {
  if (maxWidth <= 0) return ''

  const inputWidth = visualWidth(input)
  if (inputWidth <= maxWidth) return stripAnsi(input)

  const suffixWidth = visualWidth(suffix)
  const target = Math.max(0, maxWidth - suffixWidth)

  let width = 0
  let result = ''

  for (const char of stringIterator(input)) {
    const w = charWidth(char)
    if (width + w > target) break
    width += w
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
