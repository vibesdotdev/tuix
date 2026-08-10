/**
 * Cursor Position Report (CPR) parse/helpers.
 * Response format: ESC [ row ; col R  (1-based)
 */

export interface CursorPosition {
  readonly x: number
  readonly y: number
}

const CPR_RE = /\x1b\[(\d+);(\d+)R/

/**
 * Parse a CPR response buffer. Returns null if no complete report found.
 */
export function parseCursorPositionReport(data: string | Buffer): CursorPosition | null {
  const text = typeof data === 'string' ? data : data.toString('utf8')
  const match = text.match(CPR_RE)
  if (!match) return null
  const y = Number(match[1])
  const x = Number(match[2])
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 1 || y < 1) return null
  return { x, y }
}

/** ANSI request for cursor position (DSR). */
export const REQUEST_CURSOR_POSITION = '\x1b[6n'

/**
 * Extract CPR from a stream of chunks (concat until match or maxBytes).
 */
export function accumulateCpr(chunks: readonly string[], maxBytes = 64): CursorPosition | null {
  let buf = ''
  for (const c of chunks) {
    buf += c
    if (buf.length > maxBytes) buf = buf.slice(-maxBytes)
    const pos = parseCursorPositionReport(buf)
    if (pos) return pos
  }
  return null
}
