/**
 * ANSI Escape Code Constants
 *
 * Comprehensive collection of ANSI SGR (Select Graphic Rendition) codes
 * for terminal text styling and control.
 */

const ESC = '\u001b['

/**
 * CUP — cursor position (1-based row/col), for building frame payloads that
 * must be emitted as one write.
 */
export const cursorTo = (x: number, y: number): string => `\u001b[${y};${x}H`

/**
 * ANSI SGR Codes
 *
 * Standard ANSI escape sequences for terminal text formatting.
 * These codes follow the CSI (Control Sequence Introducer) format:
 * ESC [ <code> m
 */
export const ANSI_CODES = {
  // Reset
  reset: `${ESC}0m`,

  // Text Decoration
  bold: `${ESC}1m`,
  dim: `${ESC}2m`,
  italic: `${ESC}3m`,
  underline: `${ESC}4m`,
  blink: `${ESC}5m`,
  blinkFast: `${ESC}6m`,
  reverse: `${ESC}7m`,
  hidden: `${ESC}8m`,
  strikethrough: `${ESC}9m`,

  // Text Decoration Reset
  boldOff: `${ESC}22m`,
  dimOff: `${ESC}22m`,
  italicOff: `${ESC}23m`,
  underlineOff: `${ESC}24m`,
  blinkOff: `${ESC}25m`,
  reverseOff: `${ESC}27m`,
  hiddenOff: `${ESC}28m`,
  strikethroughOff: `${ESC}29m`,

  // Foreground Colors (ANSI 16)
  black: `${ESC}30m`,
  red: `${ESC}31m`,
  green: `${ESC}32m`,
  yellow: `${ESC}33m`,
  blue: `${ESC}34m`,
  magenta: `${ESC}35m`,
  cyan: `${ESC}36m`,
  white: `${ESC}37m`,
  defaultFg: `${ESC}39m`,

  // Background Colors (ANSI 16)
  bgBlack: `${ESC}40m`,
  bgRed: `${ESC}41m`,
  bgGreen: `${ESC}42m`,
  bgYellow: `${ESC}43m`,
  bgBlue: `${ESC}44m`,
  bgMagenta: `${ESC}45m`,
  bgCyan: `${ESC}46m`,
  bgWhite: `${ESC}47m`,
  bgDefault: `${ESC}49m`,

  // Bright Foreground Colors (ANSI 16)
  brightBlack: `${ESC}90m`,
  brightRed: `${ESC}91m`,
  brightGreen: `${ESC}92m`,
  brightYellow: `${ESC}93m`,
  brightBlue: `${ESC}94m`,
  brightMagenta: `${ESC}95m`,
  brightCyan: `${ESC}96m`,
  brightWhite: `${ESC}97m`,

  // Bright Background Colors (ANSI 16)
  bgBrightBlack: `${ESC}100m`,
  bgBrightRed: `${ESC}101m`,
  bgBrightGreen: `${ESC}102m`,
  bgBrightYellow: `${ESC}103m`,
  bgBrightBlue: `${ESC}104m`,
  bgBrightMagenta: `${ESC}105m`,
  bgBrightCyan: `${ESC}106m`,
  bgBrightWhite: `${ESC}107m`,
} as const

/**
 * Type representing valid ANSI code keys
 */
export type ANSICode = keyof typeof ANSI_CODES

/**
 * Type representing the actual ANSI escape sequence strings
 */
export type ANSISequence = (typeof ANSI_CODES)[ANSICode]

/**
 * Get ANSI escape sequence for a given code name
 *
 * @param code - ANSI code name (e.g., 'bold', 'red', 'bgGreen')
 * @returns ANSI escape sequence string
 *
 * @example
 * ```ts
 * const boldCode = getCode('bold')  // '\u001b[1m'
 * const redCode = getCode('red')    // '\u001b[31m'
 * ```
 */
export function getCode(code: ANSICode): ANSISequence {
  return ANSI_CODES[code]
}

/**
 * Check if a string is a valid ANSI code name
 *
 * @param code - String to check
 * @returns true if code is a valid ANSI code name
 */
export function isValidCode(code: string): code is ANSICode {
  return code in ANSI_CODES
}

/**
 * ANSI 256 Color Codes
 *
 * Helper functions for 256-color mode (ESC[38;5;<n>m for foreground, ESC[48;5;<n>m for background)
 */

/**
 * Generate ANSI 256-color foreground sequence
 *
 * @param code - Color code (0-255)
 * @returns ANSI escape sequence
 */
export function fg256(code: number): string {
  if (code < 0 || code > 255) {
    throw new RangeError(`ANSI 256-color code must be 0-255, got ${code}`)
  }
  return `${ESC}38;5;${code}m`
}

/**
 * Generate ANSI 256-color background sequence
 *
 * @param code - Color code (0-255)
 * @returns ANSI escape sequence
 */
export function bg256(code: number): string {
  if (code < 0 || code > 255) {
    throw new RangeError(`ANSI 256-color code must be 0-255, got ${code}`)
  }
  return `${ESC}48;5;${code}m`
}

/**
 * ANSI TrueColor (24-bit RGB) Codes
 *
 * Helper functions for TrueColor mode (ESC[38;2;r;g;bm for foreground, ESC[48;2;r;g;bm for background)
 */

/**
 * Generate ANSI TrueColor foreground sequence
 *
 * @param r - Red (0-255)
 * @param g - Green (0-255)
 * @param b - Blue (0-255)
 * @returns ANSI escape sequence
 */
export function fgRgb(r: number, g: number, b: number): string {
  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
    throw new RangeError(`RGB values must be 0-255, got (${r}, ${g}, ${b})`)
  }
  return `${ESC}38;2;${r};${g};${b}m`
}

/**
 * Generate ANSI TrueColor background sequence
 *
 * @param r - Red (0-255)
 * @param g - Green (0-255)
 * @param b - Blue (0-255)
 * @returns ANSI escape sequence
 */
export function bgRgb(r: number, g: number, b: number): string {
  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
    throw new RangeError(`RGB values must be 0-255, got (${r}, ${g}, ${b})`)
  }
  return `${ESC}48;2;${r};${g};${b}m`
}
