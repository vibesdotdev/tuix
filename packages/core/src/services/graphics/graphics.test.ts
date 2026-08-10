import { test, expect, describe } from 'bun:test'
import { encodeSixel, decodeSixel } from './sixel'
import { encodeKittyImage, decodeKittyImage } from './kitty'
import { encodeITermImage, decodeITermImage } from './iterm'
import { encodeGraphics, decodeGraphics } from './index'
import type { TerminalCapabilities } from '../../types/schemas'

const baseCaps = (over: Partial<TerminalCapabilities>): TerminalCapabilities => ({
  colors: 'truecolor',
  unicode: true,
  mouse: true,
  clipboard: false,
  sixel: false,
  kitty: false,
  iterm2: false,
  windowTitle: true,
  columns: 80,
  rows: 24,
  ...over,
})

describe('sixel round-trip', () => {
  test('encode/decode grayscale', () => {
    const w = 4
    const h = 6
    const pixels = new Uint8Array(w * h)
    // light diagonal
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        pixels[y * w + x] = x === y % w ? 255 : 0
      }
    }
    const encoded = encodeSixel(pixels, w, h, 1)
    expect(encoded.startsWith('\x1bP')).toBe(true)
    expect(encoded.includes('q')).toBe(true)
    const decoded = decodeSixel(encoded)
    expect(decoded.width).toBe(w)
    expect(decoded.height).toBeGreaterThanOrEqual(h)
    // at least one lit pixel preserved
    expect(decoded.pixels.some(p => p === 255)).toBe(true)
  })
})

describe('kitty round-trip', () => {
  test('encode/decode rgb bytes', () => {
    const w = 2
    const h = 2
    const data = Uint8Array.from([255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255])
    const encoded = encodeKittyImage(data, w, h, 'rgb')
    expect(encoded.includes('\x1b_G')).toBe(true)
    const decoded = decodeKittyImage(encoded)
    expect(decoded.width).toBe(w)
    expect(decoded.height).toBe(h)
    expect(Array.from(decoded.data)).toEqual(Array.from(data))
  })
})

describe('iterm round-trip', () => {
  test('encode/decode png-like bytes', () => {
    const data = Uint8Array.from([1, 2, 3, 4, 5])
    const encoded = encodeITermImage(data, { name: 'dot.png' })
    expect(encoded.includes('1337;File=')).toBe(true)
    const decoded = decodeITermImage(encoded)
    expect(decoded.name).toBe('dot.png')
    expect(Array.from(decoded.data)).toEqual(Array.from(data))
  })
})

describe('encodeGraphics protocol selection', () => {
  test('falls back when no graphics', () => {
    const r = encodeGraphics(baseCaps({}), {
      data: Uint8Array.from([0, 0, 0]),
      width: 1,
      height: 1,
      channels: 3,
    })
    expect(r.fallback).toBe(true)
    expect(r.protocol).toBe('none')
  })
  test('uses sixel when capability set', () => {
    const pixels = new Uint8Array(8 * 6).fill(200)
    const r = encodeGraphics(baseCaps({ sixel: true }), {
      data: pixels,
      width: 8,
      height: 6,
      channels: 1,
      format: 'gray',
    })
    expect(r.fallback).toBe(false)
    expect(r.protocol).toBe('sixel')
    const dec = decodeGraphics(r.payload, 'sixel')
    expect(dec.protocol).toBe('sixel')
  })
  test('prefers kitty', () => {
    const data = Uint8Array.from([0, 0, 0])
    const r = encodeGraphics(baseCaps({ kitty: true, sixel: true }), {
      data,
      width: 1,
      height: 1,
      channels: 3,
    })
    expect(r.protocol).toBe('kitty')
  })
})
