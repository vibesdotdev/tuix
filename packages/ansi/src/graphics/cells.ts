/**
 * Visual cells: one terminal column, with its truecolor prefix intact.
 * Layout that iterates UTF-8 code points will shred CSI. Use these instead.
 */

export interface Rgb {
  r: number
  g: number
  b: number
}

/** SGR decoration state tracked per cell (bold, italic, …). */
export interface SgrDecorations {
  bold?: true
  faint?: true
  italic?: true
  underline?: true
  blink?: true
  reverse?: true
  strikethrough?: true
}

export interface VisualCell {
  char: string
  prefix: string
  fg?: Rgb
  bg?: Rgb
  decorations?: SgrDecorations
}

const CSI = /\u001b\[[0-?]*[ -/]*[@-~]/y
const OSC = /\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)?/y
const ESC_OTHER = /\u001b./y

const ANSI16: Rgb[] = [
  { r: 0, g: 0, b: 0 },
  { r: 128, g: 0, b: 0 },
  { r: 0, g: 128, b: 0 },
  { r: 128, g: 128, b: 0 },
  { r: 0, g: 0, b: 128 },
  { r: 128, g: 0, b: 128 },
  { r: 0, g: 128, b: 128 },
  { r: 192, g: 192, b: 192 },
  { r: 128, g: 128, b: 128 },
  { r: 255, g: 0, b: 0 },
  { r: 0, g: 255, b: 0 },
  { r: 255, g: 255, b: 0 },
  { r: 0, g: 0, b: 255 },
  { r: 255, g: 0, b: 255 },
  { r: 0, g: 255, b: 255 },
  { r: 255, g: 255, b: 255 },
]

function ansi16(index: number): Rgb {
  return ANSI16[Math.max(0, Math.min(15, index))] ?? ANSI16[7]!
}

function parseSgr(
  seq: string,
  fg?: Rgb,
  bg?: Rgb,
  decorations?: SgrDecorations
): { fg?: Rgb; bg?: Rgb; decorations?: SgrDecorations; reset: boolean } {
  if (seq === '\u001b[0m' || seq === '\u001b[m') return { reset: true }
  if (!seq.startsWith('\u001b[') || !seq.endsWith('m')) {
    return { fg, bg, decorations, reset: false }
  }
  const parts = seq
    .slice(2, -1)
    .split(';')
    .map(n => Number(n))
  let i = 0
  let nextFg = fg
  let nextBg = bg
  let nextDec = decorations ? { ...decorations } : undefined
  const DEC_ON: Record<number, keyof SgrDecorations> = {
    1: 'bold',
    2: 'faint',
    3: 'italic',
    4: 'underline',
    5: 'blink',
    7: 'reverse',
    9: 'strikethrough',
  }
  const DEC_OFF: Record<number, Array<keyof SgrDecorations>> = {
    22: ['bold', 'faint'],
    23: ['italic'],
    24: ['underline'],
    25: ['blink'],
    27: ['reverse'],
    29: ['strikethrough'],
  }
  while (i < parts.length) {
    const code = parts[i] ?? 0
    if (code === 0) {
      nextFg = undefined
      nextBg = undefined
      nextDec = undefined
      i += 1
      continue
    }
    const decOn = DEC_ON[code]
    if (decOn) {
      nextDec = nextDec ?? {}
      nextDec[decOn] = true
      i += 1
      continue
    }
    const decOff = DEC_OFF[code]
    if (decOff && nextDec) {
      for (const key of decOff) delete nextDec[key]
      if (Object.keys(nextDec).length === 0) nextDec = undefined
      i += 1
      continue
    }
    if (code === 39) {
      nextFg = undefined
      i += 1
      continue
    }
    if (code === 49) {
      nextBg = undefined
      i += 1
      continue
    }
    if (code >= 30 && code <= 37) {
      nextFg = ansi16(code - 30)
      i += 1
      continue
    }
    if (code >= 90 && code <= 97) {
      nextFg = ansi16(code - 90 + 8)
      i += 1
      continue
    }
    if (code >= 40 && code <= 47) {
      nextBg = ansi16(code - 40)
      i += 1
      continue
    }
    if (code >= 100 && code <= 107) {
      nextBg = ansi16(code - 100 + 8)
      i += 1
      continue
    }
    if ((code === 38 || code === 48) && parts[i + 1] === 5) {
      const idx = parts[i + 2] ?? 0
      const rgb = ansi256ToRgb(idx)
      if (code === 38) nextFg = rgb
      else nextBg = rgb
      i += 3
      continue
    }
    if ((code === 38 || code === 48) && parts[i + 1] === 2) {
      const rgb = {
        r: clampByte(parts[i + 2] ?? 0),
        g: clampByte(parts[i + 3] ?? 0),
        b: clampByte(parts[i + 4] ?? 0),
      }
      if (code === 38) nextFg = rgb
      else nextBg = rgb
      i += 5
      continue
    }
    i += 1
  }
  return { fg: nextFg, bg: nextBg, decorations: nextDec, reset: false }
}

function clampByte(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(255, Math.round(n)))
}

function ansi256ToRgb(index: number): Rgb {
  if (index < 16) return ansi16(index)
  // Grayscale ramp (232-255)
  if (index >= 232) {
    const gray = (index - 232) * 10 + 8
    return { r: gray, g: gray, b: gray }
  }
  // 6x6x6 color cube (16-231)
  const i = index - 16
  const r = Math.floor(i / 36)
  const g = Math.floor((i % 36) / 6)
  const b = i % 6
  return { r: r * 51, g: g * 51, b: b * 51 }
}

function prefixOf(fg?: Rgb, bg?: Rgb): string {
  let out = ''
  if (fg) out += `\x1b[38;2;${fg.r};${fg.g};${fg.b}m`
  if (bg) out += `\x1b[48;2;${bg.r};${bg.g};${bg.b}m`
  return out
}

const widthMemo = new Map<string, number>()
function cellWidth(char: string): number {
  const cached = widthMemo.get(char)
  if (cached !== undefined) return cached
  const width = Math.max(1, Bun.stringWidth(char))
  if (widthMemo.size > 4096) widthMemo.clear()
  widthMemo.set(char, width)
  return width
}

export function parseVisualCells(line: string): VisualCell[] {
  const cells: VisualCell[] = []
  let i = 0
  let fg: Rgb | undefined
  let bg: Rgb | undefined
  let decorations: SgrDecorations | undefined
  let active = ''

  while (i < line.length) {
    if (line.charCodeAt(i) === 0x1b) {
      CSI.lastIndex = i
      const match = CSI.exec(line)
      if (match) {
        const seq = match[0]!
        const isSgr = seq.endsWith('m')
        if (isSgr) {
          const parsed = parseSgr(seq, fg, bg, decorations)
          if (parsed.reset) {
            fg = undefined
            bg = undefined
            decorations = undefined
            active = ''
          } else {
            fg = parsed.fg
            bg = parsed.bg
            decorations = parsed.decorations
            active += seq
          }
        }
        i = CSI.lastIndex
        continue
      }
      // OSC and other escapes carry no cell styling; skip them entirely
      // instead of leaking them into cell prefixes as literal text.
      OSC.lastIndex = i
      if (OSC.exec(line)) {
        i = OSC.lastIndex
        continue
      }
      ESC_OTHER.lastIndex = i
      if (ESC_OTHER.exec(line)) {
        i = ESC_OTHER.lastIndex
        continue
      }
    }

    const code = line.codePointAt(i)
    if (code === undefined) break
    const char = String.fromCodePoint(code)
    i += char.length
    if (char === '\n' || char === '\r') continue
    cells.push({ char, prefix: active || prefixOf(fg, bg), fg, bg, decorations })
    // Wide graphemes occupy extra terminal columns. Emit trailing space
    // cells so one cell === one column everywhere (layout, slicing, and
    // buffer writes stay in agreement with stringWidth math).
    const span = cellWidth(char)
    for (let t = 1; t < span; t++) {
      cells.push({ char: ' ', prefix: active || prefixOf(fg, bg), fg, bg, decorations })
    }
  }

  return cells
}

export function joinVisualCells(cells: readonly VisualCell[]): string {
  if (cells.length === 0) return ''
  let out = ''
  let last = ''
  for (const cell of cells) {
    if (cell.prefix !== last) {
      if (last && !cell.prefix) out += '\x1b[0m'
      out += cell.prefix
      last = cell.prefix
    }
    out += cell.char
  }
  if (last) out += '\x1b[0m'
  return out
}

export function sliceVisual(line: string, width: number): string {
  const limit = Math.max(0, Math.floor(width))
  return joinVisualCells(parseVisualCells(line).slice(0, limit))
}

/** Visible columns in a line, ignoring CSI. */
export function visualCellCount(line: string): number {
  return parseVisualCells(line).length
}

/**
 * Pad or clip a line to `width` visible columns.
 * Unstyled exact-width text stays a plain string so join tests stay stable.
 */
export function padVisual(line: string, width: number): string {
  const target = Math.max(0, Math.floor(width))
  if (target === 0) return ''
  const cells = parseVisualCells(line)
  const used = cells.length > target ? cells.slice(0, target) : cells
  let out = joinVisualCells(used)
  if (used.length < target) out += ' '.repeat(target - used.length)
  return out
}
