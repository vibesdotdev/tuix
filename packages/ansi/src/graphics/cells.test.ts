import { describe, expect, test } from 'bun:test'
import { parseVisualCells, sliceVisual } from './cells'
import { rgbToHalfBlock } from './halfblock'

describe('visual cells', () => {
  test('one truecolor half-block is one cell, not thirty code points', () => {
    const line = rgbToHalfBlock(Uint8Array.from([16, 185, 129, 52, 211, 153]), 1, 2)
    const cells = parseVisualCells(line.replace('\x1b[0m', ''))
    expect(cells).toHaveLength(1)
    expect(cells[0]?.char).toBe('▀')
    expect(cells[0]?.fg).toEqual({ r: 16, g: 185, b: 129 })
    expect(cells[0]?.bg).toEqual({ r: 52, g: 211, b: 153 })
  })

  test('sliceVisual keeps N visible cells, not N raw characters', () => {
    const pixels = new Uint8Array(6 * 2 * 3)
    for (let i = 0; i < pixels.length; i += 3) {
      pixels[i] = 16
      pixels[i + 1] = 185
      pixels[i + 2] = 129
    }
    const line = rgbToHalfBlock(pixels, 6, 2)
    const sliced = sliceVisual(line, 2)
    const cells = parseVisualCells(sliced)
    expect(cells).toHaveLength(2)
    expect(cells.every(cell => cell.char === '▀')).toBe(true)
    expect(sliced).toContain('\x1b[38;2;16;185;129m')
  })
})
