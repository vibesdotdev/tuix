import { extractAnsi, splitAnsiSegments } from '../core/strip'

export interface StyledSegment {
  readonly text: string
  readonly codes: readonly string[]
}

export const parseStyledText = (input: string): StyledSegment[] => splitAnsiSegments(input)

export interface AnsiToken {
  readonly value: string
  readonly type: 'text' | 'code'
}

export const tokenizeAnsi = (input: string): AnsiToken[] => {
  if (!input) return []

  const codes = new Set(extractAnsi(input))
  const tokens: AnsiToken[] = []
  let buffer = ''

  for (const part of input.split(/(\u001b\[[0-?]*[ -\/]*[@-~])/g)) {
    if (!part) continue
    if (codes.has(part)) {
      if (buffer) {
        tokens.push({ value: buffer, type: 'text' })
        buffer = ''
      }
      tokens.push({ value: part, type: 'code' })
    } else {
      buffer += part
    }
  }

  if (buffer) tokens.push({ value: buffer, type: 'text' })
  return tokens
}
