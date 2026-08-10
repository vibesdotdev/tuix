/**
 * Focus tracking CSI parse — pure helpers for Live Input.focusEvents.
 * xterm focus: enable with CSI ? 1004 h
 *   focus in:  ESC [ I
 *   focus out: ESC [ O
 */

export const FOCUS_IN = '\x1b[I'
export const FOCUS_OUT = '\x1b[O'

export type FocusEvent = { readonly focused: boolean }

/**
 * If buffer starts with a complete focus sequence, return event + rest.
 * Incomplete ESC[ returns null (caller should wait).
 */
export function extractFocusEvent(buffer: string): { event: FocusEvent; rest: string } | null {
  if (buffer.startsWith(FOCUS_IN)) {
    return { event: { focused: true }, rest: buffer.slice(FOCUS_IN.length) }
  }
  if (buffer.startsWith(FOCUS_OUT)) {
    return { event: { focused: false }, rest: buffer.slice(FOCUS_OUT.length) }
  }
  // Incomplete focus CSI: ESC [ without I/O yet
  if (buffer === '\x1b' || buffer === '\x1b[') {
    return null
  }
  return null
}

/**
 * Strip leading focus sequences from buffer, collecting events.
 * Returns remaining buffer and events in order.
 */
export function drainFocusEvents(buffer: string): {
  events: FocusEvent[]
  rest: string
} {
  const events: FocusEvent[] = []
  let rest = buffer
  while (rest.length > 0) {
    const hit = extractFocusEvent(rest)
    if (!hit) {
      // Wait for more only if incomplete ESC[
      if (rest === '\x1b' || rest === '\x1b[') {
        return { events, rest }
      }
      break
    }
    events.push(hit.event)
    rest = hit.rest
  }
  return { events, rest }
}
