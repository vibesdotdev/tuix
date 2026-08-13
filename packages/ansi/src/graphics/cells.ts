/**
 * Visual cells: one terminal column, with its truecolor prefix intact.
 * Layout that iterates UTF-8 code points will shred CSI. Use these instead.
 */

export interface Rgb {
  r: number
  g: number
  b: number
}

export interface VisualCell {
  char: string
  prefix: string
  fg?: Rgb
  bg?: Rgb
}

const CSI = /\u001b\[[0-?]*[ -/]*[@-~]/y

function parseSgr(seq: string, fg?: Rgb, bg?: Rgb): { fg?: Rgb; bg?: Rgb; reset: boolean } {
  if (seq === '\u001b[0m' || seq === '\u001b[m') return { reset: true }
  if (!seq.startsWith('\u001b[') || !seq.endsWith('m')) return { fg, bg, reset: false }
  const parts = seq.slice(2, -1).split(';').map(n => Number(n))
  let i = 0
  let nextFg = fg
  let nextBg = bg
  while (i < parts.length) {
    const code = parts[i] ?? 0
    if (code === 0) {
      nextFg = undefined
      nextBg = undefined
      i += 1
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
  return { fg: nextFg, bg: nextBg, reset: false }
}

function clampByte(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(255, Math.round(n)))
}

function prefixOf(fg?: Rgb, bg?: Rgb): string {
  let out = ''
  if (fg) out += `\x1b[38;2;${fg.r};${fg.g};${fg.b}m`
  if (bg) out += `\x1b[48;2;${bg.r};${bg.g};${bg.b}m`
  return out
}

export function parseVisualCells(line: string): VisualCell[] {
  const cells: VisualCell[] = []
  let i = 0
  let fg: Rgb | undefined
  let bg: Rgb | undefined

  while (i < line.length) {
    if (line.charCodeAt(i) === 0x1b) {
      CSI.lastIndex = i
      const match = CSI.exec(line)
      if (match) {
        const parsed = parseSgr(match[0]!, fg, bg)
        if (parsed.reset) {
          fg = undefined
          bg = undefined
        } else {
          fg = parsed.fg
          bg = parsed.bg
        }
        i = CSI.lastIndex
        continue
      }
    }

    const code = line.codePointAt(i)
    if (code === undefined) break
    const char = String.fromCodePoint(code)
    i += char.length
    if (char === '\n' || char === '\r') continue
    cells.push({ char, prefix: prefixOf(fg, bg), fg, bg })
  }

  return cells
}

export function joinVisualCells(cells: readonly VisualCell[]): string {
  if (cells.length === 0) return ''
  return `${cells.map(cell => `${cell.prefix}${cell.char}`).join('')}\x1b[0m`
}

export function sliceVisual(line: string, width: number): string {
  const limit = Math.max(0, Math.floor(width))
  return joinVisualCells(parseVisualCells(line).slice(0, limit))
}
