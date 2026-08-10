/**
 * Sixel graphics encode/decode (pure, no TTY).
 * Minimal DEC sixel: introduce, raster attributes, sixel data, ST.
 */

const DCS = '\x1bP'
const ST = '\x1b\\'

export interface SixelEncodeOptions {
  /** Pixel width (for raster attrs) */
  width?: number
  /** Pixel height */
  height?: number
  /** Color palette: RGB 0-100 per channel (sixel uses 0-100) */
  palette?: Array<{ r: number; g: number; b: number }>
}

/**
 * Encode grayscale or RGB8 pixel buffer to sixel.
 * pixels: length width*height*channels (channels 1 or 3), row-major.
 */
export function encodeSixel(
  pixels: Uint8Array | number[],
  width: number,
  height: number,
  channels: 1 | 3 = 1,
  options: SixelEncodeOptions = {}
): string {
  if (width <= 0 || height <= 0) {
    throw new Error('sixel: width and height must be positive')
  }
  const expected = width * height * channels
  if (pixels.length < expected) {
    throw new Error(`sixel: need ${expected} bytes, got ${pixels.length}`)
  }

  // Intro: DCS q  (sixel), optional raster "Pan;Pad;Ph;Pv
  const ph = options.width ?? width
  const pv = options.height ?? height
  let out = `${DCS}0;0;0q"1;1;${ph};${pv}`

  // Simple 16-level grayscale palette via #Pc;Pu;Px;Py;Pz
  out += '#0;2;0;0;0' // black
  out += '#1;2;100;100;100' // white

  // Band height is 6 pixels in sixel
  for (let band = 0; band < height; band += 6) {
    // Use color 1 for lit pixels
    out += '#1'
    for (let x = 0; x < width; x++) {
      let sixel = 0
      for (let bit = 0; bit < 6; bit++) {
        const y = band + bit
        if (y >= height) break
        const idx = (y * width + x) * channels
        const lum =
          channels === 1
            ? pixels[idx]!
            : Math.round(0.299 * pixels[idx]! + 0.587 * pixels[idx + 1]! + 0.114 * pixels[idx + 2]!)
        if (lum >= 128) sixel |= 1 << bit
      }
      // Sixel character: 0x3f + six bits
      out += String.fromCharCode(0x3f + sixel)
    }
    out += '-' // next band (graphics newline)
  }

  out += ST
  return out
}

export interface DecodedSixel {
  width: number
  height: number
  /** Grayscale 0/255 per pixel */
  pixels: Uint8Array
}

/**
 * Decode a minimal sixel stream produced by encodeSixel (and similar simple streams).
 */
export function decodeSixel(data: string): DecodedSixel {
  if (!data.includes('q') || (!data.includes(ST) && !data.endsWith('\\'))) {
    // still try if ST is present as ESC \
  }
  const bodyStart = data.indexOf('q')
  if (bodyStart < 0) throw new Error('sixel: missing DCS q introducer')
  let i = bodyStart + 1
  let width = 0
  let height = 0

  // Optional raster "Pan;Pad;Ph;Pv
  if (data[i] === '"') {
    const end = data.indexOf('#', i)
    const raster = data.slice(i + 1, end > i ? end : i + 32)
    const parts = raster.split(';').map(Number)
    if (parts.length >= 4) {
      width = parts[2] || 0
      height = parts[3] || 0
    }
    i = end > i ? end : i
  }

  // Skip palette definitions #Pc;Pu;...
  while (data[i] === '#') {
    // color select only: #n or definition #n;...
    i++
    while (i < data.length && /[0-9;]/.test(data[i]!)) i++
  }

  const bands: number[][] = []
  let currentBand: number[] = []
  let color = 1

  while (i < data.length) {
    const c = data[i]!
    if (c === '\x1b' && data[i + 1] === '\\') break
    if (c === '\\' && data[i - 1] === '\x1b') break
    if (c === '#') {
      i++
      let n = ''
      while (i < data.length && /[0-9]/.test(data[i]!)) n += data[i++]
      color = Number(n) || 0
      // skip definition tail
      if (data[i] === ';') {
        while (i < data.length && /[0-9;]/.test(data[i]!)) i++
      }
      continue
    }
    if (c === '-') {
      bands.push(currentBand)
      currentBand = []
      i++
      continue
    }
    if (c === '$') {
      // graphics CR — restart band column (simplified: ignore)
      i++
      continue
    }
    const code = c.charCodeAt(0)
    if (code >= 0x3f && code <= 0x7e) {
      currentBand.push(color > 0 ? code - 0x3f : 0)
      i++
      continue
    }
    i++
  }
  if (currentBand.length) bands.push(currentBand)

  if (!width) width = Math.max(0, ...bands.map(b => b.length))
  if (!height) height = bands.length * 6

  const pixels = new Uint8Array(width * height)
  for (let b = 0; b < bands.length; b++) {
    const band = bands[b]!
    for (let x = 0; x < band.length && x < width; x++) {
      const six = band[x]!
      for (let bit = 0; bit < 6; bit++) {
        const y = b * 6 + bit
        if (y >= height) break
        if (six & (1 << bit)) pixels[y * width + x] = 255
      }
    }
  }

  return { width, height, pixels }
}

/** True if payload looks like sixel DCS. */
export function isSixelPayload(data: string): boolean {
  return data.includes('\x1bP') && data.includes('q')
}
