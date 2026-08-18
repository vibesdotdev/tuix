/**
 * Focus ring + scoped key routing for interactive sessions.
 *
 * The registry is module-global (like keyHandlers): widgets register
 * focusables while their view renders, the runtime sweeps stale entries
 * after each frame, and `emitKeyToHandlers` routes keys to the focused
 * widget before broadcasting to global handlers.
 *
 * Focus state is held in a lazily-created named `$state` (`__tuix_focus`)
 * so focus changes flow through the MVU bridge and repaint the frame —
 * the same path user state takes.
 */

import { $state, type StateRune } from './runes'

export type ScopedKeyHandler = (key: string) => boolean | void

interface FocusEntry {
  handler: ScopedKeyHandler | null
  seen: number
}

const focusables = new Map<string, FocusEntry>()
let focusOrderList: string[] = []
let sweepEpoch = 0

let focusRune: StateRune<string | null> | null = null

function ensureFocusRune(): StateRune<string | null> {
  if (!focusRune) {
    focusRune = $state<string | null>(null, '__tuix_focus')
  }
  return focusRune
}

/**
 * Register (or refresh) a focusable widget. Call from view code —
 * re-registering every render is the expected pattern; entries not
 * re-registered before the next sweep are dropped.
 */
export function registerFocusable(id: string, handler?: ScopedKeyHandler): void {
  const existing = focusables.get(id)
  if (existing) {
    existing.handler = handler ?? null
    existing.seen = sweepEpoch
  } else {
    focusables.set(id, { handler: handler ?? null, seen: sweepEpoch })
    focusOrderList.push(id)
  }
}

/** Remove a focusable immediately (e.g. widget unmounted by choice). */
export function unregisterFocusable(id: string): void {
  focusables.delete(id)
  focusOrderList = focusOrderList.filter(x => x !== id)
  if (ensureFocusRune()() === id) setFocusedId(null)
}

/** The currently focused widget id, or null. */
export function getFocusedId(): string | null {
  return ensureFocusRune()()
}

/**
 * Move focus. Writes the named focus rune so the MVU bridge schedules a
 * repaint; unknown ids are ignored (except null).
 */
export function setFocusedId(id: string | null): void {
  if (id !== null && !focusables.has(id)) return
  ensureFocusRune().$set(id)
}

/** True when `id` is the focused widget. Read during view rendering. */
export function isFocused(id: string): boolean {
  return ensureFocusRune()() === id
}

/**
 * Advance focus through registration order (first-seen order). Disabled or
 * swept widgets are skipped because their entries are gone. Returns the new
 * focused id, or null when there is nothing to focus.
 */
export function cycleFocus(direction: 1 | -1): string | null {
  if (focusOrderList.length === 0) {
    setFocusedId(null)
    return null
  }
  const current = getFocusedId()
  let index = current ? focusOrderList.indexOf(current) : -1
  if (index === -1) index = direction === 1 ? -1 : 0
  const next = focusOrderList[(index + direction + focusOrderList.length) % focusOrderList.length]!
  setFocusedId(next)
  return next
}

/** Number of live focusables (used to decide Tab ownership). */
export function focusCount(): number {
  return focusables.size
}

/**
 * Deliver a key to the focused widget's handler.
 * Returns true when a handler consumed it (stops global broadcast).
 */
export function dispatchFocusedKey(key: string): boolean {
  const id = getFocusedId()
  if (id === null) return false
  const entry = focusables.get(id)
  if (!entry?.handler) return false
  try {
    return entry.handler(key) === true
  } catch {
    return false
  }
}

/**
 * Drop focusables and overlay handlers that were not re-registered since
 * the last sweep. Called by the runtime after each frame paint. If the
 * focused widget was swept, focus resets to null.
 */
export function sweepFocusables(): void {
  for (const [id, entry] of focusables) {
    if (entry.seen !== sweepEpoch) {
      focusables.delete(id)
      focusOrderList = focusOrderList.filter(x => x !== id)
      if (getFocusedId() === id) ensureFocusRune().$set(null)
    }
  }
  for (const [handler, seen] of overlayKeyHandlers) {
    if (seen !== sweepEpoch) overlayKeyHandlers.delete(handler)
  }
  for (const [handler, seen] of backdropHandlers) {
    if (seen !== sweepEpoch) backdropHandlers.delete(handler)
  }
  sweepEpoch++
}

/** Full reset between runs (runtime cleanup). */
export function resetFocus(): void {
  focusables.clear()
  focusOrderList = []
  sweepEpoch = 0
  focusRune = null
  overlayKeyHandlers.clear()
  backdropHandlers.clear()
}

// ---------------------------------------------------------------------------
// Overlay (modal) handlers — registered while a modal's view renders.
// Overlay keys take priority over the focus ring and global handlers, so a
// modal never leaks keystrokes to the surface beneath it.
// ---------------------------------------------------------------------------

const overlayKeyHandlers = new Map<ScopedKeyHandler, number>()
const backdropHandlers = new Map<() => void, number>()

/** Register a modal-level key handler for the current frame. */
export function registerOverlayKeyHandler(handler: ScopedKeyHandler): void {
  overlayKeyHandlers.set(handler, sweepEpoch)
}

/** Register a backdrop-click handler (called when a click misses overlay content). */
export function registerBackdropHandler(handler: () => void): void {
  backdropHandlers.set(handler, sweepEpoch)
}

/** Offer a key to overlay handlers first. True when any consumed it. */
export function dispatchOverlayKey(key: string): boolean {
  let consumed = false
  for (const handler of overlayKeyHandlers.keys()) {
    try {
      if (handler(key) === true) consumed = true
    } catch {
      /* overlay handler errors must not kill input */
    }
  }
  return consumed
}

/** True when any overlay key handler is active (modal open). */
export function hasOverlayKeyHandlers(): boolean {
  return overlayKeyHandlers.size > 0
}

/** Fire backdrop handlers. True when at least one was registered. */
export function dispatchBackdropClick(): boolean {
  const handlers = [...backdropHandlers.keys()]
  for (const handler of handlers) {
    try {
      handler()
    } catch {
      /* backdrop handler errors must not kill input */
    }
  }
  return handlers.length > 0
}
