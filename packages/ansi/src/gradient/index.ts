import type { Color, GradientConfig, GradientStop } from '../types'
import { ColorProfile } from '../color/profile'
import { toAnsiSequence, colorToRgb, type RGB } from '../color/convert'

const lerp = (start: number, end: number, factor: number): number => start + (end - start) * factor

const ease = (t: number, type: GradientConfig['interpolation']): number => {
  switch (type) {
    case 'ease-in':
      return t * t
    case 'ease-out':
      return 1 - (1 - t) * (1 - t)
    case 'ease-in-out':
      return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)
    default:
      return t
  }
}

const interpolate = (a: Color, b: Color, factor: number): Color => {
  const start = colorToRgb(a)
  const end = colorToRgb(b)

  return {
    type: 'rgb',
    r: Math.round(lerp(start.r, end.r, factor)),
    g: Math.round(lerp(start.g, end.g, factor)),
    b: Math.round(lerp(start.b, end.b, factor)),
  }
}

const normalizeStops = (stops: readonly GradientStop[]): GradientStop[] =>
  [...stops].sort((a, b) => a.position - b.position)

export const getGradientColor = (config: GradientConfig, position: number): Color => {
  const stops = normalizeStops(config.stops)
  if (stops.length === 0) return { type: 'none' }
  if (stops.length === 1) return stops[0]!.color

  const t = ease(Math.min(Math.max(position, 0), 1), config.interpolation)

  if (t <= stops[0]!.position) return stops[0]!.color
  const last = stops[stops.length - 1]!
  if (t >= last.position) return last.color

  for (let index = 0; index < stops.length - 1; index++) {
    const current = stops[index]!
    const next = stops[index + 1]!
    if (t >= current.position && t <= next.position) {
      const span = next.position - current.position || 1
      const local = (t - current.position) / span
      return interpolate(current.color, next.color, local)
    }
  }

  return last.color
}

const calculatePosition = (
  width: number,
  height: number,
  x: number,
  y: number,
  direction: GradientConfig['direction']
): number => {
  switch (direction) {
    case 'vertical':
      return height <= 1 ? 0 : y / (height - 1)
    case 'diagonal-down':
      return width + height <= 2 ? 0 : (x + y) / (width + height - 2)
    case 'diagonal-up':
      return width + height <= 2 ? 0 : (x + (height - 1 - y)) / (width + height - 2)
    case 'horizontal':
    default:
      return width <= 1 ? 0 : x / (width - 1)
  }
}

export interface TextGradientOptions {
  readonly gradient: GradientConfig
  readonly text: string
  readonly preserveSpaces?: boolean
  readonly profile?: ColorProfile
}

export const textGradient = (options: TextGradientOptions): string => {
  const { gradient, text, preserveSpaces = false, profile = ColorProfile.TrueColor } = options

  const chars = [...text]

  return chars
    .map((char, index) => {
      if (!preserveSpaces && char === ' ') return char
      const position = chars.length <= 1 ? 0 : index / (chars.length - 1)
      const color = getGradientColor(gradient, position)
      const seq = toAnsiSequence(color, profile)
      return seq + char + '\u001b[0m'
    })
    .join('')
}

export interface BackgroundGradientOptions {
  readonly gradient: GradientConfig
  readonly width: number
  readonly height: number
  readonly char?: string
  readonly profile?: ColorProfile
}

export const backgroundGradient = (options: BackgroundGradientOptions): string[] => {
  const { gradient, width, height, char = '█', profile = ColorProfile.TrueColor } = options
  const lines: string[] = []

  for (let y = 0; y < height; y++) {
    let line = ''
    for (let x = 0; x < width; x++) {
      const position = calculatePosition(width, height, x, y, gradient.direction)
      const color = getGradientColor(gradient, position)
      const seq = toAnsiSequence(color, profile)
      line += seq + char + '\u001b[0m'
    }
    lines.push(line)
  }

  return lines
}

export const createGradient = (
  stops: ReadonlyArray<GradientStop>,
  direction: GradientConfig['direction'] = 'horizontal',
  interpolation: GradientConfig['interpolation'] = 'linear'
): GradientConfig => ({ stops: [...stops], direction, interpolation })

export const reverseGradient = (gradient: GradientConfig): GradientConfig => ({
  ...gradient,
  stops: gradient.stops
    .map(stop => ({ ...stop, position: 1 - stop.position }))
    .sort((a, b) => a.position - b.position),
})

export const rainbowGradient = (
  direction: GradientConfig['direction'] = 'horizontal'
): GradientConfig =>
  createGradient(
    [
      { position: 0, color: { type: 'rgb', r: 255, g: 0, b: 0 } },
      { position: 0.17, color: { type: 'rgb', r: 255, g: 165, b: 0 } },
      { position: 0.33, color: { type: 'rgb', r: 255, g: 255, b: 0 } },
      { position: 0.5, color: { type: 'rgb', r: 0, g: 255, b: 0 } },
      { position: 0.67, color: { type: 'rgb', r: 0, g: 0, b: 255 } },
      { position: 0.83, color: { type: 'rgb', r: 75, g: 0, b: 130 } },
      { position: 1, color: { type: 'rgb', r: 148, g: 0, b: 211 } },
    ],
    direction,
    'linear'
  )

export const sunsetGradient = (
  direction: GradientConfig['direction'] = 'horizontal'
): GradientConfig =>
  createGradient(
    [
      { position: 0, color: { type: 'rgb', r: 255, g: 94, b: 77 } },
      { position: 0.5, color: { type: 'rgb', r: 255, g: 154, b: 0 } },
      { position: 1, color: { type: 'rgb', r: 255, g: 206, b: 84 } },
    ],
    direction,
    'ease-out'
  )

export const oceanGradient = (
  direction: GradientConfig['direction'] = 'vertical'
): GradientConfig =>
  createGradient(
    [
      { position: 0, color: { type: 'rgb', r: 0, g: 119, b: 190 } },
      { position: 0.5, color: { type: 'rgb', r: 0, g: 180, b: 216 } },
      { position: 1, color: { type: 'rgb', r: 144, g: 224, b: 239 } },
    ],
    direction,
    'ease-in-out'
  )

export type { GradientConfig, GradientStop }
