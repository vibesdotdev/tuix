import { describe, expect, test } from 'bun:test'

import { decodePng, encodePng, findContentBounds, cropRgba, hexToRgbTuple } from './png'
import type { RgbaImage } from './png'

function solidImage(w: number, h: number, color: [number, number, number]): RgbaImage {
  const data = new Uint8Array(w * h * 4)
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = color[0]
    data[i * 4 + 1] = color[1]
    data[i * 4 + 2] = color[2]
    data[i * 4 + 3] = 255
  }
  return { width: w, height: h, data }
}

describe('png codec', () => {
  test('encode → decode roundtrips pixels', () => {
    const img = solidImage(7, 5, [10, 200, 30])
    const decoded = decodePng(encodePng(img))
    expect(decoded.width).toBe(7)
    expect(decoded.height).toBe(5)
    expect([...decoded.data]).toEqual([...img.data])
  })

  test('decoded PNG has a valid signature and IHDR', () => {
    const buf = encodePng(solidImage(3, 2, [255, 0, 0]))
    expect(buf[0]).toBe(0x89)
    expect(buf.toString('ascii', 1, 4)).toBe('PNG')
    expect(buf.readUInt32BE(16)).toBe(3)
    expect(buf.readUInt32BE(20)).toBe(2)
  })

  test('decode rejects non-PNG input', () => {
    expect(() => decodePng(Buffer.from('not a png at all'))).toThrow(/not a PNG/)
  })

  test('crop extracts the exact rectangle', () => {
    const img = solidImage(10, 10, [0, 0, 0])
    for (let y = 2; y < 5; y++) {
      for (let x = 3; x < 8; x++) {
        const i = (y * 10 + x) * 4
        img.data[i] = 255
        img.data[i + 1] = 0
        img.data[i + 2] = 0
      }
    }
    const crop = cropRgba(img, { x: 3, y: 2, width: 5, height: 3 })
    expect(crop.width).toBe(5)
    expect(crop.height).toBe(3)
    for (let i = 0; i < 5 * 3; i++) {
      expect(crop.data[i * 4]).toBe(255)
    }
  })
})

describe('findContentBounds', () => {
  test('locates a dense chroma-field block', () => {
    // 40-wide image: min row density = max(24, 0) = 24 non-key px per row,
    // so give the block full-ish width to clear the density gate.
    const img = solidImage(40, 10, [255, 0, 255])
    for (let y = 3; y < 6; y++) {
      for (let x = 5; x < 35; x++) {
        const i = (y * 40 + x) * 4
        img.data[i] = 30
        img.data[i + 1] = 144
        img.data[i + 2] = 255
      }
    }
    const bounds = findContentBounds(img, [255, 0, 255])
    expect(bounds).toEqual({ x: 5, y: 3, width: 30, height: 3 })
  })

  test('returns null for a pure chroma image', () => {
    expect(findContentBounds(solidImage(8, 8, [255, 0, 255]), [255, 0, 255])).toBeNull()
  })

  test('sparse noise rows are dropped by the density gate', () => {
    // 200-wide image, gate = max(8, 0.2%) = 8 non-key px. A noise row with
    // 3 specks stays below it; the content row (100 px) passes.
    const img = solidImage(200, 8, [255, 0, 255])
    for (const x of [4, 100, 180]) {
      const i = (1 * 200 + x) * 4
      img.data[i] = 0
    }
    for (let x = 50; x < 150; x++) {
      const i = (6 * 200 + x) * 4
      img.data[i] = 200
      img.data[i + 1] = 200
    }
    const bounds = findContentBounds(img, [255, 0, 255])
    expect(bounds).toEqual({ x: 50, y: 6, width: 100, height: 1 })
  })

  test('tolerance keeps near-key antialias pixels as key', () => {
    const img = solidImage(11, 1, [255, 0, 255])
    img.data[0] = 250 // within tolerance of key
    const bounds = findContentBounds(img, [255, 0, 255])
    expect(bounds).toBeNull()
  })
})

describe('hexToRgbTuple', () => {
  test('parses 6-digit hex', () => {
    expect(hexToRgbTuple('#ff00ff')).toEqual([255, 0, 255])
    expect(hexToRgbTuple('1d90ff')).toEqual([29, 144, 255])
  })
})
