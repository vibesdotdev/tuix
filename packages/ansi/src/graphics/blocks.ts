/**
 * Sub-cell rasterization blitters: pack multiple logical pixels into one
 * terminal cell with Unicode glyphs.
 *
 * - Quadrant blocks (`▘▝▖▗▚▞…`): 2×2 pixels per cell, two colors per cell.
 * - Braille patterns (`⠀`–`⣿`): 2×4 dots per cell, one color per cell.
 * - Half-blocks (`▀`): 1×2 pixels per cell, two colors (see halfblock.ts).
 *
 * Pixels are RGB24, row-major (`width * height * 3` bytes).
 */

import { rgbToHalfBlock as rgbToHalfBlockImpl } from './halfblock'

const QUADRANT_GLYPHS = [
  ' ', // 0000
  '▗', // 0001 BR
  '▖', // 0010 BL
  '▄', // 0011 BL+BR
  '▝', // 0100 TR
  '▐', // 0101 TR+BR
  '▞', // 0110 TR+BL
  '▟', // 0111 TR+BL+BR
  '▘', // 1000 TL
  '▚', // 1001 TL+BR
  '▌', // 1010 TL+BL
  '▙', // 1011 TL+BL+BR
  '▀', // 1100 TL+TR
  '▜', // 1101 TL+TR+BR
  '▛', // 1110 TL+TR+BL
  '█', // 1111
] as const

const QUADRANT_TL = 8
const QUADRANT_TR = 4
const QUADRANT_BL = 2
const QUADRANT_BR = 1

const BRAILLE_BASE = 0x2800

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function pixel(pixels: Uint8Array, width: number, height: number, x: number, y: number) {
  const cx = Math.min(x, width - 1)
  const cy = Math.min(y, height - 1)
  const i = (cy * width + cx) * 3
  return { r: pixels[i] ?? 0, g: pixels[i + 1] ?? 0, b: pixels[i + 2] ?? 0 }
}

/**
 * Render RGB pixels as quadrant blocks: each terminal cell encodes a 2×2
 * pixel region. The two colors available per cell are chosen by luminance —
 * fg from the brightest sub-pixel, bg from the darkest — and the glyph
 * pattern marks every sub-pixel brighter than the midpoint.
 */
export function rgbToQuadrantBlock(pixels: Uint8Array, width: number, height: number): string {
  const cols = Math.max(1, Math.floor(width / 2))
  const rows = Math.max(1, Math.floor(height / 2))
  const lines: string[] = []

  for (let cy = 0; cy < rows; cy++) {
    let line = ''
    for (let cx = 0; cx < cols; cx++) {
      const x = cx * 2
      const y = cy * 2
      const tl = pixel(pixels, width, height, x, y)
      const tr = pixel(pixels, width, height, x + 1, y)
      const bl = pixel(pixels, width, height, x, y + 1)
      const br = pixel(pixels, width, height, x + 1, y + 1)
      const subs = [
        { c: tl, l: luminance(tl.r, tl.g, tl.b) },
        { c: tr, l: luminance(tr.r, tr.g, tr.b) },
        { c: bl, l: luminance(bl.r, bl.g, bl.b) },
        { c: br, l: luminance(br.r, br.g, br.b) },
      ]
      let brightest = subs[0]!
      let darkest = subs[0]!
      for (const s of subs) {
        if (s.l > brightest.l) brightest = s
        if (s.l < darkest.l) darkest = s
      }
      const threshold = (brightest.l + darkest.l) / 2
      let pattern = 0
      if (brightest.l === darkest.l) {
        // Uniform cell: no interior structure to convey — fill it when bright
        // (a solid block reads clearly), leave it blank when dark.
        if (brightest.l > 128) pattern = QUADRANT_TL | QUADRANT_TR | QUADRANT_BL | QUADRANT_BR
      } else {
        if (subs[0]!.l > threshold) pattern |= QUADRANT_TL
        if (subs[1]!.l > threshold) pattern |= QUADRANT_TR
        if (subs[2]!.l > threshold) pattern |= QUADRANT_BL
        if (subs[3]!.l > threshold) pattern |= QUADRANT_BR
      }
      const fg = brightest.c
      const bg = darkest.c
      line += `\x1b[38;2;${fg.r};${fg.g};${fg.b}m\x1b[48;2;${bg.r};${bg.g};${bg.b}m${QUADRANT_GLYPHS[pattern]}`
    }
    lines.push(`${line}\x1b[0m`)
  }
  return lines.join('\n')
}

/**
 * Render RGB pixels as Braille patterns: each terminal cell encodes a 2×4
 * dot grid. Dots switch on above a luminance threshold; the cell's single
 * foreground color is the mean of its sub-pixels.
 */
export function rgbToBraille(pixels: Uint8Array, width: number, height: number): string {
  const cols = Math.max(1, Math.floor(width / 2))
  const rows = Math.max(1, Math.floor(height / 4))
  const lines: string[] = []

  for (let cy = 0; cy < rows; cy++) {
    let line = ''
    for (let cx = 0; cx < cols; cx++) {
      let mask = 0
      let rSum = 0
      let gSum = 0
      let bSum = 0
      let count = 0
      for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const p = pixel(pixels, width, height, cx * 2 + dx, cy * 4 + dy)
          rSum += p.r
          gSum += p.g
          bSum += p.b
          count++
          if (luminance(p.r, p.g, p.b) > 128) {
            // Unicode braille dot layout (2 cols x 4 rows):
            //   1 4        dots 1-3 = left column (bits 0-2)
            //   2 5        dots 4-6 = right column (bits 3-5)
            //   3 6        dots 7-8 = bottom row (bits 6-7)
            //   7 8
            const bit = dy < 3 ? dx * 3 + dy : 6 + dx
            mask |= 1 << bit
          }
        }
      }
      const r = Math.round(rSum / count)
      const g = Math.round(gSum / count)
      const b = Math.round(bSum / count)
      line += `\x1b[38;2;${r};${g};${b}m${String.fromCodePoint(BRAILLE_BASE + mask)}`
    }
    lines.push(`${line}\x1b[0m`)
  }
  return lines.join('\n')
}

/** Sub-cell blitter modes available to {@link blitPixels}. */
export type SubCellMode = 'halfblock' | 'quadrant' | 'braille'

/**
 * Blit an RGB24 buffer to a terminal string with the requested sub-cell
 * mode — the text-tier fallback of the image pipeline (no graphics protocol
 * required, works in every terminal).
 */
export function blitPixels(
  pixels: Uint8Array,
  width: number,
  height: number,
  mode: SubCellMode
): string {
  switch (mode) {
    case 'quadrant':
      return rgbToQuadrantBlock(pixels, width, height)
    case 'braille':
      return rgbToBraille(pixels, width, height)
    case 'halfblock':
    default:
      return rgbToHalfBlockImpl(pixels, width, height)
  }
}
