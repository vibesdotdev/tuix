/**
 * Bracketed paste parsing — pure helpers for InputService.pasteEvents.
 */

/** Start / end sequences for bracketed paste mode (xterm). */
export const BRACKETED_PASTE_START = '\x1b[200~'
export const BRACKETED_PASTE_END = '\x1b[201~'

/**
 * If `data` contains a complete bracketed paste, return the pasted text and remainder.
 * Incomplete paste returns null (caller should buffer).
 */
export function extractBracketedPaste(buffer: string): { paste: string; rest: string } | null {
  const start = buffer.indexOf(BRACKETED_PASTE_START)
  if (start < 0) return null
  const contentStart = start + BRACKETED_PASTE_START.length
  const end = buffer.indexOf(BRACKETED_PASTE_END, contentStart)
  if (end < 0) return null
  const paste = buffer.slice(contentStart, end)
  const rest = buffer.slice(0, start) + buffer.slice(end + BRACKETED_PASTE_END.length)
  return { paste, rest }
}

/**
 * Feed chunks into a buffer and emit complete pastes.
 */
export function createPasteAccumulator(): {
  push: (chunk: string) => string[]
  reset: () => void
} {
  let buf = ''
  return {
    push(chunk: string) {
      buf += chunk
      const pastes: string[] = []
      let extracted = extractBracketedPaste(buf)
      while (extracted) {
        pastes.push(extracted.paste)
        buf = extracted.rest
        extracted = extractBracketedPaste(buf)
      }
      // Cap buffer to avoid unbounded growth on malformed streams
      if (buf.length > 1_000_000) buf = buf.slice(-100_000)
      return pastes
    },
    reset() {
      buf = ''
    },
  }
}
