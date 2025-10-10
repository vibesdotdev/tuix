import { ANSI_CODES, type ANSICode } from './codes'

const ESC = '\u001b['

export const escape = (code: string | number): string =>
  typeof code === 'number' ? `${ESC}${code}m` : `${ESC}${code}`

export const sequence = (...codes: ReadonlyArray<number | `${number}${string}` | string>): string => {
  if (codes.length === 0) {
    return `${ESC}0m`
  }

  const parts = codes.map(part => (typeof part === 'number' ? String(part) : part)).join(';')
  const hasCommand = /[a-zA-Z]$/.test(parts)
  return `${ESC}${parts}${hasCommand ? '' : 'm'}`
}

/**
 * Apply ANSI styling to text with automatic reset
 *
 * @param text - Text to colorize
 * @param code - ANSI code to apply
 * @param reset - ANSI code to reset with (defaults to 'reset')
 * @returns Styled text with ANSI codes
 *
 * @example
 * ```ts
 * colorize('Hello', 'bold')           // '\u001b[1mHello\u001b[0m'
 * colorize('Error', 'red', 'reset')   // '\u001b[31mError\u001b[0m'
 * ```
 */
export const colorize = (text: string, code: ANSICode, reset: ANSICode = 'reset'): string => {
  const start = ANSI_CODES[code]
  const end = ANSI_CODES[reset]

  if (!start || !end) return text
  return `${start}${text}${end}`
}

export { ANSI_CODES } from './codes'
export type { ANSICode } from './codes'
