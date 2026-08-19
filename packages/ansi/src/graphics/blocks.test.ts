import { describe, expect, test } from 'bun:test'

import { rgbToQuadrantBlock, rgbToBraille, blitPixels } from './blocks'

function rgb(w: number, h: number, fill: (x: number, y: number) => [number, number, number]) {
  const px = new Uint8Array(w * h * 3)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = fill(x, y)
      const i = (y * w + x) * 3
      px[i] = r
      px[i + 1] = g
      px[i + 2] = b
    }
  }
  return px
}

describe('quadrant blitter', () => {
  test('all-black 2x2 renders one blank cell with dark bg', () => {
    const out = rgbToQuadrantBlock(
      rgb(2, 2, () => [0, 0, 0]),
      2,
      2
    )
    expect(out).toContain('48;2;0;0;0')
    expect(out).toContain(' ')
  })

  test('fully-lit cell renders full block with bright fg', () => {
    const out = rgbToQuadrantBlock(
      rgb(2, 2, () => [255, 255, 255]),
      2,
      2
    )
    expect(out).toContain('38;2;255;255;255')
    expect(out).toContain('█')
  })

  test('top-left-only bright pixel yields ▘ glyph with bright fg', () => {
    const out = rgbToQuadrantBlock(
      rgb(2, 2, (x, y) => (x === 0 && y === 0 ? [255, 255, 255] : [0, 0, 0])),
      2,
      2
    )
    expect(out).toContain('▘')
  })

  test('bottom-half bright yields ▄', () => {
    const out = rgbToQuadrantBlock(
      rgb(2, 2, (_x, y) => (y === 1 ? [255, 0, 0] : [0, 0, 0])),
      2,
      2
    )
    expect(out).toContain('▄')
  })

  test('4x2 grid produces two columns of cells', () => {
    const out = rgbToQuadrantBlock(
      rgb(4, 2, () => [10, 20, 30]),
      4,
      2
    )
    const cells = (out.match(/█|▀|▄|▘|▝|▖|▗|▌|▐|▚|▞|▛|▜|▙|▟| /g) ?? []).length
    expect(cells).toBe(2)
  })
})

describe('braille blitter', () => {
  test('all-dark renders blank braille', () => {
    const out = rgbToBraille(
      rgb(2, 4, () => [0, 0, 0]),
      2,
      4
    )
    expect(out).toContain('⠀')
  })

  test('all-bright renders full braille ⣿', () => {
    const out = rgbToBraille(
      rgb(2, 4, () => [255, 255, 255]),
      2,
      4
    )
    expect(out).toContain('⣿')
  })

  test('top-row-only bright sets dots 1 and 4 (⠉)', () => {
    const out = rgbToBraille(
      rgb(2, 4, (_x, y) => (y === 0 ? [255, 255, 255] : [0, 0, 0])),
      2,
      4
    )
    expect(out).toContain('⠉')
  })

  test('mean color of the cell becomes the fg', () => {
    const out = rgbToBraille(
      rgb(2, 4, () => [100, 150, 200]),
      2,
      4
    )
    expect(out).toContain('38;2;100;150;200')
  })
})

describe('blitPixels dispatcher', () => {
  test('halfblock mode delegates to ▀ renderer', () => {
    const out = blitPixels(
      rgb(1, 2, () => [1, 2, 3]),
      1,
      2,
      'halfblock'
    )
    expect(out).toContain('▀')
    expect(out).toContain('38;2;1;2;3')
  })

  test('quadrant mode returns quadrant output', () => {
    const out = blitPixels(
      rgb(2, 2, () => [255, 255, 255]),
      2,
      2,
      'quadrant'
    )
    expect(out).toContain('█')
  })

  test('braille mode returns braille output', () => {
    const out = blitPixels(
      rgb(2, 4, () => [0, 0, 0]),
      2,
      4,
      'braille'
    )
    expect(out).toContain('⠀')
  })
})
