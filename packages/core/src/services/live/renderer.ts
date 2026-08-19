/**
 * @since 1.0.0
 */
import { Effect, Layer, Option, Ref, pipe } from 'effect'

import type { StyleProps as AnsiStyle } from '@tuix/ansi'
import { visualWidth, parseVisualCells, joinVisualCells, rgb } from '@tuix/ansi'
import { wrapStyledLine } from '@tuix/ansi'
import { truncate } from '@tuix/ansi'
import { RendererService } from '../renderer'
import { TerminalService } from '../terminal'
import type { View } from '../../../types/core'
import { collectOverlays } from '../../types/overlay'
import { RenderError } from '../../types/errors'
import type { Viewport } from '../../../types/schemas'
import { toAnsiStyleCode } from '@tuix/ansi'
import { cursorTo } from '@tuix/ansi'

/** DECSET 2026 — begin synchronized update (terminal buffers until ESU). */
const SYNC_UPDATE_BEGIN = '\x1b[?2026h'
/** DECSET 2026 — end synchronized update (terminal paints the frame). */
const SYNC_UPDATE_END = '\x1b[?2026l'

/** Visual width of a grapheme, memoized (width is a diff-loop hotspot). */
const widthCache = new Map<string, number>()
function graphemeWidth(char: string): number {
  const cached = widthCache.get(char)
  if (cached !== undefined) return cached
  const width = Bun.stringWidth(char)
  if (widthCache.size > 4096) widthCache.clear()
  widthCache.set(char, width)
  return width
}

function stylesEqual(a: Option.Option<AnsiStyle>, b: Option.Option<AnsiStyle>): boolean {
  if (Option.isNone(a) && Option.isNone(b)) return true
  if (Option.isNone(a) || Option.isNone(b)) return false
  const left = a.value
  const right = b.value
  return (
    JSON.stringify(left.foreground ?? null) === JSON.stringify(right.foreground ?? null) &&
    JSON.stringify(left.background ?? null) === JSON.stringify(right.background ?? null)
  )
}

/** Blend factor for scrim cells — how much light survives beneath a modal. */
const SCRIM_KEEP = 0.45

function scaleColor(c: unknown, keep: number): unknown {
  if (!c || typeof c !== 'object') return c
  const col = c as { type?: string; r?: number; g?: number; b?: number; value?: string }
  if (col.type === 'rgb' && typeof col.r === 'number') {
    return rgb(Math.round(col.r * keep), Math.round(col.g! * keep), Math.round(col.b! * keep))
  }
  return col
}

/** Dim a composited cell (scrim): scale its fg/bg toward black. */
function dimCell(cell: Cell): Cell {
  if (Option.isNone(cell.style)) {
    // No style: emit an explicit dark background so the scrim is visible
    // even over default-colored text beneath.
    return { char: cell.char, style: Option.some({ background: rgb(6, 8, 11) }), painted: true }
  }
  const s = cell.style.value
  return {
    char: cell.char,
    style: Option.some({
      ...s,
      foreground: scaleColor(s.foreground, SCRIM_KEEP) as AnsiStyle['foreground'],
      background: scaleColor(s.background, SCRIM_KEEP) as AnsiStyle['background'],
    }),
    painted: true,
  }
}

// -----------------------------------------------------------------------------
// Models
// -----------------------------------------------------------------------------

/**
 * Represents a single character cell on the screen.
 *
 * @internal
 */
interface Cell {
  /** The character to be rendered */
  readonly char: string
  /** The style to be applied to the character */
  readonly style: Option.Option<AnsiStyle>
  /** True when this cell was written this frame (spaces included). */
  readonly painted: boolean
  /** Scrim cell: blend whatever is beneath toward the dim floor (modal backdrop). */
  readonly scrim?: boolean
}

/**
 * Represents a patch of changes to be applied to the screen.
 *
 * @internal
 */
interface DiffPatch {
  /** The x-coordinate of the patch */
  readonly x: number
  /** The y-coordinate of the patch */
  readonly y: number
  /** The cells to be rendered in the patch */
  readonly cells: ReadonlyArray<Cell>
}

/**
 * Represents a layer to be rendered on the screen.
 *
 * @internal
 */
interface RenderLayer {
  /** The unique ID of the layer */
  readonly id: number
  /** The name of the layer */
  readonly name: string
  /** The z-index of the layer */
  readonly zIndex: number
  /** Whether the layer is visible */
  visible: boolean
  /** The buffer containing the layer's content */
  buffer: Buffer
  /** The viewport of the layer */
  viewport: Viewport
}

/**
 * Render statistics
 *
 * @internal
 */
interface RenderStats {
  framesRendered: number
  averageFrameTime: number
  lastFrameTime: number
  dirtyRegionCount: number
  bufferSwitches: number
  forcedRedraws: number
}

/**
 * Represents the state of the renderer.
 *
 * @internal
 */
interface RenderState {
  layers: RenderLayer[]
  viewports: Viewport[]
  stats: RenderStats
}

// -----------------------------------------------------------------------------
// Screen buffer (cell grid) — not Node.js Buffer
// -----------------------------------------------------------------------------

class ScreenBuffer {
  readonly width: number
  readonly height: number
  private cells: Cell[][]

  constructor(width: number, height: number) {
    this.width = Math.max(0, width | 0)
    this.height = Math.max(0, height | 0)
    this.cells = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => ({
        char: ' ',
        style: Option.none<AnsiStyle>(),
        painted: false,
      }))
    )
  }

  clear(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.cells[y]![x] = { char: ' ', style: Option.none(), painted: false }
      }
    }
  }

  /**
   * Fill every cell with a scrim marker (modal backdrop). Composite blends
   * whatever is beneath toward the dim floor instead of covering it.
   */
  fillScrim(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.cells[y]![x] = {
          char: ' ',
          style: Option.none(),
          painted: true,
          scrim: true,
        }
      }
    }
  }

  /**
   * Bounding box of the inked region (overlay hit-testing). Leading padding
   * spaces from flow positioning are ignored — a click targets ink, and a
   * modal lifted out of flow carries its position as leading whitespace.
   * Returns null when nothing was inked this frame.
   */
  contentBounds(): { x: number; y: number; width: number; height: number } | null {
    let minX = this.width
    let minY = this.height
    let maxX = -1
    let maxY = -1
    for (let y = 0; y < this.height; y++) {
      const row = this.cells[y]!
      for (let x = 0; x < this.width; x++) {
        const cell = row[x]!
        if (cell.painted && cell.char !== ' ') {
          if (x < minX) minX = x
          if (y < minY) minY = y
          if (x > maxX) maxX = x
          if (y > maxY) maxY = y
        }
      }
    }
    if (maxX < 0) return null
    return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
  }

  writeText(x: number, y: number, text: string | { content?: string }): void {
    const raw =
      typeof text === 'string'
        ? text
        : text && typeof text === 'object' && 'content' in text
          ? String((text as { content?: string }).content ?? '')
          : String(text ?? '')
    const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
    for (let ly = 0; ly < lines.length; ly++) {
      const row = y + ly
      if (row < 0 || row >= this.height) continue
      const cells = parseVisualCells(lines[ly] ?? '')
      let col = x
      for (let lx = 0; lx < cells.length; lx++) {
        if (col < 0 || col >= this.width) break
        const cell = cells[lx]!
        const style =
          cell.fg || cell.bg
            ? Option.some({
                ...(cell.fg ? { foreground: rgb(cell.fg.r, cell.fg.g, cell.fg.b) } : {}),
                ...(cell.bg ? { background: rgb(cell.bg.r, cell.bg.g, cell.bg.b) } : {}),
              })
            : Option.none<AnsiStyle>()
        this.cells[row]![col] = { char: cell.char || ' ', style, painted: true }
        // parseVisualCells already expands wide graphemes into trailing
        // space cells, so one cell is one column — advance accordingly.
        col += graphemeWidth(cell.char || ' ')
      }
    }
  }

  composite(other: ScreenBuffer, ox: number, oy: number, transparent = false): void {
    for (let y = 0; y < other.height; y++) {
      const ty = oy + y
      if (ty < 0 || ty >= this.height) continue
      for (let x = 0; x < other.width; x++) {
        const tx = ox + x
        if (tx < 0 || tx >= this.width) continue
        const cell = other.cells[y]![x]!
        if (!transparent || cell.painted) {
          if (cell.scrim) {
            this.cells[ty]![tx] = dimCell(this.cells[ty]![tx]!)
          } else {
            this.cells[ty]![tx] = { ...cell }
          }
        }
      }
    }
  }

  diff(other: ScreenBuffer): DiffPatch[] {
    const patches: DiffPatch[] = []
    const h = Math.min(this.height, other.height)
    const w = Math.min(this.width, other.width)
    for (let y = 0; y < h; y++) {
      let run: Cell[] = []
      let runX = 0
      const flush = () => {
        if (run.length) {
          patches.push({ x: runX, y, cells: run })
          run = []
        }
      }
      for (let x = 0; x < w; x++) {
        const a = this.cells[y]![x]!
        const b = other.cells[y]![x]!
        if (a.char !== b.char || !stylesEqual(a.style, b.style)) {
          if (!run.length) runX = x
          run.push(b)
          // Wide graphemes (especially emoji with VS16) leave residue in the
          // trailing columns the old glyph occupied: some terminals do not
          // clear them when a narrower glyph replaces a wide one. Extend the
          // patch across the wider span so those columns are repainted
          // explicitly even when the new cells match the previous buffer.
          const span = Math.max(graphemeWidth(a.char), graphemeWidth(b.char))
          for (let t = 1; t < span && x + t < w; t++) {
            run.push(other.cells[y]![x + t]!)
          }
          x += span - 1
        } else {
          flush()
        }
      }
      flush()
    }
    return patches
  }

  toString(): string {
    return this.cells.map(row => row.map(c => c.char).join('')).join('\n')
  }
}

// Type alias used throughout this file
type Buffer = ScreenBuffer
const Buffer = ScreenBuffer

/**
 * Clip a styled line to the [start, end) visual-column range without
 * cutting escape sequences mid-way. Wide cells straddling a boundary
 * are dropped whole.
 */
const clipLineVisual = (line: string, start: number, end: number): string => {
  const cells = parseVisualCells(line)
  const kept: typeof cells = []
  let col = 0
  for (const cell of cells) {
    const cellWidth = Bun.stringWidth(cell.char)
    if (col >= start && col + cellWidth <= end) kept.push(cell)
    col += cellWidth
    if (col >= end) break
  }
  return joinVisualCells(kept)
}

// -----------------------------------------------------------------------------
// Implementation
// -----------------------------------------------------------------------------

/**
 * Live RendererService: double-buffered cell renderer.
 *
 * @since 1.0.0
 * @category layers
 */
export const RendererServiceLive = Layer.effect(
  RendererService,
  Effect.gen(function* (_) {
    const terminal = yield* _(TerminalService)

    // Get terminal info
    const defaultSize = yield* _(terminal.getSize)

    // Create double buffers
    const frontBuffer = yield* _(
      Ref.make(new Buffer(defaultSize.width ?? 80, defaultSize.height ?? 24))
    )
    const backBuffer = yield* _(
      Ref.make(new Buffer(defaultSize.width ?? 80, defaultSize.height ?? 24))
    )

    // Create state
    const initialState: RenderState = {
      layers: [
        {
          id: 0,
          name: 'main',
          zIndex: 0,
          visible: true,
          buffer: new Buffer(defaultSize.width ?? 0, defaultSize.height ?? 0),
          viewport: {
            x: 0,
            y: 0,
            width: defaultSize.width ?? 0,
            height: defaultSize.height ?? 0,
          },
        },
      ],
      viewports: [
        {
          x: 0,
          y: 0,
          width: defaultSize.width ?? 0,
          height: defaultSize.height ?? 0,
        },
      ],
      stats: {
        framesRendered: 0,
        averageFrameTime: 0,
        lastFrameTime: 0,
        dirtyRegionCount: 0,
        bufferSwitches: 0,
        forcedRedraws: 0,
      },
    }
    const state = yield* _(Ref.make(initialState))
    /** Bounds of the painted overlay layer (backdrop hit-testing). */
    const overlayBounds = yield* _(
      Ref.make<{ x: number; y: number; width: number; height: number } | null>(null)
    )

    // Dirty-region tracking (real): markDirty appends, optimizeDirtyRegions
    // merges overlapping/adjacent rects, clearDirtyRegions resets after paint.
    let dirtyRegions: Array<{ x: number; y: number; width: number; height: number }> = []

    function mergeDirtyRegions(
      regions: Array<{ x: number; y: number; width: number; height: number }>
    ): Array<{ x: number; y: number; width: number; height: number }> {
      const merged: Array<{ x: number; y: number; width: number; height: number }> = []
      for (const region of regions) {
        const overlapping = merged.findIndex(
          existing =>
            region.x <= existing.x + existing.width &&
            existing.x <= region.x + region.width &&
            region.y <= existing.y + existing.height &&
            existing.y <= region.y + region.height
        )
        if (overlapping === -1) {
          merged.push({ ...region })
          continue
        }
        const existing = merged[overlapping]!
        const x = Math.min(existing.x, region.x)
        const y = Math.min(existing.y, region.y)
        merged[overlapping] = {
          x,
          y,
          width: Math.max(existing.x + existing.width, region.x + region.width) - x,
          height: Math.max(existing.y + existing.height, region.y + region.height) - y,
        }
      }
      return merged
    }

    // Frame timing (real): beginFrame stamps, endFrame computes the delta.
    const frameStartRef: { ts: number | null } = { ts: null }

    // Monotonic layer ids so create/remove/create never collides.
    let nextLayerId = initialState.layers.length

    // Clip region: applied by renderAt so writes stay inside the rect.
    let clipRegion: { x: number; y: number; width: number; height: number } | null = null

    // Profiling toggle: when enabled, per-frame timings accumulate into
    // a ring buffer exposed through getStats-adjacent logs. The stats
    // themselves always update; profiling only controls the retention.
    let profilingEnabled = false
    const frameTimeHistory: number[] = []
    const FRAME_HISTORY = 120

    const measureText = (
      text: string
    ): Effect.Effect<{ width: number; height: number; lineCount: number }, never, never> =>
      Effect.sync(() => {
        const lines = text.split('\n')
        const width = Math.max(0, ...lines.map(line => visualWidth(line)))
        return { width, height: lines.length, lineCount: lines.length }
      })

    const beginFrame = Effect.gen(function* (_) {
      frameStartRef.ts = Date.now()
      const size = yield* _(terminal.getSize)
      const width = size.width && size.width > 0 ? size.width : 80
      const height = size.height && size.height > 0 ? size.height : 24
      let back = yield* _(Ref.get(backBuffer))
      if (width !== back.width || height !== back.height) {
        back = new Buffer(width, height)
        yield* _(Ref.set(backBuffer, back))
        yield* _(Ref.set(frontBuffer, new Buffer(width, height)))
        yield* _(
          Ref.update(state, s => ({
            ...s,
            layers: s.layers.map(layer => ({
              ...layer,
              buffer: new Buffer(width, height),
              viewport: { ...layer.viewport, width, height },
            })),
            viewports: s.viewports.map(vp => ({ ...vp, width, height })),
          }))
        )
      }

      back.clear()
    }).pipe(Effect.catchAll(cause => Effect.fail(new RenderError({ phase: 'paint', cause }))))

    const endFrame = Effect.gen(function* (_) {
      const frameStart = frameStartRef.ts
      const frameElapsed = frameStart ? Date.now() - frameStart : 0
      if (profilingEnabled) {
        frameTimeHistory.push(frameElapsed)
        if (frameTimeHistory.length > FRAME_HISTORY) frameTimeHistory.shift()
      }
      const front = yield* _(Ref.get(frontBuffer))
      const back = yield* _(Ref.get(backBuffer))

      // Composite layers into back buffer
      yield* _(compositeLayers)

      // Track the painted overlay extent for backdrop hit-testing.
      {
        const s = yield* _(Ref.get(state))
        const overlay = s.layers.find(l => l.name === 'overlay')
        yield* _(
          Ref.set(overlayBounds, overlay && overlay.visible ? overlay.buffer.contentBounds() : null)
        )
      }

      // Diff front and back buffers
      const diff = front.diff(back)

      if (diff.length > 0) {
        yield* _(applyPatches(diff))
        yield* _(
          Ref.update(state, s => ({
            ...s,
            stats: {
              ...s.stats,
              dirtyRegionCount: s.stats.dirtyRegionCount + 1,
            },
          }))
        )
      }

      // Swap buffers
      yield* _(Ref.set(frontBuffer, back))
      yield* _(Ref.set(backBuffer, front))

      yield* _(
        Ref.update(state, s => ({
          ...s,
          stats: {
            ...s.stats,
            framesRendered: s.stats.framesRendered + 1,
            bufferSwitches: s.stats.bufferSwitches + 1,
            lastFrameTime: frameElapsed,
            averageFrameTime:
              s.stats.framesRendered === 0
                ? frameElapsed
                : (s.stats.averageFrameTime * s.stats.framesRendered + frameElapsed) /
                  (s.stats.framesRendered + 1),
          },
        }))
      )
    })

    const ensureLayer = (
      name: string,
      zIndex: number,
      width: number,
      height: number
    ): Effect.Effect<RenderLayer, never, never> =>
      Effect.gen(function* (_) {
        const s = yield* _(Ref.get(state))
        const existing = s.layers.find(l => l.name === name)
        if (existing) {
          if (existing.buffer.width !== width || existing.buffer.height !== height) {
            existing.buffer = new Buffer(width, height)
            existing.viewport = { ...existing.viewport, width, height }
          }
          return existing
        }
        const created: RenderLayer = {
          id: s.layers.length,
          name,
          zIndex,
          visible: true,
          buffer: new Buffer(width, height),
          viewport: { x: 0, y: 0, width, height },
        }
        yield* _(
          Ref.update(state, current => ({
            ...current,
            layers: [...current.layers, created],
          }))
        )
        return created
      })

    const paintViewToLayer = (
      layer: RenderLayer,
      view: View,
      x: number,
      y: number
    ): Effect.Effect<void, RenderError, never> =>
      Effect.gen(function* (_) {
        const rendered = yield* _(view.render())
        const content =
          typeof rendered === 'string'
            ? rendered
            : String((rendered as { content?: string }).content ?? '')
        layer.buffer.writeText(x, y, content)
      })

    const render = (view: View): Effect.Effect<void, RenderError, never> =>
      Effect.gen(function* (_) {
        const size = yield* _(terminal.getSize)
        const width = size.width && size.width > 0 ? size.width : 80
        const height = size.height && size.height > 0 ? size.height : 24
        const mainLayer = yield* _(ensureLayer('main', 0, width, height))
        mainLayer.buffer.clear()
        yield* _(paintViewToLayer(mainLayer, view, 0, 0))

        const overlays = collectOverlays(view)
        const overlayLayer = yield* _(ensureLayer('overlay', 1, width, height))
        overlayLayer.buffer.clear()
        overlayLayer.visible = overlays.length > 0
        // Any scrim overlay dims the entire surface before content paints
        // on top of the dimmed layer.
        if (overlays.some(o => o.scrim)) {
          overlayLayer.buffer.fillScrim()
        }
        for (const overlay of overlays) {
          yield* _(paintViewToLayer(overlayLayer, overlay.view, overlay.x, overlay.y))
        }
      }).pipe(Effect.catchAll(cause => Effect.fail(new RenderError({ phase: 'paint', cause }))))

    const forceRedraw: Effect.Effect<void, RenderError, never> = Effect.gen(function* (_) {
      const front = yield* _(Ref.get(frontBuffer))
      const back = yield* _(Ref.get(backBuffer))
      // Mark full buffer dirty by clearing front so next endFrame paints all
      front.clear()
      yield* _(Ref.set(frontBuffer, front))
      // Ensure back has content to diff against on next frame
      yield* _(Ref.set(backBuffer, back))
      yield* _(
        Ref.update(state, s => ({
          ...s,
          stats: { ...s.stats, forcedRedraws: s.stats.forcedRedraws + 1 },
        }))
      )
    }).pipe(Effect.catchAll(cause => Effect.fail(new RenderError({ phase: 'paint', cause }))))

    const getStats: Effect.Effect<RenderStats, never, never> = Ref.get(state).pipe(
      Effect.map(s => s.stats)
    )

    const getViewports: Effect.Effect<ReadonlyArray<Viewport>, never, never> = Ref.get(state).pipe(
      Effect.map(s => s.viewports)
    )

    const pushViewport = (size: Partial<Viewport>): Effect.Effect<void, RenderError, never> =>
      Effect.gen(function* (_) {
        const termSize = yield* _(terminal.getSize)
        const s = yield* _(Ref.get(state))
        const current = s.viewports[s.viewports.length - 1] ?? {
          x: 0,
          y: 0,
          width: termSize.width ?? 0,
          height: termSize.height ?? 0,
        }
        const newViewport: Viewport = {
          x: size.x ?? current.x,
          y: size.y ?? current.y,
          width: size.width ?? current.width,
          height: size.height ?? current.height,
        }
        yield* _(
          Ref.update(state, s => ({
            ...s,
            viewports: [...s.viewports, newViewport],
          }))
        )
      }).pipe(Effect.catchAll(cause => Effect.fail(new RenderError({ phase: 'layout', cause }))))

    const popViewport: Effect.Effect<void, never, never> = Ref.update(state, s => ({
      ...s,
      viewports: s.viewports.slice(0, -1),
    }))

    const getLayers: Effect.Effect<
      ReadonlyArray<{
        readonly name: string
        readonly zIndex: number
        readonly visible: boolean
        readonly text: string
      }>,
      never,
      never
    > = Ref.get(state).pipe(
      Effect.map(s =>
        s.layers.map(layer => ({
          name: layer.name,
          zIndex: layer.zIndex,
          visible: layer.visible,
          text: layer.buffer.toString(),
        }))
      )
    )

    const updateLayers = (layers: ReadonlyArray<RenderLayer>): Effect.Effect<void, never, never> =>
      Ref.update(state, s => ({ ...s, layers: [...layers] }))

    const saveState: Effect.Effect<RenderState, never, never> = Ref.get(state)

    const restoreState = (s: RenderState): Effect.Effect<void, RenderError, never> =>
      Ref.set(state, s).pipe(
        Effect.catchAll(cause => Effect.fail(new RenderError({ phase: 'layout', cause })))
      )

    // One-deep save/restore stack backing the interface's plain effects.
    let stateSnapshot: RenderState | null = null
    const saveStateVoid: Effect.Effect<void, RenderError, never> = Effect.gen(function* (_) {
      stateSnapshot = yield* _(Ref.get(state))
    })
    const restoreStateVoid: Effect.Effect<void, RenderError, never> = Effect.gen(function* (_) {
      if (!stateSnapshot) return
      yield* _(restoreState(stateSnapshot))
    })

    const renderViewToLayer = (
      view: View,
      layerId: number
    ): Effect.Effect<void, RenderError, never> =>
      Effect.gen(function* (_) {
        const s = yield* _(Ref.get(state))
        const layer = s.layers.find((l: RenderLayer) => l.id === layerId)

        if (layer) {
          const rendered = yield* _(view.render())
          layer.buffer.writeText(0, 0, rendered)
        }
      }).pipe(Effect.catchAll(cause => Effect.fail(new RenderError({ phase: 'paint', cause }))))

    const compositeLayers: Effect.Effect<void, RenderError, never> = Effect.gen(function* (_) {
      const s = yield* _(Ref.get(state))
      const back = yield* _(Ref.get(backBuffer))
      const sortedLayers = [...s.layers].sort((a, b) => a.zIndex - b.zIndex)

      for (const layer of sortedLayers) {
        if (layer.visible) {
          back.composite(layer.buffer, layer.viewport.x, layer.viewport.y, layer.zIndex > 0)
        }
      }
    }).pipe(Effect.catchAll(cause => Effect.fail(new RenderError({ phase: 'composite', cause }))))

    const applyPatches = (
      patches: ReadonlyArray<DiffPatch>
    ): Effect.Effect<void, RenderError, never> =>
      Effect.gen(function* (_) {
        let currentStyle: Option.Option<AnsiStyle> = Option.none()
        const caps = yield* _(terminal.getCapabilities)

        // One write per frame: the whole diff is concatenated into a single
        // payload so the terminal never presents a partial frame, and the
        // payload is wrapped in DECSET 2026 synchronized output (BSU/ESU) so
        // capable terminals hold rendering until the frame is complete.
        // Emitted unconditionally: terminals that ignore 2026 paint as bytes
        // arrive (no worse than before), and probing via DECRQM misreports
        // under tmux ≥3.7.
        let frame = SYNC_UPDATE_BEGIN

        for (const patch of patches) {
          // CUP is 1-based; the cell buffer is 0-based.
          frame += cursorTo(patch.x + 1, patch.y + 1)

          let line = ''
          for (const cell of patch.cells) {
            if (!stylesEqual(cell.style, currentStyle)) {
              if (line.length > 0) {
                frame += line
                line = ''
              }
              const styleCode = pipe(
                cell.style,
                Option.map(s => toAnsiStyleCode(s, caps.colorProfile)),
                Option.getOrElse(() => toAnsiStyleCode({}, caps.colorProfile))
              )
              frame += styleCode
              currentStyle = cell.style
            }
            line += cell.char
          }

          if (line.length > 0) {
            frame += line
          }
        }

        frame += `\x1b[0m${SYNC_UPDATE_END}`
        yield* _(terminal.write(frame))
      }).pipe(Effect.catchAll(cause => Effect.fail(new RenderError({ phase: 'composite', cause }))))

    const setViewport = (viewport: Viewport) =>
      Effect.gen(function* (_) {
        yield* _(
          Ref.update(state, s => ({
            ...s,
            viewports: s.viewports.length ? [...s.viewports.slice(0, -1), viewport] : [viewport],
          }))
        )
      }).pipe(Effect.catchAll(cause => Effect.fail(new RenderError({ phase: 'layout', cause }))))

    const getViewport = Ref.get(state).pipe(
      Effect.map(
        s =>
          s.viewports[s.viewports.length - 1] ?? {
            x: 0,
            y: 0,
            width: 80,
            height: 24,
          }
      )
    )

    const noop = Effect.void
    const emptyDirty = Effect.succeed([] as const)

    return RendererService.of({
      beginFrame,
      endFrame,
      render,
      forceRedraw,
      setViewport,
      getViewport,
      getViewports,
      pushViewport,
      popViewport,
      clearDirtyRegions: Effect.sync(() => {
        dirtyRegions = []
      }),
      markDirty: region =>
        Effect.sync(() => {
          dirtyRegions.push({ ...region })
        }),
      getDirtyRegions: Effect.sync(() => dirtyRegions.slice() as any),
      optimizeDirtyRegions: Effect.sync(() => {
        dirtyRegions = mergeDirtyRegions(dirtyRegions)
      }),
      getStats,
      resetStats: Ref.update(state, s => ({
        ...s,
        stats: {
          framesRendered: 0,
          averageFrameTime: 0,
          lastFrameTime: 0,
          dirtyRegionCount: 0,
          bufferSwitches: 0,
          forcedRedraws: 0,
        },
      })),
      setProfilingEnabled: enabled =>
        Effect.sync(() => {
          profilingEnabled = enabled
          if (!enabled) frameTimeHistory.length = 0
        }),
      renderAt: (view, x, y) =>
        Effect.gen(function* (_) {
          const size = yield* _(terminal.getSize)
          const width = size.width && size.width > 0 ? size.width : 80
          const height = size.height && size.height > 0 ? size.height : 24
          const mainLayer = yield* _(ensureLayer('main', 0, width, height))
          const rendered = yield* _(view.render())
          const content =
            typeof rendered === 'string'
              ? rendered
              : String((rendered as { content?: string }).content ?? '')

          let lines = content.split('\n')
          if (clipRegion) {
            // Keep only the portion of the paint that intersects the clip rect.
            // Slicing is visual-cell aware so SGR prefixes are never cut
            // mid-escape and re-emitted intact for the surviving columns.
            lines = lines.map((line, index) => {
              const lineY = y + index
              if (lineY < clipRegion!.y || lineY >= clipRegion!.y + clipRegion!.height) return ''
              const start = Math.max(0, clipRegion!.x - x)
              const end = Math.min(visualWidth(line), clipRegion!.x + clipRegion!.width - x)
              return start >= end ? '' : clipLineVisual(line, start, end)
            })
          }
          mainLayer.buffer.writeText(x, y, lines.join('\n'))
        }).pipe(Effect.catchAll(cause => Effect.fail(new RenderError({ phase: 'paint', cause })))),
      renderBatch: views =>
        Effect.gen(function* (_) {
          const size = yield* _(terminal.getSize)
          const width = size.width && size.width > 0 ? size.width : 80
          const height = size.height && size.height > 0 ? size.height : 24
          const mainLayer = yield* _(ensureLayer('main', 0, width, height))
          mainLayer.buffer.clear()
          // A batch is one frame, not N destructive frames — paint every
          // item at its own coordinates instead of stacking at (0, 0).
          for (const { view, x, y } of views) {
            const rendered = yield* _(view.render())
            mainLayer.buffer.writeText(x, y, rendered)
          }
        }).pipe(Effect.catchAll(cause => Effect.fail(new RenderError({ phase: 'paint', cause })))),
      setClipRegion: region =>
        Effect.sync(() => {
          clipRegion = region ? { ...region } : null
        }),
      // The interface models save/restore as plain effects (a one-deep
      // state stack).
      saveState: saveStateVoid,
      restoreState: restoreStateVoid,
      measureText,
      wrapText: (text: string, width?: number) =>
        Effect.succeed(
          width && width > 0
            ? text.split('\n').flatMap(line => wrapStyledLine(line, width))
            : text.split('\n')
        ),
      truncateText: (text: string, maxWidth: number) => Effect.succeed(truncate(text, maxWidth)),
      createLayer: (name, zIndex) =>
        Effect.gen(function* (_) {
          const size = yield* _(terminal.getSize)
          const width = size.width && size.width > 0 ? size.width : 80
          const height = size.height && size.height > 0 ? size.height : 24
          const id = nextLayerId++
          yield* _(
            Ref.update(state, s => ({
              ...s,
              layers: [
                ...s.layers,
                {
                  id,
                  name,
                  zIndex,
                  visible: true,
                  buffer: new Buffer(width, height),
                  viewport: { x: 0, y: 0, width, height },
                },
              ],
            }))
          )
        }).pipe(Effect.asVoid),
      removeLayer: name =>
        Effect.sync(() => {
          if (name === 'main') return
        }).pipe(
          Effect.zipRight(
            Ref.update(state, s => ({
              ...s,
              layers: name === 'main' ? s.layers : s.layers.filter(l => l.name !== name),
            }))
          ),
          Effect.asVoid
        ),
      renderToLayer: (name: string, view: View, x = 0, y = 0) =>
        Effect.gen(function* (_) {
          const s = yield* _(Ref.get(state))
          const layer = s.layers.find(l => l.name === name)
          if (layer) {
            const rendered = yield* _(view.render())
            layer.buffer.writeText(x, y, rendered)
          }
        }).pipe(Effect.catchAll(cause => Effect.fail(new RenderError({ phase: 'paint', cause })))),
      setLayerVisible: (name, visible) =>
        Ref.update(state, s => ({
          ...s,
          layers: s.layers.map(l => (l.name === name ? { ...l, visible } : l)),
        })).pipe(Effect.asVoid),
      compositeLayers,
      getLayers,
      getOverlayBounds: Ref.get(overlayBounds),
    } as any)
  })
)
