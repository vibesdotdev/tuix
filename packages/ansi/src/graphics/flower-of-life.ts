/**
 * Raster of the vibes.dev hero flower-of-life (FlowerOfLifeCanvas geometry).
 * Pixel buffer, not glyphs. Strokes scale with the field so a 80×48 terminal
 * still reads as overlapping emerald rings, not a 1px hairline.
 */

const TAU = Math.PI * 2
const PALETTE = [
  [16, 185, 129],
  [52, 211, 153],
  [110, 231, 183],
  [167, 243, 208],
  [20, 184, 166],
  [45, 212, 191],
] as const
const HIGHLIGHT = [236, 253, 245] as const
const FIELD = [6, 10, 9] as const

export interface FlowerRasterOptions {
  width: number
  height: number
  time?: number
  /** 1 fills ~92% of the min dimension, matching a full-bleed hero. */
  scale?: number
}

function addRgb(out: Uint8Array, i: number, r: number, g: number, b: number, a: number) {
  if (a <= 0) return
  const k = Math.min(1, a)
  out[i] = Math.min(255, Math.round((out[i] ?? 0) * (1 - k) + r * k))
  out[i + 1] = Math.min(255, Math.round((out[i + 1] ?? 0) * (1 - k) + g * k))
  out[i + 2] = Math.min(255, Math.round((out[i + 2] ?? 0) * (1 - k) + b * k))
}

function fillField(out: Uint8Array, width: number, height: number) {
  for (let i = 0; i < out.length; i += 3) {
    out[i] = FIELD[0]
    out[i + 1] = FIELD[1]
    out[i + 2] = FIELD[2]
  }
  const cx = width / 2
  const cy = height / 2
  const maxR = Math.hypot(cx, cy)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = 1 - Math.min(1, Math.hypot(x - cx, y - cy) / maxR)
      addRgb(out, (y * width + x) * 3, 8, 22, 18, t * t * 0.35)
    }
  }
}

function strokeCircle(
  out: Uint8Array,
  width: number,
  height: number,
  cx: number,
  cy: number,
  radius: number,
  color: readonly [number, number, number],
  alpha: number,
  glow: number
) {
  const coreW = Math.max(1.35, radius * 0.055)
  const midW = Math.max(coreW * 2.2, radius * 0.14)
  const glowW = Math.max(midW * 1.8, radius * 0.32)
  const pad = radius + glowW + 2
  const x0 = Math.max(0, Math.floor(cx - pad))
  const x1 = Math.min(width - 1, Math.ceil(cx + pad))
  const y0 = Math.max(0, Math.floor(cy - pad))
  const y1 = Math.min(height - 1, Math.ceil(cy + pad))

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const d = Math.hypot(x - cx, y - cy)
      const dist = Math.abs(d - radius)
      const core = Math.max(0, 1 - dist / coreW)
      const mid = Math.max(0, 1 - dist / midW)
      const halo = Math.max(0, 1 - dist / glowW)
      const fill = d < radius ? glow * 0.11 * (1 - d / radius) ** 1.35 : 0
      const a = alpha * (core * 1.05 + mid * 0.42 + halo * 0.2 + fill)
      if (a <= 0.012) continue
      addRgb(out, (y * width + x) * 3, color[0], color[1], color[2], a)
    }
  }
}

function getBreath(time: number): number {
  const phase = (time % 5.5) / 5.5
  const inhale = 0.35
  if (phase < inhale) return Math.sin((phase / inhale) * Math.PI * 0.5)
  return Math.cos(((phase - inhale) / (1 - inhale)) * Math.PI * 0.5)
}

function rippleDelta(x: number, y: number, cx: number, cy: number, time: number): number {
  const ripples = [
    { ox: 0.08, oy: 0, age: 0.85, strength: 0.9 },
    { ox: -0.04, oy: -0.06, age: 1.7, strength: 0.55 },
    { ox: 0.02, oy: 0.07, age: 2.4, strength: 0.4 },
  ]
  let d = 0
  for (const ripple of ripples) {
    const rx = cx + ripple.ox * (cx * 2)
    const ry = cy + ripple.oy * (cy * 2)
    const dist = Math.hypot(x - rx, y - ry)
    const radius = ripple.age * 38 + time * 6
    const width = 10 + ripple.age * 7
    const fromRing = Math.abs(dist - radius)
    if (fromRing >= width) continue
    const falloff = 1 - fromRing / width
    const wave = Math.sin(dist * 0.09 - time * 2.2)
    d += wave * falloff * ripple.strength * 2.4
  }
  const fromCenter = Math.hypot(x - cx, y - cy)
  d += Math.sin(fromCenter * 0.045 - time * 0.8) * 1.6
  return d
}

export function rasterFlowerOfLife(options: FlowerRasterOptions): Uint8Array {
  const width = Math.max(8, Math.floor(options.width))
  const height = Math.max(8, Math.floor(options.height))
  const time = options.time ?? 0
  const scale = options.scale ?? 1
  const out = new Uint8Array(width * height * 3)
  fillField(out, width, height)

  const cx = width / 2
  const cy = height / 2
  const breath = getBreath(time) * 0.03
  const baseRadius = Math.min(width, height) * 0.307 * scale * (1 + breath)
  const rot = time * 0.012

  const circles: Array<{ x: number; y: number; r: number; a: number; g: number; c: number }> = []
  const push = (x: number, y: number, r: number, a: number, g: number, c: number) => {
    const dx = x - cx
    const dy = y - cy
    const s = Math.sin(rot)
    const co = Math.cos(rot)
    circles.push({
      x: cx + dx * co - dy * s,
      y: cy + dx * s + dy * co,
      r,
      a,
      g,
      c,
    })
  }

  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * TAU
    push(
      cx + Math.cos(angle) * baseRadius * 2,
      cy + Math.sin(angle) * baseRadius * 2,
      baseRadius,
      0.58,
      0.55,
      i
    )
  }
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * TAU
    const dist = baseRadius * Math.sqrt(3)
    push(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, baseRadius, 0.74, 0.75, i + 18)
  }
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * TAU
    push(
      cx + Math.cos(angle) * baseRadius,
      cy + Math.sin(angle) * baseRadius,
      baseRadius,
      0.92,
      0.95,
      i + 30
    )
  }
  push(cx, cy, baseRadius, 1, 1, 0)
  const seed = baseRadius * 0.5
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * TAU + TAU / 12
    push(cx + Math.cos(angle) * seed, cy + Math.sin(angle) * seed, seed, 0.95, 1, i + 36)
  }
  push(cx, cy, seed, 1, 1, 42)

  for (const circle of circles) {
    const color = PALETTE[circle.c % PALETTE.length]!
    const wobble = rippleDelta(circle.x, circle.y, cx, cy, time)
    strokeCircle(
      out,
      width,
      height,
      circle.x,
      circle.y,
      circle.r + wobble,
      color,
      circle.a,
      circle.g
    )
  }

  const bloom = baseRadius * 2.15
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const d = Math.hypot(x - cx, y - cy)
      const t = 1 - Math.min(1, d / bloom)
      if (t <= 0) continue
      addRgb(out, (y * width + x) * 3, 110, 231, 183, t * t * 0.22)
      if (d < seed * 0.85) {
        addRgb(
          out,
          (y * width + x) * 3,
          HIGHLIGHT[0],
          HIGHLIGHT[1],
          HIGHLIGHT[2],
          (1 - d / (seed * 0.85)) * 0.18
        )
      }
    }
  }

  return out
}

export function rasterToPpm(pixels: Uint8Array, width: number, height: number): string {
  const lines = [`P3`, `${width} ${height}`, `255`]
  for (let y = 0; y < height; y++) {
    const row: number[] = []
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3
      row.push(pixels[i] ?? 0, pixels[i + 1] ?? 0, pixels[i + 2] ?? 0)
    }
    lines.push(row.join(' '))
  }
  return `${lines.join('\n')}\n`
}
