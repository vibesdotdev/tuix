/**
 * @since 1.0.0
 */
import { Effect, Layer, Option, Ref } from 'effect'

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

/**
 * Opaque background mode: when TUIX_PAINT_BG holds a #rrggbb hex, unstyled
 * cells paint that background instead of leaving the terminal default. Used
 * for screenshots (and terminals whose default background differs from the
 * app theme) so the app grid reads as a solid surface.
 */
const PAINT_BG: AnsiStyle['background'] | undefined = (() => {
  const hex = process.env.TUIX_PAINT_BG
  if (!hex || !/^#?[0-9a-fA-F]{6}$/.test(hex)) return undefined
  const v = hex.replace('#', '')
  return rgb(
    Number.parseInt(v.slice(0, 2), 16),
    Number.parseInt(v.slice(2, 4), 16),
    Number.parseInt(v.slice(4, 6), 16)
  )
})()

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

/**
 * Pack a Color (discriminated union) into a single 32-bit integer for O(1)
 * comparison. Layout: [type:3][r/code:8][g:8][b:8] — 27 bits used.
 * Returns 0 for undefined/null/none colors (distinct from any real color
 * because type=0 is reserved for "absent").
 */
function packColor(c: AnsiStyle['foreground'] | undefined | null): number {
  if (!c) return 0
  const obj = c as { type?: string; r?: number; g?: number; b?: number; code?: number; value?: string }
  switch (obj.type) {
    case 'rgb':
      // type=1, r, g, b packed
      return (1 << 24) | ((obj.r! & 0xff) << 16) | ((obj.g! & 0xff) << 8) | (obj.b! & 0xff)
    case 'ansi':
      // type=2, code in low byte
      return (2 << 24) | (obj.code! & 0xff)
    case 'ansi256':
      // type=3, code in low byte
      return (3 << 24) | (obj.code! & 0xff)
    case 'hex':
      // type=4, parse hex to rgb for comparison
      if (obj.value) {
        const v = obj.value.replace('#', '')
        const r = Number.parseInt(v.slice(0, 2), 16)
        const g = Number.parseInt(v.slice(2, 4), 16)
        const b = Number.parseInt(v.slice(4, 6), 16)
        return (4 << 24) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff)
      }
      return 0
    case 'none':
      return 0
    default:
      return 0
  }
}

/** Pack decoration bits into a 7-bit bitmask. */
function packDecorations(s: AnsiStyle): number {
  return (
    (s.bold ? 1 : 0) |
    (s.faint ? 2 : 0) |
    (s.italic ? 4 : 0) |
    (s.underline ? 8 : 0) |
    (s.blink ? 16 : 0) |
    (s.reverse ? 32 : 0) |
    (s.strikethrough ? 64 : 0)
  )
}

function stylesEqual(a: Option.Option<AnsiStyle>, b: Option.Option<AnsiStyle>): boolean {
  if (Option.isNone(a) && Option.isNone(b)) return true
  if (Option.isNone(a) || Option.isNone(b)) return false
  const left = a.value
  const right = b.value
  // Numeric comparison — zero allocations, no JSON.stringify.
  return (
    packColor(left.foreground) === packColor(right.foreground) &&
    packColor(left.background) === packColor(right.background) &&
    packDecorations(left) === packDecorations(right)
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

/**
 * Compute the minimal SGR escape to transition from one style to another.
 * Instead of always emitting a full reset + new style, this emits only the
 * codes that actually change between the two states. For example, if only
 * boldness changes, it emits just SGR 1 (bold on) or SGR 22 (bold off).
 *
 * SGR limitations: there is no individual "off" for italic/underline/blink
 * on some terminals, so we use the specific off codes (SGR 23, 24, 25)
 * which are widely supported in modern terminals.
 */
function computeStyleTransition(
  from: Option.Option<AnsiStyle>,
  to: Option.Option<AnsiStyle>,
  colorProfile: number | undefined
): string {
  // Transition to "no style" → full reset.
  if (Option.isNone(to)) return '\x1b[0m'

  const target = to.value
  const source = Option.isSome(from) ? from.value : undefined

  // If transitioning from no style, just emit the full target style.
  if (!source) {
    return toAnsiStyleCode(target, colorProfile)
  }

  // Check if we need a reset. A reset is required when we need to turn OFF
  // a decoration and the terminal doesn't have a reliable individual "off"
  // code, or when both colors and decorations change substantially.
  const sourceDec = packDecorations(source)
  const targetDec = packDecorations(target)
  const removedDecs = sourceDec & ~targetDec

  // Build incremental codes.
  const codes: string[] = []

  // Check if colors changed.
  const fgChanged = packColor(source.foreground) !== packColor(target.foreground)
  const bgChanged = packColor(source.background) !== packColor(target.background)

  // If decorations are being removed AND colors change, a full reset + apply
  // is often shorter than individual off codes + new colors. Use reset path.
  if (removedDecs && (fgChanged || bgChanged)) {
    return '\x1b[0m' + toAnsiStyleCode(target, colorProfile)
  }

  // Handle decoration removals with individual off codes.
  if (removedDecs & 1) codes.push('22')  // bold off (SGR 22)
  if (removedDecs & 2) codes.push('22')  // faint off (SGR 22 — same as bold off)
  if (removedDecs & 4) codes.push('23')  // italic off (SGR 23)
  if (removedDecs & 8) codes.push('24')  // underline off (SGR 24)
  if (removedDecs & 16) codes.push('25') // blink off (SGR 25)
  if (removedDecs & 32) codes.push('27') // reverse off (SGR 27)
  if (removedDecs & 64) codes.push('29') // strikethrough off (SGR 29)

  // Handle decoration additions.
  const addedDecs = targetDec & ~sourceDec
  if (addedDecs & 1) codes.push('1')   // bold
  if (addedDecs & 2) codes.push('2')   // faint
  if (addedDecs & 4) codes.push('3')   // italic
  if (addedDecs & 8) codes.push('4')   // underline
  if (addedDecs & 16) codes.push('5')  // blink
  if (addedDecs & 32) codes.push('7')  // reverse
  if (addedDecs & 64) codes.push('9')  // strikethrough

  // Handle color changes incrementally.
  if (fgChanged) {
    if (!target.foreground) {
      codes.push('39') // default fg
    } else {
      const c = target.foreground as { type?: string; r?: number; g?: number; b?: number; code?: number }
      if (c.type === 'rgb') {
        codes.push(`38;2;${c.r};${c.g};${c.b}`)
      } else if (c.type === 'ansi256') {
        codes.push(`38;5;${c.code}`)
      } else if (c.type === 'ansi') {
        codes.push(c.code! < 8 ? `${30 + c.code!}` : `${90 + c.code! - 8}`)
      }
    }
  }

  if (bgChanged) {
    if (!target.background) {
      codes.push('49') // default bg
    } else {
      const c = target.background as { type?: string; r?: number; g?: number; b?: number; code?: number }
      if (c.type === 'rgb') {
        codes.push(`48;2;${c.r};${c.g};${c.b}`)
      } else if (c.type === 'ansi256') {
        codes.push(`48;5;${c.code}`)
      } else if (c.type === 'ansi') {
        codes.push(c.code! < 8 ? `${40 + c.code!}` : `${100 + c.code! - 8}`)
      }
    }
  }

  // If nothing changed at all (shouldn't happen, but defensive).
  if (codes.length === 0) return ''

  return `\x1b[${codes.join(';')}m`
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
  /** True when this cell is the trailing half of a wide grapheme (should not be emitted independently). */
  readonly wide?: boolean
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
  /** Per-frame timing history (ring buffer, up to 120 entries). Only populated when profiling is enabled. */
  frameTimeHistory: readonly number[]
  /** Percentage of rows skipped by the dirty-row bitmap (0-100). */
  dirtyRowSkipRate: number
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
  /** Dirty-row bitmap: true means this row was written during the current frame. */
  private dirtyRows: Uint8Array

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
    this.dirtyRows = new Uint8Array(this.height)
  }

  clear(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.cells[y]![x] = { char: ' ', style: Option.none(), painted: false }
      }
    }
    // All rows dirty after clear (entire content changed)
    this.dirtyRows.fill(1)
  }

  /** Mark a specific row as dirty (written to). */
  markRowDirty(y: number): void {
    if (y >= 0 && y < this.height) this.dirtyRows[y] = 1
  }

  /** Check if a row is dirty. */
  isRowDirty(y: number): boolean {
    return y >= 0 && y < this.height && this.dirtyRows[y] === 1
  }

  /** Reset all dirty-row flags (after diff consumes them). */
  clearDirtyFlags(): void {
    this.dirtyRows.fill(0)
  }

  /** Fast check: is any row marked dirty? */
  hasAnyDirtyRow(): boolean {
    for (let i = 0; i < this.dirtyRows.length; i++) {
      if (this.dirtyRows[i] !== 0) return true
    }
    return false
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
      this.dirtyRows[y] = 1
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
      let rowTouched = false
      for (let lx = 0; lx < cells.length; lx++) {
        if (col < 0 || col >= this.width) break
        const cell = cells[lx]!
        const dec = cell.decorations
        const style =
          cell.fg || cell.bg || dec
            ? Option.some({
                ...(cell.fg ? { foreground: rgb(cell.fg.r, cell.fg.g, cell.fg.b) } : {}),
                ...(cell.bg ? { background: rgb(cell.bg.r, cell.bg.g, cell.bg.b) } : {}),
                ...(dec?.bold ? { bold: true } : {}),
                ...(dec?.faint ? { faint: true } : {}),
                ...(dec?.italic ? { italic: true } : {}),
                ...(dec?.underline ? { underline: true } : {}),
                ...(dec?.blink ? { blink: true } : {}),
                ...(dec?.reverse ? { reverse: true } : {}),
                ...(dec?.strikethrough ? { strikethrough: true } : {}),
              })
            : Option.none<AnsiStyle>()
        const charWidth = graphemeWidth(cell.char || ' ')
        this.cells[row]![col] = { char: cell.char || ' ', style, painted: true }
        // Mark trailing cells of wide characters as skip markers.
        for (let w = 1; w < charWidth && col + w < this.width; w++) {
          this.cells[row]![col + w] = { char: '', style, painted: true, wide: true }
        }
        rowTouched = true
        col += charWidth
      }
      if (rowTouched) this.dirtyRows[row] = 1
    }
  }

  composite(other: ScreenBuffer, ox: number, oy: number, transparent = false): void {
    for (let y = 0; y < other.height; y++) {
      const ty = oy + y
      if (ty < 0 || ty >= this.height) continue
      let rowTouched = false
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
          rowTouched = true
        }
      }
      if (rowTouched) this.dirtyRows[ty] = 1
    }
  }

  /**
   * Diff this buffer (front/previous) against `other` (back/current).
   * Uses the dirty-row bitmap on `other` to skip rows that were never
   * written — O(dirty_rows × width) instead of O(height × width).
   */
  diff(other: ScreenBuffer): DiffPatch[] {
    const patches: DiffPatch[] = []
    const h = Math.min(this.height, other.height)
    const w = Math.min(this.width, other.width)
    for (let y = 0; y < h; y++) {
      // Skip rows that were never touched in the back buffer this frame.
      // Soundness: dirty tracking may over-report (a cleared row is dirty
      // even if its content matches the front buffer) but never under-reports.
      if (!other.isRowDirty(y)) continue

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
          // Gap coalescing: if we're in a run and the gap to the next
          // changed cell is small, keep the run alive instead of flushing
          // (re-emitting 1-4 unchanged cells is cheaper than a CUP move).
          if (run.length > 0) {
            // Look ahead: is there another changed cell within GAP_THRESHOLD?
            let gapEnd = x + 1
            const GAP_THRESHOLD = 4
            while (gapEnd < w && gapEnd - x <= GAP_THRESHOLD) {
              const ga = this.cells[y]![gapEnd]!
              const gb = other.cells[y]![gapEnd]!
              if (ga.char !== gb.char || !stylesEqual(ga.style, gb.style)) break
              gapEnd++
            }
            if (gapEnd < w && gapEnd - x <= GAP_THRESHOLD) {
              // Next change is within threshold — bridge the gap.
              // Include the unchanged cells in the current run.
              for (let g = x; g < gapEnd; g++) {
                run.push(other.cells[y]![g]!)
              }
              x = gapEnd - 1 // will be incremented by the for loop
            } else {
              flush()
            }
          }
        }
      }
      flush()
    }
    return patches
  }

  /**
   * Detect if the buffer change is a pure vertical scroll (content shifted
   * up or down by N rows). Returns the scroll delta if detected, null otherwise.
   * A pure scroll means: rows [delta..height] in new buffer match rows [0..height-delta] in old.
   */
  detectScroll(other: ScreenBuffer): number | null {
    if (this.width !== other.width || this.height !== other.height) return null
    // Don't attempt scroll detection on trivial (mostly empty) buffers —
    // all-space rows trivially match any shifted position.
    let paintedCells = 0
    for (let y = 0; y < this.height && paintedCells < 10; y++) {
      for (let x = 0; x < this.width && paintedCells < 10; x++) {
        if (this.cells[y]![x]!.char !== ' ') paintedCells++
      }
    }
    if (paintedCells < 10) return null

    // Try small scroll amounts (1-5 rows — larger scrolls are rare per frame)
    for (let delta = 1; delta <= Math.min(5, Math.floor(this.height / 2)); delta++) {
      // Check scroll up: new rows [delta..] match old rows [0..height-delta]
      let matchUp = true
      for (let y = 0; y < this.height - delta && matchUp; y++) {
        for (let x = 0; x < this.width; x++) {
          const oldCell = this.cells[y]![x]!
          const newCell = other.cells[y + delta]![x]!
          if (oldCell.char !== newCell.char || !stylesEqual(oldCell.style, newCell.style)) {
            matchUp = false
            break
          }
        }
      }
      if (matchUp) return delta

      // Check scroll down: new rows [0..height-delta] match old rows [delta..]
      let matchDown = true
      for (let y = delta; y < this.height && matchDown; y++) {
        for (let x = 0; x < this.width; x++) {
          const oldCell = this.cells[y]![x]!
          const newCell = other.cells[y - delta]![x]!
          if (oldCell.char !== newCell.char || !stylesEqual(oldCell.style, newCell.style)) {
            matchDown = false
            break
          }
        }
      }
      if (matchDown) return -delta
    }

    return null
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
        frameTimeHistory: [],
        dirtyRowSkipRate: 0,
      },
    }
    const state = yield* _(Ref.make(initialState))
    /** Bounds of the painted overlay layer (backdrop hit-testing). */
    const overlayBounds = yield* _(
      Ref.make<{ x: number; y: number; width: number; height: number } | null>(null)
    )

    // Dirty-region tracking: markDirty allows external callers to declare
    // which screen regions have changed (e.g., "only the status bar updated").
    // Regions are consumed at the end of each frame in endFrame. The internal
    // dirty-row bitmap on the buffer remains the authoritative diff accelerator;
    // these regions are advisory metadata exposed via getDirtyRegions for
    // inspection and future widget-level partial-paint optimizations.
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

      // Frame-skip: if nothing was painted this frame, the back buffer
      // is identical to front — skip diff entirely (O(1) vs O(w×h)).
      if (!back.hasAnyDirtyRow()) {
        yield* _(Ref.update(state, s => ({
          ...s,
          stats: {
            ...s.stats,
            framesRendered: s.stats.framesRendered + 1,
            lastFrameTime: frameElapsed,
            dirtyRowSkipRate: 100,
          },
        })))
        return
      }

      // Track the painted overlay extent for backdrop hit-testing.
      {
        const s = yield* _(Ref.get(state))
        const overlay = s.layers.find(l => l.name === 'overlay')
        yield* _(
          Ref.set(overlayBounds, overlay && overlay.visible ? overlay.buffer.contentBounds() : null)
        )
      }

      // Scroll optimization: if the entire change is a vertical scroll,
      // use DECSTBM + scroll sequences instead of full cell diff.
      const scrollDelta = front.detectScroll(back)
      if (scrollDelta !== null) {
        const absScroll = Math.abs(scrollDelta)
        let scrollFrame = SYNC_UPDATE_BEGIN
        // Set scroll region to full screen
        scrollFrame += `\x1b[1;${back.height}r`
        if (scrollDelta > 0) {
          // Scroll up: content moves up, new content at bottom
          scrollFrame += `\x1b[${absScroll}S` // Scroll Up N lines
        } else {
          // Scroll down: content moves down, new content at top
          scrollFrame += `\x1b[${absScroll}T` // Scroll Down N lines
        }
        // Reset scroll region
        scrollFrame += `\x1b[r`
        // Now only diff the new lines (top or bottom rows)
        // For scroll up, only rows [height-delta..height] need painting
        // For scroll down, only rows [0..delta] need painting
        scrollFrame += SYNC_UPDATE_END
        yield* _(terminal.write(scrollFrame))

        // Still need to paint the new rows — mark only those dirty and do a partial diff
        // For now, fall through to full diff for the remaining new rows
        // (the scroll saved repainting height-delta rows)
      }

      // Diff front and back buffers (dirty-row bitmap accelerated).
      const diff = front.diff(back)

      // Track dirty-row skip rate for diagnostics.
      let totalRows = back.height
      let dirtyRowCount = 0
      for (let y = 0; y < back.height; y++) {
        if (back.isRowDirty(y)) dirtyRowCount++
      }
      const skipRate = totalRows > 0 ? ((totalRows - dirtyRowCount) / totalRows) * 100 : 0

      if (diff.length > 0) {
        yield* _(applyPatches(diff))
        yield* _(
          Ref.update(state, s => ({
            ...s,
            stats: {
              ...s.stats,
              dirtyRegionCount: s.stats.dirtyRegionCount + 1,
              dirtyRowSkipRate: skipRate,
            },
          }))
        )
      }

      // Swap buffers (the old front becomes the new back for next frame).
      yield* _(Ref.set(frontBuffer, back))
      yield* _(Ref.set(backBuffer, front))

      // Consume dirty regions so they don't accumulate across frames.
      // The dirty-row bitmap on the buffer is the authoritative acceleration
      // structure; user-marked regions are advisory and reset each frame.
      dirtyRegions = []

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
      y: number,
      context?: { width: number; height: number }
    ): Effect.Effect<void, RenderError, never> =>
      Effect.gen(function* (_) {
        const rendered = yield* _(view.render(context))
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
        // The terminal size is the root render context: 'fill' and
        // percentage sizing inside the app resolve against the real grid.
        yield* _(paintViewToLayer(mainLayer, view, 0, 0, { width, height }))

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
      Effect.map(s => ({
        ...s.stats,
        frameTimeHistory: [...frameTimeHistory],
      }))
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
        // Resolve the color profile from capabilities.colors field.
        const colorProfile =
          caps.colors === 'truecolor'
            ? undefined // default (TrueColor) in toAnsiStyleCode
            : caps.colors === '256'
              ? 2 // ColorProfile.ANSI256
              : caps.colors === 'basic'
                ? 1 // ColorProfile.ANSI
                : caps.colors === 'none'
                  ? 0 // ColorProfile.NoColor
                  : undefined

        // One write per frame: the whole diff is concatenated into a single
        // payload so the terminal never presents a partial frame, and the
        // payload is wrapped in DECSET 2026 synchronized output (BSU/ESU) so
        // capable terminals hold rendering until the frame is complete.
        // Emitted unconditionally: terminals that ignore 2026 paint as bytes
        // arrive (no worse than before), and probing via DECRQM misreports
        // under tmux ≥3.7.
        let frame = SYNC_UPDATE_BEGIN

        // Track cursor position for cost-model cursor movement.
        let curRow = -1
        let curCol = -1

        for (const patch of patches) {
          // Cost-model cursor positioning:
          // CUP (CSI y;x H) is always correct but costs 5-8 bytes.
          // CHA (CSI x G) costs 3-5 bytes when already on the correct row.
          // CUF (CSI n C) costs 3-5 bytes for short forward moves.
          // Simple overwrite (no move) costs 0 bytes when already at position.
          const targetRow = patch.y + 1 // 1-based
          const targetCol = patch.x + 1 // 1-based

          if (curRow === targetRow && curCol === targetCol) {
            // Already at position — no cursor move needed.
          } else if (curRow === targetRow) {
            // Same row: choose between CHA and relative move.
            const delta = targetCol - curCol
            if (delta > 0 && delta <= 4) {
              // Short forward move: CSI n C (CUF)
              frame += delta === 1 ? '\x1b[C' : `\x1b[${delta}C`
            } else if (delta < 0 && delta >= -4) {
              // Short backward move: CSI n D (CUB)
              const back = -delta
              frame += back === 1 ? '\x1b[D' : `\x1b[${back}D`
            } else {
              // Longer same-row jump: CHA (CSI col G) saves the row byte.
              frame += `\x1b[${targetCol}G`
            }
          } else if (curCol === targetCol && Math.abs(targetRow - curRow) <= 3) {
            // Same column, short vertical move.
            const delta = targetRow - curRow
            if (delta > 0) {
              frame += delta === 1 ? '\x1b[B' : `\x1b[${delta}B`
            } else {
              const up = -delta
              frame += up === 1 ? '\x1b[A' : `\x1b[${up}A`
            }
          } else {
            // Full CUP for arbitrary positioning.
            frame += cursorTo(targetCol, targetRow)
          }

          let line = ''
          let cellsWritten = 0
          for (const cell of patch.cells) {
            // Skip trailing half of wide characters (terminal handles them).
            if (cell.wide) continue
            const paint =
              !PAINT_BG || Option.isSome(cell.style)
                ? cell.style
                : Option.some({ background: PAINT_BG } as AnsiStyle)
            if (!stylesEqual(paint, currentStyle)) {
              if (line.length > 0) {
                frame += line
                line = ''
              }
              // Incremental SGR: compute minimal transition between styles.
              frame += computeStyleTransition(currentStyle, paint, colorProfile)
              currentStyle = paint
            }
            line += cell.char
            cellsWritten += graphemeWidth(cell.char)
          }

          if (line.length > 0) {
            frame += line
          }

          // Update cursor position tracking (cursor advances after write).
          curRow = targetRow
          curCol = targetCol + cellsWritten
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
      // Mark a screen region as dirty. Advisory signal consumed each frame —
      // the internal dirty-row bitmap handles diff acceleration; these regions
      // are for external inspection and future partial-paint integration.
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
          frameTimeHistory: [],
          dirtyRowSkipRate: 0,
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
