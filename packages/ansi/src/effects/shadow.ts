/**
 * Shadow Effects - Sub-cell shadow rendering primitives
 *
 * Provides shadow effects for terminal UI using Unicode half-block
 * and shade characters to achieve sub-cell shadow resolution.
 */

import { type Color } from '../color'

// ─── Types ──────────────────────────────────────────────────────────────────

/** Shadow rendering style */
export type ShadowStyle = 'halfblock' | 'shade' | 'solid' | 'gradient'

/** Bitmask constants for which edges receive shadow */
export const ShadowEdges = {
  BOTTOM: 0b0001,
  RIGHT: 0b0010,
  BOTTOM_RIGHT: 0b0100,
  ALL: 0b0111,
} as const

export type ShadowEdges = (typeof ShadowEdges)[keyof typeof ShadowEdges]

/** RGB color triplet for shadow rendering */
export interface ShadowRGB {
  readonly r: number
  readonly g: number
  readonly b: number
}

/** Output cell produced by shadow rendering */
export interface ShadowCell {
  readonly char: string
  readonly fg?: ShadowRGB
  readonly bg?: ShadowRGB
}

/** Full shadow configuration */
export interface ShadowConfig {
  /** Rendering style (default: 'halfblock') */
  readonly style: ShadowStyle
  /** Horizontal offset in cells (default: 1) */
  readonly offsetX: number
  /** Vertical offset in cells (default: 1) */
  readonly offsetY: number
  /** Shadow color */
  readonly color: ShadowRGB
  /** Surface/background color for blending (transparent if omitted) */
  readonly surfaceColor?: ShadowRGB
  /** Bitmask of edges to render (default: ShadowEdges.ALL) */
  readonly edges: number
  /** Opacity 0-1, for animation support (default: 1) */
  readonly opacity: number
}

// ─── Unicode Characters ─────────────────────────────────────────────────────

const UPPER_HALF = '\u2580' // ▀
const LOWER_HALF = '\u2584' // ▄
const LEFT_HALF = '\u258C' // ▌
const RIGHT_HALF = '\u2590' // ▐

const SHADE_LIGHT = '\u2591' // ░
const SHADE_MEDIUM = '\u2592' // ▒
const SHADE_DARK = '\u2593' // ▓

const FULL_BLOCK = '\u2588' // █

// ─── Defaults ───────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: ShadowConfig = {
  style: 'halfblock',
  offsetX: 1,
  offsetY: 1,
  color: { r: 0, g: 0, b: 0 },
  edges: ShadowEdges.ALL,
  opacity: 1,
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function lerpChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t)
}

function lerpColor(from: ShadowRGB, to: ShadowRGB, t: number): ShadowRGB {
  return {
    r: lerpChannel(from.r, to.r, t),
    g: lerpChannel(from.g, to.g, t),
    b: lerpChannel(from.b, to.b, t),
  }
}

function applyOpacity(color: ShadowRGB, opacity: number, surface?: ShadowRGB): ShadowRGB {
  if (opacity >= 1) return color
  const target = surface ?? { r: 0, g: 0, b: 0 }
  return lerpColor(target, color, opacity)
}

function makeEmptyGrid(width: number, height: number): (ShadowCell | null)[][] {
  const grid: (ShadowCell | null)[][] = []
  for (let y = 0; y < height; y++) {
    grid.push(new Array(width).fill(null))
  }
  return grid
}

// ─── Renderers ──────────────────────────────────────────────────────────────

function renderHalfBlock(
  width: number,
  height: number,
  config: ShadowConfig,
): (ShadowCell | null)[][] {
  const { offsetX, offsetY, color, surfaceColor, edges, opacity } = config
  const totalW = width + offsetX
  const totalH = height + offsetY
  const grid = makeEmptyGrid(totalW, totalH)
  const shadowColor = applyOpacity(color, opacity, surfaceColor)

  // Bottom edge
  if (edges & ShadowEdges.BOTTOM) {
    for (let y = height; y < totalH; y++) {
      for (let x = 0; x < width; x++) {
        const row = grid[y]
        if (row) {
          // Top of shadow cell meets element bottom: use upper half block
          row[x] = y === height
            ? { char: UPPER_HALF, fg: shadowColor, bg: surfaceColor }
            : { char: FULL_BLOCK, fg: shadowColor }
        }
      }
    }
  }

  // Right edge
  if (edges & ShadowEdges.RIGHT) {
    for (let y = 0; y < height; y++) {
      for (let x = width; x < totalW; x++) {
        const row = grid[y]
        if (row) {
          // Left of shadow cell meets element right: use left half block
          row[x] = x === width
            ? { char: LEFT_HALF, fg: shadowColor, bg: surfaceColor }
            : { char: FULL_BLOCK, fg: shadowColor }
        }
      }
    }
  }

  // Bottom-right corner
  if (edges & ShadowEdges.BOTTOM_RIGHT) {
    for (let y = height; y < totalH; y++) {
      for (let x = width; x < totalW; x++) {
        const row = grid[y]
        if (row) {
          if (y === height && x === width) {
            // Corner: shadow occupies upper-left quadrant visually
            row[x] = { char: UPPER_HALF, fg: shadowColor, bg: surfaceColor }
          } else if (y === height) {
            row[x] = { char: UPPER_HALF, fg: shadowColor, bg: surfaceColor }
          } else if (x === width) {
            row[x] = { char: LEFT_HALF, fg: shadowColor, bg: surfaceColor }
          } else {
            row[x] = { char: FULL_BLOCK, fg: shadowColor }
          }
        }
      }
    }
  }

  return grid
}

function renderShade(
  width: number,
  height: number,
  config: ShadowConfig,
): (ShadowCell | null)[][] {
  const { offsetX, offsetY, color, surfaceColor, edges, opacity } = config
  const totalW = width + offsetX
  const totalH = height + offsetY
  const grid = makeEmptyGrid(totalW, totalH)
  const shadowColor = applyOpacity(color, opacity, surfaceColor)

  const shadeChars = [SHADE_LIGHT, SHADE_MEDIUM, SHADE_DARK]

  // Determine max shadow depth for gradient selection
  const maxDepth = Math.max(offsetX, offsetY)

  function shadeCharForDepth(distFromEdge: number): string {
    if (maxDepth <= 1) return SHADE_DARK
    const normalized = distFromEdge / (maxDepth - 1)
    const idx = Math.min(Math.floor(normalized * 3), 2)
    return shadeChars[idx] ?? SHADE_LIGHT
  }

  // Bottom edge
  if (edges & ShadowEdges.BOTTOM) {
    for (let y = height; y < totalH; y++) {
      const depth = y - height
      for (let x = 0; x < width; x++) {
        const row = grid[y]
        if (row) {
          row[x] = { char: shadeCharForDepth(depth), fg: shadowColor, bg: surfaceColor }
        }
      }
    }
  }

  // Right edge
  if (edges & ShadowEdges.RIGHT) {
    for (let y = 0; y < height; y++) {
      for (let x = width; x < totalW; x++) {
        const depth = x - width
        const row = grid[y]
        if (row) {
          row[x] = { char: shadeCharForDepth(depth), fg: shadowColor, bg: surfaceColor }
        }
      }
    }
  }

  // Bottom-right corner
  if (edges & ShadowEdges.BOTTOM_RIGHT) {
    for (let y = height; y < totalH; y++) {
      for (let x = width; x < totalW; x++) {
        const depth = Math.min(y - height, x - width)
        const row = grid[y]
        if (row) {
          row[x] = { char: shadeCharForDepth(depth), fg: shadowColor, bg: surfaceColor }
        }
      }
    }
  }

  return grid
}

function renderSolid(
  width: number,
  height: number,
  config: ShadowConfig,
): (ShadowCell | null)[][] {
  const { offsetX, offsetY, color, edges, opacity, surfaceColor } = config
  const totalW = width + offsetX
  const totalH = height + offsetY
  const grid = makeEmptyGrid(totalW, totalH)
  const shadowColor = applyOpacity(color, opacity, surfaceColor)

  // Bottom edge
  if (edges & ShadowEdges.BOTTOM) {
    for (let y = height; y < totalH; y++) {
      for (let x = 0; x < width; x++) {
        const row = grid[y]
        if (row) {
          row[x] = { char: ' ', bg: shadowColor }
        }
      }
    }
  }

  // Right edge
  if (edges & ShadowEdges.RIGHT) {
    for (let y = 0; y < height; y++) {
      for (let x = width; x < totalW; x++) {
        const row = grid[y]
        if (row) {
          row[x] = { char: ' ', bg: shadowColor }
        }
      }
    }
  }

  // Bottom-right corner
  if (edges & ShadowEdges.BOTTOM_RIGHT) {
    for (let y = height; y < totalH; y++) {
      for (let x = width; x < totalW; x++) {
        const row = grid[y]
        if (row) {
          row[x] = { char: ' ', bg: shadowColor }
        }
      }
    }
  }

  return grid
}

function renderGradient(
  width: number,
  height: number,
  config: ShadowConfig,
): (ShadowCell | null)[][] {
  const { offsetX, offsetY, color, surfaceColor, edges, opacity } = config
  const totalW = width + offsetX
  const totalH = height + offsetY
  const grid = makeEmptyGrid(totalW, totalH)
  const baseColor = applyOpacity(color, opacity, surfaceColor)
  const fadeTarget = surfaceColor ?? { r: 0, g: 0, b: 0 }

  // Max depth for normalization
  const maxDepthX = offsetX
  const maxDepthY = offsetY

  function gradientColor(distX: number, distY: number): ShadowRGB {
    const normX = maxDepthX > 0 ? distX / maxDepthX : 0
    const normY = maxDepthY > 0 ? distY / maxDepthY : 0
    const t = Math.max(normX, normY)
    return lerpColor(baseColor, fadeTarget, t)
  }

  // Bottom edge
  if (edges & ShadowEdges.BOTTOM) {
    for (let y = height; y < totalH; y++) {
      const dy = y - height + 1
      for (let x = 0; x < width; x++) {
        const row = grid[y]
        if (row) {
          const layerColor = gradientColor(0, dy)
          row[x] = { char: ' ', bg: layerColor }
        }
      }
    }
  }

  // Right edge
  if (edges & ShadowEdges.RIGHT) {
    for (let y = 0; y < height; y++) {
      for (let x = width; x < totalW; x++) {
        const dx = x - width + 1
        const row = grid[y]
        if (row) {
          const layerColor = gradientColor(dx, 0)
          row[x] = { char: ' ', bg: layerColor }
        }
      }
    }
  }

  // Bottom-right corner
  if (edges & ShadowEdges.BOTTOM_RIGHT) {
    for (let y = height; y < totalH; y++) {
      for (let x = width; x < totalW; x++) {
        const dy = y - height + 1
        const dx = x - width + 1
        const row = grid[y]
        if (row) {
          const layerColor = gradientColor(dx, dy)
          row[x] = { char: ' ', bg: layerColor }
        }
      }
    }
  }

  return grid
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Render a shadow as a 2D grid of ShadowCells.
 *
 * The returned grid has dimensions (height + offsetY) x (width + offsetX).
 * Cells within the element bounds (top-left width x height area) are null.
 * Shadow cells contain the character and color information needed for compositing.
 *
 * @param width - Element width in cells
 * @param height - Element height in cells
 * @param config - Partial shadow configuration (defaults applied)
 * @returns 2D grid of shadow cells
 *
 * @example
 * ```typescript
 * const cells = renderShadow(10, 5, {
 *   style: 'halfblock',
 *   color: { r: 0, g: 0, b: 0 },
 *   opacity: 0.6,
 * })
 * ```
 */
export function renderShadow(
  width: number,
  height: number,
  config: Partial<ShadowConfig> = {},
): ShadowCell[][] {
  const resolved: ShadowConfig = { ...DEFAULT_CONFIG, ...config }

  if (width <= 0 || height <= 0 || resolved.offsetX <= 0 || resolved.offsetY <= 0) {
    return []
  }

  let grid: (ShadowCell | null)[][]

  switch (resolved.style) {
    case 'halfblock':
      grid = renderHalfBlock(width, height, resolved)
      break
    case 'shade':
      grid = renderShade(width, height, resolved)
      break
    case 'solid':
      grid = renderSolid(width, height, resolved)
      break
    case 'gradient':
      grid = renderGradient(width, height, resolved)
      break
    default:
      grid = renderHalfBlock(width, height, resolved)
  }

  // Convert nulls to empty transparent cells for consistent output
  return grid.map(row =>
    row.map(cell => cell ?? { char: '' }),
  )
}

// ─── Builder ────────────────────────────────────────────────────────────────

/** Chainable builder for ShadowConfig */
export interface ShadowConfigBuilder {
  style(style: ShadowStyle): ShadowConfigBuilder
  offset(x: number, y: number): ShadowConfigBuilder
  surface(color: ShadowRGB): ShadowConfigBuilder
  edges(edges: number): ShadowConfigBuilder
  opacity(opacity: number): ShadowConfigBuilder
  build(): ShadowConfig
}

/**
 * Create a ShadowConfig using a chainable builder pattern.
 *
 * @param color - Base shadow color
 * @returns Chainable builder
 *
 * @example
 * ```typescript
 * const config = createShadowConfig({ r: 0, g: 0, b: 0 })
 *   .style('gradient')
 *   .offset(2, 1)
 *   .opacity(0.7)
 *   .build()
 * ```
 */
export function createShadowConfig(color: ShadowRGB): ShadowConfigBuilder {
  let cfg: ShadowConfig = { ...DEFAULT_CONFIG, color }

  const builder: ShadowConfigBuilder = {
    style(style) {
      cfg = { ...cfg, style }
      return builder
    },
    offset(x, y) {
      cfg = { ...cfg, offsetX: x, offsetY: y }
      return builder
    },
    surface(surfaceColor) {
      cfg = { ...cfg, surfaceColor }
      return builder
    },
    edges(edges) {
      cfg = { ...cfg, edges }
      return builder
    },
    opacity(opacity) {
      cfg = { ...cfg, opacity: Math.max(0, Math.min(1, opacity)) }
      return builder
    },
    build() {
      return cfg
    },
  }

  return builder
}

// ─── Legacy API (backward-compatible) ───────────────────────────────────────

/** @deprecated Use ShadowConfig instead */
export interface LegacyShadowConfig {
  readonly offset: { x: number; y: number }
  readonly blur: number
  readonly color: Color
  readonly opacity: number
}

/**
 * Create a drop shadow effect (legacy string-based API).
 *
 * @deprecated Use renderShadow for cell-based rendering
 */
export const createDropShadow = (content: string[], config: LegacyShadowConfig): string[] => {
  const { offset } = config
  const result: string[] = []
  const maxWidth = Math.max(0, ...content.map(line => line.length))

  const shadowLines = content.map(line => {
    const paddedLine = line.padEnd(maxWidth)
    return paddedLine
      .split('')
      .map(char => (char === ' ' ? ' ' : SHADE_LIGHT))
      .join('')
  })

  if (offset.y > 0) {
    result.push(...content)
    for (let i = 0; i < offset.y && i < shadowLines.length; i++) {
      result.push(' '.repeat(offset.x) + (shadowLines[i] ?? ''))
    }
  } else if (offset.y < 0) {
    for (let i = 0; i < -offset.y && i < shadowLines.length; i++) {
      result.push(shadowLines[i] ?? '')
    }
    result.push(...content)
  } else {
    result.push(...content)
  }

  return result
}

/**
 * Create an inner shadow effect (legacy string-based API).
 *
 * @deprecated Use renderShadow for cell-based rendering
 */
export const createInnerShadow = (content: string[], _config: LegacyShadowConfig): string[] => {
  return content.map((line, y) => {
    return line
      .split('')
      .map((char, x) => {
        const isEdge = x === 0 || x === line.length - 1 || y === 0 || y === content.length - 1
        return isEdge && char !== ' ' ? SHADE_DARK : char
      })
      .join('')
  })
}
