import { ANSI_CODES, type ANSICode } from '../types'

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

export const colorize = (text: string, code: ANSICode, reset: ANSICode = 'reset'): string => {
  const start = ANSI_CODES[code]
  const end = ANSI_CODES[reset]

  if (!start || !end) return text
  return `${start}${text}${end}`
}

export { ANSI_CODES }
export type { ANSICode }
