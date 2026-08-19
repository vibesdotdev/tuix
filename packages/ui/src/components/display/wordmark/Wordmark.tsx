/** @jsxImportSource @tuix/jsx */

import { useUITheme } from '../../../theme'

/**
 * Crush-style block-letter wordmark: a 3×4 pixel font rendered with
 * half-block glyphs (two terminal rows), one gradient color per character,
 * optional diagonal fill to the right edge.
 */

export interface WordmarkProps {
  /** Banner text (A-Z, 0-9, space, dash, dot). Lowercase is uppercased. */
  text: string
  /** Gradient start color (default: theme primary). */
  from?: string
  /** Gradient end color (default: theme tertiary). */
  to?: string
  /** Total columns; when set and wider than the word, the remainder fills
   *  with `╱` diagonals in the theme's faint color. */
  width?: number
  className?: string
}

// 3-wide, 4-tall bitmaps, rows top to bottom, MSB = left pixel.
const FONT: Record<string, [number, number, number, number]> = {
  A: [0b010, 0b101, 0b111, 0b101],
  B: [0b110, 0b101, 0b110, 0b101],
  C: [0b011, 0b100, 0b100, 0b011],
  D: [0b110, 0b101, 0b101, 0b110],
  E: [0b111, 0b100, 0b110, 0b100],
  F: [0b111, 0b100, 0b110, 0b100],
  G: [0b011, 0b100, 0b101, 0b011],
  H: [0b101, 0b101, 0b111, 0b101],
  I: [0b111, 0b010, 0b010, 0b111],
  J: [0b011, 0b001, 0b101, 0b010],
  K: [0b101, 0b110, 0b100, 0b101],
  L: [0b100, 0b100, 0b100, 0b111],
  M: [0b101, 0b111, 0b111, 0b101],
  N: [0b101, 0b111, 0b111, 0b111],
  O: [0b010, 0b101, 0b101, 0b010],
  P: [0b110, 0b101, 0b110, 0b100],
  Q: [0b010, 0b101, 0b101, 0b011],
  R: [0b110, 0b101, 0b110, 0b101],
  S: [0b011, 0b100, 0b010, 0b110],
  T: [0b111, 0b010, 0b010, 0b010],
  U: [0b101, 0b101, 0b101, 0b111],
  V: [0b101, 0b101, 0b101, 0b010],
  W: [0b101, 0b111, 0b111, 0b101],
  X: [0b101, 0b101, 0b010, 0b101],
  Y: [0b101, 0b101, 0b010, 0b010],
  Z: [0b111, 0b001, 0b010, 0b100],
  '0': [0b010, 0b101, 0b101, 0b010],
  '1': [0b010, 0b110, 0b010, 0b111],
  '2': [0b110, 0b001, 0b010, 0b100],
  '3': [0b111, 0b001, 0b111, 0b001],
  '4': [0b101, 0b101, 0b111, 0b001],
  '5': [0b011, 0b100, 0b010, 0b110],
  '6': [0b011, 0b100, 0b110, 0b101],
  '7': [0b111, 0b001, 0b010, 0b010],
  '8': [0b010, 0b101, 0b010, 0b101],
  '9': [0b010, 0b101, 0b011, 0b001],
  '-': [0b000, 0b000, 0b111, 0b000],
  '.': [0b000, 0b000, 0b000, 0b010],
  ' ': [0b000, 0b000, 0b000, 0b000],
}

const GLYPH_WIDTH = 3
const GLYPH_GAP = 1

function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace('#', '')
  const full =
    v.length === 3
      ? v
          .split('')
          .map(c => c + c)
          .join('')
      : v
  return [
    Number.parseInt(full.slice(0, 2), 16) || 0,
    Number.parseInt(full.slice(2, 4), 16) || 0,
    Number.parseInt(full.slice(4, 6), 16) || 0,
  ]
}

function lerp(from: [number, number, number], to: [number, number, number], t: number): string {
  const c = from.map((f, i) => Math.round(f + (to[i]! - f) * t))
  return `\x1b[38;2;${c[0]};${c[1]};${c[2]}m`
}

/** Render one banner row-pair (pixel rows r0/r1 = terminal row, r2/r3 = next). */
function renderRowPair(rows: [number, number], color: string): string {
  let out = color
  for (let x = 0; x < GLYPH_WIDTH; x++) {
    const top = (rows[0] >> (GLYPH_WIDTH - 1 - x)) & 1
    const bottom = (rows[1] >> (GLYPH_WIDTH - 1 - x)) & 1
    if (top && bottom) out += '█'
    else if (top) out += '▀'
    else if (bottom) out += '▄'
    else out += ' '
  }
  return out
}

/**
 * Build the wordmark's two terminal rows as pre-styled strings.
 * Exported for tests; the component wraps them in a text view.
 */
export function wordmarkRows(options: {
  text: string
  from: string
  to: string
}): [string, string] {
  const chars = options.text.toUpperCase().split('')
  const glyphs = chars.map(c => FONT[c] ?? FONT[' '])
  const n = glyphs.length
  const from = hexToRgb(options.from)
  const to = hexToRgb(options.to)

  const buildRow = (r0: number, r1: number) =>
    glyphs
      .map((g, i) => {
        const color = lerp(from, to, n > 1 ? i / (n - 1) : 0)
        return renderRowPair([g[r0]!, g[r1]!], color) + '\x1b[0m'
      })
      .join(' ')

  return [buildRow(0, 1), buildRow(2, 3)]
}

export function Wordmark(props: WordmarkProps): JSX.Element {
  const { theme } = useUITheme()
  const from = props.from ?? theme.colors.primary
  const to = props.to ?? theme.colors.tertiary
  const rows = wordmarkRows({ text: props.text, from, to })
  const word = props.text.toUpperCase()

  let fillTop = ''
  let fillBottom = ''
  if (props.width !== undefined) {
    const wordCols = word.length * (GLYPH_WIDTH + GLYPH_GAP) - GLYPH_GAP
    const remaining = Math.max(0, props.width - wordCols - 1)
    if (remaining > 0) {
      const faint = theme.colors.textFaint ?? theme.colors.textDim
      const fill = `\x1b[38;2;${hexToRgb(faint).join(';')}m${'╱'.repeat(remaining)}\x1b[0m`
      fillTop = ' ' + fill
      fillBottom = ' ' + fill
    }
  }

  return (
    <vstack gap={0} className={props.className}>
      <text>{rows[0] + fillTop}</text>
      <text>{rows[1] + fillBottom}</text>
    </vstack>
  )
}

export const wordmark = (props: WordmarkProps) => <Wordmark {...props} />
