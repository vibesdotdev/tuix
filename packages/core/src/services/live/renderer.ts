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
/** Packed form of PAINT_BG (0 when unset) for allocation-free compare in paint. */
const PAINT_BG_PACKED = PAINT_BG ? packColor(PAINT_BG as AnsiStyle['foreground']) : 0

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
  const obj = c as {
    type?: string
    r?: number
    g?: number
    b?: number
    code?: number
    value?: string
  }
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

/**
 * Unpack a 32-bit packed color back to a Color object.
 * Inverse of packColor(). Returns undefined for packed value 0 (no color).
 */
function unpackColor(packed: number): AnsiStyle['foreground'] | undefined {
  if (packed === 0) return undefined
  const type = (packed >>> 24) & 0x7
  switch (type) {
    case 1: // rgb
      return rgb((packed >>> 16) & 0xff, (packed >>> 8) & 0xff, packed & 0xff)
    case 2: // ansi (16-color)
      return { type: 'ansi', code: packed & 0xff } as unknown as AnsiStyle['foreground']
    case 3: // ansi256
      return { type: 'ansi256', code: packed & 0xff } as unknown as AnsiStyle['foreground']
    case 4: // hex (stored as rgb values)
      return rgb((packed >>> 16) & 0xff, (packed >>> 8) & 0xff, packed & 0xff)
    default:
      return undefined
  }
}

/**
 * Unpack a decoration bitmask back to style props.
 * Inverse of packDecorations().
 */
function unpackDecorations(dec: number): Partial<AnsiStyle> {
  if (dec === 0) return {}
  const result: Partial<AnsiStyle> = {}
  if (dec & 1) result.bold = true
  if (dec & 2) result.faint = true
  if (dec & 4) result.italic = true
  if (dec & 8) result.underline = true
  if (dec & 16) result.blink = true
  if (dec & 32) result.reverse = true
  if (dec & 64) result.strikethrough = true
  return result
}

/**
 * Rebuild an Option<AnsiStyle> from packed fg/bg/dec words. Used only at
 * style-transition boundaries in the paint loop (not per cell), so allocation
 * is O(style changes) rather than O(cells).
 */
function reconstructStyle(fg: number, bg: number, dec: number): Option.Option<AnsiStyle> {
  if (!fg && !bg && !dec) return Option.none()
  return Option.some({
    ...(fg ? { foreground: unpackColor(fg) } : {}),
    ...(bg ? { background: unpackColor(bg) as AnsiStyle['background'] } : {}),
    ...unpackDecorations(dec),
  })
}

/** Packed equivalent of stylesEqual — pure numeric compare, no allocation. */
function packedStylesEqual(
  fg1: number,
  bg1: number,
  dec1: number,
  fg2: number,
  bg2: number,
  dec2: number
): boolean {
  return fg1 === fg2 && bg1 === bg2 && dec1 === dec2
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
  if (removedDecs & 1) codes.push('22') // bold off (SGR 22)
  if (removedDecs & 2) codes.push('22') // faint off (SGR 22 — same as bold off)
  if (removedDecs & 4) codes.push('23') // italic off (SGR 23)
  if (removedDecs & 8) codes.push('24') // underline off (SGR 24)
  if (removedDecs & 16) codes.push('25') // blink off (SGR 25)
  if (removedDecs & 32) codes.push('27') // reverse off (SGR 27)
  if (removedDecs & 64) codes.push('29') // strikethrough off (SGR 29)

  // Handle decoration additions.
  const addedDecs = targetDec & ~sourceDec
  if (addedDecs & 1) codes.push('1') // bold
  if (addedDecs & 2) codes.push('2') // faint
  if (addedDecs & 4) codes.push('3') // italic
  if (addedDecs & 8) codes.push('4') // underline
  if (addedDecs & 16) codes.push('5') // blink
  if (addedDecs & 32) codes.push('7') // reverse
  if (addedDecs & 64) codes.push('9') // strikethrough

  // Handle color changes incrementally.
  if (fgChanged) {
    if (!target.foreground) {
      codes.push('39') // default fg
    } else {
      const c = target.foreground as {
        type?: string
        r?: number
        g?: number
        b?: number
        code?: number
      }
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
      const c = target.background as {
        type?: string
        r?: number
        g?: number
        b?: number
        code?: number
      }
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
  /** The x-coordinate (column) where the run starts. */
  readonly x: number
  /** The y-coordinate (row) of the run. */
  readonly y: number
  /**
   * Number of cells in the run, read directly from the back buffer during
   * patch emission. No per-cell Cell objects are allocated on the diff path.
   */
  readonly length: number
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

/**
 * Typed-array backed cell grid. Each cell is a fixed 16-byte record inside a
 * flat Uint32Array (4 words: charIndex, fgPacked, bgPacked, flags|decorations).
 * Eliminates per-cell heap objects entirely — zero GC pressure per frame.
 *
 * Word layout:
 *   [0] charIndex — index into stringPool (0 = ' ')
 *   [1] fgPacked  — packColor() result (0 = none)
 *   [2] bgPacked  — packColor() result (0 = none)
 *   [3] flags|dec — low 8 bits = flags, high 8 bits = packDecorations()
 *
 * Flags (bits 0-2): painted=1, scrim=2, wide=4
 */
class ScreenBuffer {
  readonly width: number
  readonly height: number
  /** Flat typed-array of packed cells: 4 words × width × height. */
  private data: Uint32Array
  /** Dirty-row bitmap: true means this row was written during the current frame. */
  private dirtyRows: Uint8Array

  /** Deduplicated grapheme pool: charIndex → string. Index 0 is always ' '. */
  private stringPool: string[]
  private stringMap: Map<string, number>

  constructor(width: number, height: number) {
    this.width = Math.max(0, width | 0)
    this.height = Math.max(0, height | 0)
    this.data = new Uint32Array(this.width * this.height * 4)
    this.dirtyRows = new Uint8Array(this.height)
    this.stringPool = [' ']
    this.stringMap = new Map([[' ', 0]])
  }

  /** Linear cell index for (x, y). */
  private indexOf(x: number, y: number): number {
    return (y * this.width + x) * 4
  }

  /** Intern a grapheme, returning its charIndex (deduping into the pool). */
  private intern(char: string): number {
    const existing = this.stringMap.get(char)
    if (existing !== undefined) return existing
    const index = this.stringPool.length
    this.stringPool.push(char)
    this.stringMap.set(char, index)
    return index
  }

  /** Reconstruct a Cell object from the packed buffer (diff output path only). */
  private cellAt(x: number, y: number): Cell {
    const i = this.indexOf(x, y)
    const ci = this.data[i]!
    const fg = this.data[i + 1]!
    const bg = this.data[i + 2]!
    const flags = this.data[i + 3]! & 0xff
    const dec = (this.data[i + 3]! >>> 8) & 0xff
    const style =
      fg || bg || dec
        ? Option.some({
            ...(fg ? { foreground: unpackColor(fg) } : {}),
            ...(bg ? { background: unpackColor(bg) as AnsiStyle['background'] } : {}),
            ...unpackDecorations(dec),
          })
        : Option.none<AnsiStyle>()
    return {
      char: ci === 0 ? ' ' : (this.stringPool[ci] ?? ' '),
      style,
      painted: (flags & 1) === 1,
      scrim: (flags & 2) === 2,
      wide: (flags & 4) === 4,
    }
  }

  /** Compare two cells (this at (ax,ay), other at (bx,by)) via packed words. */
  private packedEqual(
    other: ScreenBuffer,
    ax: number,
    ay: number,
    bx: number,
    by: number
  ): boolean {
    const a = this.indexOf(ax, ay)
    const b = other.indexOf(bx, by)
    return (
      this.data[a] === other.data[b] &&
      this.data[a + 1] === other.data[b + 1] &&
      this.data[a + 2] === other.data[b + 2] &&
      this.data[a + 3] === other.data[b + 3]
    )
  }

  /** Grapheme string at (x, y), resolved from the pool (no allocation). */
  charAt(x: number, y: number): string {
    const ci = this.data[this.indexOf(x, y)]!
    return ci === 0 ? ' ' : (this.stringPool[ci] ?? ' ')
  }

  /** Reader for the diff/apply hot path — packed words, no object allocation. */
  fgAt(x: number, y: number): number {
    return this.data[this.indexOf(x, y) + 1]!
  }
  bgAt(x: number, y: number): number {
    return this.data[this.indexOf(x, y) + 2]!
  }
  decAt(x: number, y: number): number {
    return (this.data[this.indexOf(x, y) + 3]! >>> 8) & 0xff
  }
  /** True when the cell is the trailing half of a wide grapheme (skip+wide). */
  isWideAt(x: number, y: number): boolean {
    return (this.data[this.indexOf(x, y) + 3]! & 0xff & 0x4) === 0x4
  }

  clear(): void {
    // Zeroing the typed array resets every cell to charIndex 0 (' '), fg/bg/dec
    // = 0 (no style), flags = 0 (unpainted). One O(n) fill — no per-cell heap.
    this.data.fill(0)
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
        const i = this.indexOf(x, y)
        // charIndex=0 (' '), fg/bg=0, flags=painted|scrim
        this.data[i + 3] = 1 | 2
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
      for (let x = 0; x < this.width; x++) {
        const i = this.indexOf(x, y)
        const flags = this.data[i + 3]! & 0xff
        const ci = this.data[i]!
        if ((flags & 1) === 1 && ci !== 0) {
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
        const fgPacked = packColor(cell.fg ? rgb(cell.fg.r, cell.fg.g, cell.fg.b) : undefined)
        const bgPacked = packColor(cell.bg ? rgb(cell.bg.r, cell.bg.g, cell.bg.b) : undefined)
        const decPacked = packDecorations({
          bold: !!dec?.bold,
          faint: !!dec?.faint,
          italic: !!dec?.italic,
          underline: !!dec?.underline,
          blink: !!dec?.blink,
          reverse: !!dec?.reverse,
          strikethrough: !!dec?.strikethrough,
        })
        const char = cell.char || ' '
        const charWidth = graphemeWidth(char)
        const ci = this.intern(char)
        // Primary cell: charIndex, fg, bg, flags=painted.
        this.setPacked(col, row, ci, fgPacked, bgPacked, 1 | (decPacked << 8))
        // Mark trailing cells of wide characters as skip markers.
        for (let w = 1; w < charWidth && col + w < this.width; w++) {
          this.setPacked(col + w, row, 0, fgPacked, bgPacked, 1 | 4 | (decPacked << 8))
        }
        rowTouched = true
        col += charWidth
      }
      if (rowTouched) this.dirtyRows[row] = 1
    }
  }

  /** Write a packed cell at (x, y). */
  private setPacked(
    x: number,
    y: number,
    ci: number,
    fg: number,
    bg: number,
    flagsDec: number
  ): void {
    const i = this.indexOf(x, y)
    this.data[i] = ci
    this.data[i + 1] = fg
    this.data[i + 2] = bg
    this.data[i + 3] = flagsDec
  }

  composite(other: ScreenBuffer, ox: number, oy: number, transparent = false): void {
    for (let y = 0; y < other.height; y++) {
      const ty = oy + y
      if (ty < 0 || ty >= this.height) continue
      let rowTouched = false
      for (let x = 0; x < other.width; x++) {
        const tx = ox + x
        if (tx < 0 || tx >= this.width) continue
        const oi = other.indexOf(x, y)
        const origFlags = other.data[oi + 3]! & 0xff
        if (!transparent || (origFlags & 1) === 1) {
          if ((origFlags & 2) === 2) {
            // Scrim: blend whatever is beneath toward the dim floor.
            const dimmed = dimCell(this.cellAt(tx, ty))
            this.setPackedCell(tx, ty, dimmed)
          } else {
            // Copy packed cell directly — no object allocation. Intern the
            // charIndex into THIS buffer's pool so lookups resolve correctly.
            const ti = this.indexOf(tx, ty)
            const ci = other.data[oi]!
            this.data[ti] = ci === 0 ? 0 : this.intern(other.stringPool[ci] ?? ' ')
            this.data[ti + 1] = other.data[oi + 1]!
            this.data[ti + 2] = other.data[oi + 2]!
            this.data[ti + 3] = other.data[oi + 3]!
          }
          rowTouched = true
        }
      }
      if (rowTouched) this.dirtyRows[ty] = 1
    }
  }

  /** Write a Cell object into the packed buffer (used by the scrim path). */
  private setPackedCell(x: number, y: number, cell: Cell): void {
    const i = this.indexOf(x, y)
    this.data[i] = cell.char === ' ' ? 0 : this.intern(cell.char)
    let fg = 0
    let bg = 0
    let dec = 0
    if (Option.isSome(cell.style)) {
      fg = packColor(cell.style.value.foreground)
      bg = packColor(cell.style.value.background)
      dec = packDecorations(cell.style.value)
    }
    this.data[i + 1] = fg
    this.data[i + 2] = bg
    let flags = cell.painted ? 1 : 0
    if (cell.scrim) flags |= 2
    if (cell.wide) flags |= 4
    this.data[i + 3] = flags | (dec << 8)
  }

  /**
   * Diff this buffer (front/previous) against `other` (back/current).
   * Uses the dirty-row bitmap on `other` to skip rows that were never
   * written — O(dirty_rows × width) instead of O(height × width).
   *
   * `range` optionally restricts the scan to rows [start, end) and forces
   * them to be considered regardless of the dirty bitmap. Used by the scroll
   * optimization: after a DECSTBM scroll escape only the boundary rows that
   * hold brand-new content need painting, and those rows may not be marked
   * dirty if their packed content coincides with the previous frame.
   */
  diff(other: ScreenBuffer, range?: { start: number; end: number }): DiffPatch[] {
    const patches: DiffPatch[] = []
    const h = Math.min(this.height, other.height)
    const w = Math.min(this.width, other.width)
    const rowStart = range ? Math.max(0, range.start) : 0
    const rowEnd = range ? Math.min(h, range.end) : h
    for (let y = rowStart; y < rowEnd; y++) {
      // Force-diff rows inside an explicit range (the scroll boundary rows);
      // otherwise skip rows that were never touched in the back buffer.
      // Soundness: dirty tracking may over-report (a cleared row is dirty
      // even if its content matches the front buffer) but never under-reports.
      if (!range && !other.isRowDirty(y)) continue

      // Runs are recorded as column ranges into the back buffer — no Cell
      // objects are allocated on this path.
      let runStart = -1 // x of first cell in the current run (-1 = none)
      let runEnd = -1 // exclusive end x of the current run
      let x = 0
      while (x < w) {
        // Packed comparison of whole cells — no object allocation.
        if (!this.packedEqual(other, x, y, x, y)) {
          // Changed cell at x → (re)start/extend the run through its span.
          if (runStart < 0) runStart = x
          // Wide graphemes (especially emoji with VS16) leave residue in the
          // trailing columns the old glyph occupied: some terminals do not
          // clear them when a narrower glyph replaces a wide one. Extend the
          // patch across the wider span so those columns are repainted
          // explicitly even when the new cells match the previous buffer.
          const span = Math.max(graphemeWidth(this.charAt(x, y)), graphemeWidth(other.charAt(x, y)))
          const newEnd = Math.min(x + span, w)
          if (newEnd > runEnd) runEnd = newEnd
          x = newEnd
        } else if (runStart >= 0) {
          // In a run and hit an unchanged cell. Gap coalescing: if the next
          // changed cell is close, bridge it (re-emitting 1-4 unchanged cells
          // is cheaper than a CUP move).
          let gapEnd = x + 1
          const GAP_THRESHOLD = 4
          while (
            gapEnd < w &&
            gapEnd - x <= GAP_THRESHOLD &&
            this.packedEqual(other, gapEnd, y, gapEnd, y)
          ) {
            gapEnd++
          }
          if (gapEnd < w && gapEnd - x <= GAP_THRESHOLD) {
            // Next change is within threshold — bridge the gap (the changed
            // cell at gapEnd is processed by the next loop iteration).
            const end = gapEnd + 1
            if (end > runEnd) runEnd = end
            x = gapEnd
          } else {
            // No nearby change — flush the run.
            patches.push({ x: runStart, y, length: runEnd - runStart })
            runStart = -1
            runEnd = -1
            x++
          }
        } else {
          x++
        }
      }
      if (runStart >= 0) {
        patches.push({ x: runStart, y, length: runEnd - runStart })
      }
    }
    return patches
  }

  /**
   * Detect if the buffer change is a pure vertical scroll (content shifted
   * up or down by N rows). Returns the scroll delta if detected, null
   * otherwise, with physically-correct sign relative to the terminal:
   *   +delta → content shifted UP by delta (new content at the bottom, emit
   *            CSI S, repaint rows [height-delta, height));
   *   -delta → content shifted DOWN by delta (new content at the top, emit
   *            CSI T, repaint rows [0, delta)).
   * A content-up shift means back[y] matches front[y+delta] for y in
   * [0, height-delta); a content-down shift means back[y] matches
   * front[y-delta] for y in [delta, height).
   */
  detectScroll(other: ScreenBuffer): number | null {
    if (this.width !== other.width || this.height !== other.height) return null
    // Don't attempt scroll detection on trivial (mostly empty) buffers —
    // all-space rows trivially match any shifted position.
    let paintedCells = 0
    for (let y = 0; y < this.height && paintedCells < 10; y++) {
      for (let x = 0; x < this.width && paintedCells < 10; x++) {
        if (this.data[this.indexOf(x, y)] !== 0) paintedCells++
      }
    }
    if (paintedCells < 10) return null

    // Try small scroll amounts (1-5 rows — larger scrolls are rare per frame)
    for (let delta = 1; delta <= Math.min(5, Math.floor(this.height / 2)); delta++) {
      // Content shifted UP: new rows [0..height-delta) match old rows [delta..),
      // i.e. back[y] === front[y+delta].
      let shiftUp = true
      for (let y = 0; y < this.height - delta && shiftUp; y++) {
        for (let x = 0; x < this.width; x++) {
          if (!this.packedEqual(other, x, y + delta, x, y)) {
            shiftUp = false
            break
          }
        }
      }
      if (shiftUp) return delta

      // Content shifted DOWN: new rows [delta..] match old rows [0..height-delta),
      // i.e. back[y] === front[y-delta].
      let shiftDown = true
      for (let y = delta; y < this.height && shiftDown; y++) {
        for (let x = 0; x < this.width; x++) {
          if (!this.packedEqual(other, x, y - delta, x, y)) {
            shiftDown = false
            break
          }
        }
      }
      if (shiftDown) return -delta
    }

    return null
  }

  toString(): string {
    const out: string[] = []
    for (let y = 0; y < this.height; y++) {
      let row = ''
      for (let x = 0; x < this.width; x++) {
        const ci = this.data[this.indexOf(x, y)]!
        row += ci === 0 ? ' ' : (this.stringPool[ci] ?? ' ')
      }
      out.push(row)
    }
    return out.join('\n')
  }
}

// Type alias used throughout this file
type Buffer = ScreenBuffer
const Buffer = ScreenBuffer

export { ScreenBuffer }

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
        yield* _(
          Ref.update(state, s => ({
            ...s,
            stats: {
              ...s.stats,
              framesRendered: s.stats.framesRendered + 1,
              lastFrameTime: frameElapsed,
              dirtyRowSkipRate: 100,
            },
          }))
        )
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
      let scrollRange: { start: number; end: number } | undefined
      if (scrollDelta !== null) {
        const absScroll = Math.abs(scrollDelta)
        let scrollFrame = SYNC_UPDATE_BEGIN
        // Set scroll region to full screen
        scrollFrame += `\x1b[1;${back.height}r`
        if (scrollDelta > 0) {
          // Scroll up: content moves up, new content at bottom
          scrollFrame += `\x1b[${absScroll}S` // Scroll Up N lines
          // Only the bottom `absScroll` rows hold brand-new content.
          scrollRange = { start: back.height - absScroll, end: back.height }
        } else {
          // Scroll down: content moves down, new content at top
          scrollFrame += `\x1b[${absScroll}T` // Scroll Down N lines
          // Only the top `absScroll` rows hold brand-new content.
          scrollRange = { start: 0, end: absScroll }
        }
        // Reset scroll region
        scrollFrame += `\x1b[r`
        scrollFrame += SYNC_UPDATE_END
        yield* _(terminal.write(scrollFrame))

        // The shifted rows are already correct on the terminal after the
        // scroll escape; only the boundary rows need painting. Diff those
        // rows in isolation (force-included regardless of the dirty bitmap),
        // so the scroll optimization actually avoids repainting the
        // `height - delta` relocated rows.
      }

      // Diff front and back buffers (dirty-row bitmap accelerated).
      const diff = front.diff(back, scrollRange)

      // Track dirty-row skip rate for diagnostics.
      let totalRows = back.height
      let dirtyRowCount = 0
      for (let y = 0; y < back.height; y++) {
        if (back.isRowDirty(y)) dirtyRowCount++
      }
      const skipRate = totalRows > 0 ? ((totalRows - dirtyRowCount) / totalRows) * 100 : 0

      if (diff.length > 0) {
        yield* _(applyPatches(diff, back))
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
      patches: ReadonlyArray<DiffPatch>,
      back: ScreenBuffer
    ): Effect.Effect<void, RenderError, never> =>
      Effect.gen(function* (_) {
        let currentFg = 0
        let currentBg = 0
        let currentDec = 0
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
          for (let i = 0; i < patch.length; i++) {
            const cx = patch.x + i
            // Skip trailing half of wide characters (terminal handles them).
            if (back.isWideAt(cx, patch.y)) continue
            // Read packed style directly from the back buffer — no Option, no
            // per-cell object. Apply the opaque PAINT_BG override to unstyled
            // cells in packed form.
            let fg = back.fgAt(cx, patch.y)
            let bg = back.bgAt(cx, patch.y)
            const dec = back.decAt(cx, patch.y)
            if (PAINT_BG_PACKED && !fg && !bg && !dec) bg = PAINT_BG_PACKED
            if (!packedStylesEqual(fg, bg, dec, currentFg, currentBg, currentDec)) {
              if (line.length > 0) {
                frame += line
                line = ''
              }
              // Incremental SGR: compute minimal transition between styles.
              // Options are rebuilt only at transition boundaries.
              const from = reconstructStyle(currentFg, currentBg, currentDec)
              const to = reconstructStyle(fg, bg, dec)
              frame += computeStyleTransition(from, to, colorProfile)
              currentFg = fg
              currentBg = bg
              currentDec = dec
            }
            const ch = back.charAt(cx, patch.y)
            line += ch
            cellsWritten += graphemeWidth(ch)
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
