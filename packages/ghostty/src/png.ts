/**
 * Minimal PNG codec for screenshot post-processing: decode, locate a
 * chroma-keyed content region, crop, re-encode. Handles exactly what
 * macOS `screencapture` emits: 8-bit RGBA or RGB, non-interlaced.
 */

import { deflateSync, inflateSync } from 'node:zlib'

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

export interface RgbaImage {
  width: number
  height: number
  /** RGBA, 4 bytes per pixel, row-major. */
  data: Uint8Array
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf: Buffer): number {
  let c = 0xffffffff
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff]! ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

/** Decode a non-interlaced, 8-bit PNG (color types 2 and 6). */
export function decodePng(buffer: Buffer | Uint8Array): RgbaImage {
  const buf = Buffer.from(buffer)
  if (!buf.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('not a PNG (bad signature)')
  }
  let pos = 8
  let width = 0
  let height = 0
  let colorType = 6
  const idat: Buffer[] = []
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      colorType = data[9]!
    } else if (type === 'IDAT') {
      idat.push(data)
    } else if (type === 'IEND') {
      break
    }
    pos += 12 + len
  }
  if (!width || !height) throw new Error('PNG has no dimensions')
  if (colorType !== 6 && colorType !== 2) {
    throw new Error(`unsupported PNG color type ${colorType}`)
  }
  const channels = colorType === 6 ? 4 : 3
  const raw = inflateSync(Buffer.concat(idat))
  const stride = width * channels
  const out = new Uint8Array(width * height * 4)
  let prev = new Uint8Array(stride)
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]!
    const rowStart = y * (stride + 1) + 1
    const row = raw.subarray(rowStart, rowStart + stride)
    const unf = unfilterRow(filter, row, prev, channels)
    prev = unf
    for (let x = 0; x < width; x++) {
      const s = x * channels
      const d = (y * width + x) * 4
      out[d] = unf[s]!
      out[d + 1] = unf[s + 1]!
      out[d + 2] = unf[s + 2]!
      out[d + 3] = channels === 4 ? unf[s + 3]! : 255
    }
  }
  return { width, height, data: out }
}

function unfilterRow(
  filter: number,
  row: Uint8Array,
  prev: Uint8Array,
  channels: number
): Uint8Array {
  const out = Uint8Array.from(row)
  const stride = row.length
  if (filter === 0) return out
  for (let i = 0; i < stride; i++) {
    const a = i >= channels ? out[i - channels]! : 0
    const b = prev[i]!
    const c = i >= channels ? prev[i - channels]! : 0
    switch (filter) {
      case 1:
        out[i] = (out[i]! + a) & 0xff
        break
      case 2:
        out[i] = (out[i]! + b) & 0xff
        break
      case 3:
        out[i] = (out[i]! + ((a + b) >> 1)) & 0xff
        break
      case 4: {
        const p = a + b - c
        const pa = Math.abs(p - a)
        const pb = Math.abs(p - b)
        const pc = Math.abs(p - c)
        const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c
        out[i] = (out[i]! + pred) & 0xff
        break
      }
      default:
        throw new Error(`unsupported PNG filter ${filter}`)
    }
  }
  return out
}

/** Encode RGBA data as an 8-bit RGBA PNG (filter 0 rows). */
export function encodePng(image: RgbaImage): Buffer {
  const { width, height, data } = image
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  const stride = width * 4
  const raw = Buffer.alloc(height * (stride + 1))
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    Buffer.from(data.buffer, data.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1)
  }
  return Buffer.concat([
    PNG_SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

export interface ContentBounds {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Bounding box of the TUI grid within a chroma-keyed window.
 *
 * Ghostty's magenta fill carries sparse off-key noise (GPU dithering specks
 * and cell-boundary antialiasing, up to ~16px runs), so detection is
 * two-pass:
 *  1. keep rows whose non-key pixel count exceeds `minRowDensity` (a real
 *     content row — even one of pure app-background — is dense; noise rows
 *     sit far below 1%)
 *  2. within surviving rows, only horizontal runs >= `minRun` contribute to
 *     the x extent
 */
export function findContentBounds(
  image: RgbaImage,
  key: [number, number, number],
  tolerance = 16,
  minRun = 4
): ContentBounds | null {
  const { width, height, data } = image
  // Low gate: with the chroma key equal to the app's own background (opaque
  // paint mode), the field is flat and dither-free, so any row carrying ≥8px
  // of ink is content. (A high gate was needed for dithered chroma fills.)
  const minRowNonKey = Math.max(8, Math.floor(width * 0.002))

  const isKeyAt = (x: number, y: number): boolean => {
    const i = (y * width + x) * 4
    return (
      Math.abs(data[i]! - key[0]) <= tolerance &&
      Math.abs(data[i + 1]! - key[1]) <= tolerance &&
      Math.abs(data[i + 2]! - key[2]) <= tolerance
    )
  }

  const denseRows = new Uint8Array(height)
  for (let y = 0; y < height; y++) {
    let nonKey = 0
    for (let x = 0; x < width; x++) if (!isKeyAt(x, y)) nonKey++
    denseRows[y] = nonKey >= minRowNonKey ? 1 : 0
  }

  // Keep only the largest contiguous band of dense rows (gaps up to 2% of
  // height tolerated — a blank row inside the grid). Stray content far from
  // the app (shell echoes, exit notices) forms separate bands and is dropped.
  const gapTolerance = Math.max(2, Math.floor(height * 0.02))
  let bestStart = -1
  let bestEnd = -2
  let runStart = -1
  let gap = 0
  for (let y = 0; y <= height; y++) {
    const dense = y < height && denseRows[y] === 1
    if (dense) {
      if (runStart < 0) runStart = y
      gap = 0
    } else if (runStart >= 0) {
      gap++
      if (gap > gapTolerance || y === height) {
        const end = y - gap
        if (end - runStart > bestEnd - bestStart) {
          bestStart = runStart
          bestEnd = end
        }
        runStart = -1
        gap = 0
      }
    }
  }
  if (bestStart < 0) return null

  let minX = width
  let maxX = -1
  for (let y = bestStart; y <= bestEnd; y++) {
    if (denseRows[y] !== 1) continue
    let runX = -1
    for (let x = 0; x <= width; x++) {
      const isKey = x === width || isKeyAt(x, y)
      if (!isKey && runX < 0) runX = x
      else if (isKey && runX >= 0) {
        if (x - runX >= minRun) {
          if (runX < minX) minX = runX
          if (x - 1 > maxX) maxX = x - 1
        }
        runX = -1
      }
    }
  }
  if (maxX < 0) return null
  return { x: minX, y: bestStart, width: maxX - minX + 1, height: bestEnd - bestStart + 1 }
}

/** Crop an RGBA image to a rectangle. */
export function cropRgba(image: RgbaImage, rect: ContentBounds): RgbaImage {
  const x0 = Math.max(0, Math.min(image.width - 1, rect.x))
  const y0 = Math.max(0, Math.min(image.height - 1, rect.y))
  const w = Math.max(1, Math.min(image.width - x0, rect.width))
  const h = Math.max(1, Math.min(image.height - y0, rect.height))
  const out = new Uint8Array(w * h * 4)
  for (let y = 0; y < h; y++) {
    const src = ((y0 + y) * image.width + x0) * 4
    out.set(image.data.subarray(src, src + w * 4), y * w * 4)
  }
  return { width: w, height: h, data: out }
}

/** Parse a hex color into an RGB tuple. */
export function hexToRgbTuple(hex: string): [number, number, number] {
  const v = hex.trim().replace('#', '')
  return [
    Number.parseInt(v.slice(0, 2), 16),
    Number.parseInt(v.slice(2, 4), 16),
    Number.parseInt(v.slice(4, 6), 16),
  ]
}
