/**
 * OSC 10/11 dynamic color queries — read the terminal's own foreground and
 * background so apps can pick a light/dark theme variant that respects the
 * user's palette instead of assuming dark.
 *
 * Query:  OSC 10 ; ? BEL   (foreground)   OSC 11 ; ? BEL   (background)
 * Reply:  OSC 11 ; rgb:RRRR/GGGG/BBBB ST|BEL   (2 or 4 hex digits per channel)
 */

import type { Rgb } from '@tuix/ansi'

export const REQUEST_FG_COLOR = '\x1b]10;?\x07'
export const REQUEST_BG_COLOR = '\x1b]11;?\x07'

export interface OscColorReport {
  target: 'fg' | 'bg'
  rgb: Rgb
}

const OSC_COLOR_RE =
  /\x1b\](10|11);rgb:([0-9a-fA-F]{2,4})\/([0-9a-fA-F]{2,4})\/([0-9a-fA-F]{2,4})(?:\x07|\x1b\\)/

function channel(value: string): number {
  if (value.length <= 2) return Number.parseInt(value.padEnd(2, '0'), 16) || 0
  // 4-digit form is 16-bit; scale to 8-bit.
  return Math.round((Number.parseInt(value, 16) || 0) / 257)
}

/**
 * Parse an OSC 10/11 color report from a terminal reply stream. Returns the
 * first matching report, or null when the buffer contains none.
 */
export function parseOscColorReport(input: string): OscColorReport | null {
  const match = OSC_COLOR_RE.exec(input)
  if (!match) return null
  return {
    target: match[1] === '10' ? 'fg' : 'bg',
    rgb: {
      r: channel(match[2]!),
      g: channel(match[3]!),
      b: channel(match[4]!),
    },
  }
}

/** Relative luminance approximation, 0..1. */
export function luminance(rgb: Rgb): number {
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
}

/**
 * Classify a terminal background color. Threshold 0.5 matches common
 * terminal defaults well enough to separate paper-white from near-black.
 */
export function colorSchemeFromBackground(rgb: Rgb): 'light' | 'dark' {
  return luminance(rgb) > 0.5 ? 'light' : 'dark'
}
