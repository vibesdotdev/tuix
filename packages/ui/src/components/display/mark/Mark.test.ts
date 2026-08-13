import { describe, expect, test } from 'bun:test'
import { rasterFlowerOfLife, rgbToHalfBlock } from '@tuix/ansi'
import { renderMarkGrid } from './Mark'

describe('Mark', () => {
  test('raster is a full RGB field, not a glyph stamp', () => {
    const pixels = rasterFlowerOfLife({ width: 80, height: 48, time: 1.2, scale: 1 })
    expect(pixels.length).toBe(80 * 48 * 3)
    let lit = 0
    let emerald = 0
    for (let i = 0; i < pixels.length; i += 3) {
      const r = pixels[i] ?? 0
      const g = pixels[i + 1] ?? 0
      const b = pixels[i + 2] ?? 0
      if (r + g + b > 20) lit++
      if (g > 80 && g > r && g > b) emerald++
    }
    expect(lit).toBeGreaterThan(80 * 8)
    expect(emerald).toBeGreaterThan(80 * 4)
  })

  test('half-block output is truecolor CSI, not ●○·', () => {
    const grid = renderMarkGrid(0.4, 40, 16).join('\n')
    expect(grid).toContain('\x1b[38;2;')
    expect(grid).toContain('▀')
    expect(grid).not.toContain('●')
  })

  test('half-block encoder pairs two pixel rows per cell', () => {
    const px = new Uint8Array([255, 0, 0, 0, 255, 0])
    const out = rgbToHalfBlock(px, 1, 2)
    expect(out).toContain('38;2;255;0;0')
    expect(out).toContain('48;2;0;255;0')
  })
})
