/**
 * @since 1.0.0
 */
import { Effect, Layer, Option, Ref, pipe } from 'effect'

import type { StyleProps as AnsiStyle } from '@tuix/ansi'
import { visualWidth, parseVisualCells, rgb } from '@tuix/ansi'
import { RendererService } from '../renderer'
import { TerminalService } from '../terminal'
import type { View } from '../../../types/core'
import { collectOverlays } from '../../types/overlay'
import { RenderError } from '../../types/errors'
import type { Viewport } from '../../../types/schemas'
import { toAnsiStyleCode } from '@tuix/ansi'

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
      for (let lx = 0; lx < cells.length; lx++) {
        const col = x + lx
        if (col < 0 || col >= this.width) continue
        const cell = cells[lx]!
        const style =
          cell.fg || cell.bg
            ? Option.some({
                ...(cell.fg ? { foreground: rgb(cell.fg.r, cell.fg.g, cell.fg.b) } : {}),
                ...(cell.bg ? { background: rgb(cell.bg.r, cell.bg.g, cell.bg.b) } : {}),
              })
            : Option.none<AnsiStyle>()
        this.cells[row]![col] = {
          char: cell.char || ' ',
          style,
          painted: true,
        }
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
          this.cells[ty]![tx] = { ...cell }
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

    const measureText = (
      text: string
    ): Effect.Effect<{ width: number; height: number; lineCount: number }, never, never> =>
      Effect.succeed({
        width: visualWidth(text),
        height: 1, // Assuming single line for basic measurement
        lineCount: 1,
      })

    const beginFrame = Effect.gen(function* (_) {
      const size = yield* _(terminal.getSize)
      const width = size.width ?? 80
      const height = size.height ?? 24
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
      const front = yield* _(Ref.get(frontBuffer))
      const back = yield* _(Ref.get(backBuffer))

      // Composite layers into back buffer
      yield* _(compositeLayers)

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
        const width = size.width ?? 80
        const height = size.height ?? 24
        const mainLayer = yield* _(ensureLayer('main', 0, width, height))
        mainLayer.buffer.clear()
        yield* _(paintViewToLayer(mainLayer, view, 0, 0))

        const overlays = collectOverlays(view)
        const overlayLayer = yield* _(ensureLayer('overlay', 1, width, height))
        overlayLayer.buffer.clear()
        overlayLayer.visible = overlays.length > 0
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

        for (const patch of patches) {
          // CUP is 1-based; the cell buffer is 0-based.
          yield* _(terminal.moveCursor(patch.x + 1, patch.y + 1))

          let line = ''
          for (const cell of patch.cells) {
            if (!stylesEqual(cell.style, currentStyle)) {
              if (line.length > 0) {
                yield* _(terminal.write(line))
                line = ''
              }
              const styleCode = pipe(
                cell.style,
                Option.map(s => toAnsiStyleCode(s, caps.colorProfile)),
                Option.getOrElse(() => toAnsiStyleCode({}, caps.colorProfile))
              )
              yield* _(terminal.write(styleCode))
              currentStyle = cell.style
            }
            line += cell.char
          }

          if (line.length > 0) {
            yield* _(terminal.write(line))
          }
        }
        yield* _(terminal.write('\x1b[0m'))
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
      clearDirtyRegions: noop,
      markDirty: () => noop,
      getDirtyRegions: emptyDirty as any,
      optimizeDirtyRegions: noop,
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
      setProfilingEnabled: () => noop,
      renderAt: (view, _x, _y) => render(view),
      renderBatch: views =>
        Effect.gen(function* (_) {
          for (const v of views) yield* _(render(v))
        }),
      setClipRegion: () => noop,
      saveState: saveState as any,
      restoreState: restoreState as any,
      measureText,
      wrapText: (t: string) => Effect.succeed(t.split('\n')),
      truncateText: (t: string, max: number) =>
        Effect.succeed(t.length <= max ? t : t.slice(0, Math.max(0, max - 1)) + '…'),
      createLayer: (name, zIndex) =>
        Effect.gen(function* (_) {
          const size = yield* _(terminal.getSize)
          const width = size.width ?? 80
          const height = size.height ?? 24
          yield* _(
            Ref.update(state, s => ({
              ...s,
              layers: [
                ...s.layers,
                {
                  id: s.layers.length,
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
        Ref.update(state, s => ({
          ...s,
          layers: s.layers.filter(l => l.name !== name),
        })).pipe(Effect.asVoid),
      renderToLayer: (view, name) =>
        Effect.gen(function* (_) {
          const s = yield* _(Ref.get(state))
          const layer = s.layers.find(l => l.name === name)
          if (layer) {
            const rendered = yield* _(view.render())
            layer.buffer.writeText(0, 0, rendered as any)
          }
        }).pipe(Effect.catchAll(cause => Effect.fail(new RenderError({ phase: 'paint', cause })))),
      setLayerVisible: (name, visible) =>
        Ref.update(state, s => ({
          ...s,
          layers: s.layers.map(l => (l.name === name ? { ...l, visible } : l)),
        })).pipe(Effect.asVoid),
      compositeLayers,
      getLayers,
    } as any)
  })
)
