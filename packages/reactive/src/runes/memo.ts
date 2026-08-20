/**
 * Widget-level memoization rune.
 *
 * Tracks which $state runes a computation reads and caches the result.
 * Re-executes only when a tracked dependency fires. Designed to wrap
 * JSX subtrees so unchanged portions of the view skip re-rendering.
 *
 * Uses positional slot identity (like React hooks) — must be called
 * unconditionally in the same order every frame.
 *
 * @since 1.0.0
 */

import { pushCollector, popCollector, type Trackable } from './tracking'

/**
 * Internal memo slot state.
 */
interface MemoSlot<T> {
  /** Cached computation result */
  value: T | undefined
  /** Set of $state runes this computation depends on */
  deps: Set<Trackable>
  /** Whether any dependency has fired since last execution */
  dirty: boolean
  /** Unsubscribe functions for dependency listeners */
  unsubs: Array<() => void>
  /** Whether this slot has ever been executed */
  initialized: boolean
}

// ─── Slot Management ────────────────────────────────────────────────────────

let slots: MemoSlot<any>[] = []
let slotIndex = 0
let memoActive = false

/**
 * Begin a memo frame. Call before the view function executes.
 * Resets the slot index so memo() calls match their previous positions.
 */
export function beginMemoFrame(): void {
  slotIndex = 0
  memoActive = true
}

/**
 * End a memo frame. Call after the view function completes.
 * Trims excess slots (from removed memo calls) and cleans up their subscriptions.
 */
export function endMemoFrame(): void {
  // Trim slots that are no longer used (component structure changed)
  while (slots.length > slotIndex) {
    const removed = slots.pop()!
    for (const unsub of removed.unsubs) unsub()
  }
  memoActive = false
}

/**
 * Reset all memo state. Call on component unmount or hot reload.
 */
export function resetMemoSlots(): void {
  for (const slot of slots) {
    for (const unsub of slot.unsubs) unsub()
  }
  slots = []
  slotIndex = 0
  memoActive = false
}

function getSlot<T>(): MemoSlot<T> {
  if (slotIndex >= slots.length) {
    slots.push({
      value: undefined,
      deps: new Set(),
      dirty: true,
      unsubs: [],
      initialized: false,
    })
  }
  return slots[slotIndex++]!
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Memoize a computation based on its reactive dependencies.
 *
 * On first call, executes `fn()` while tracking which $state runes are read.
 * On subsequent calls, returns the cached result if no tracked dependency
 * has changed. Re-executes only when a dependency fires.
 *
 * Must be called unconditionally in the same order every frame (like hooks).
 *
 * @example
 * ```tsx
 * function MyApp() {
 *   const header = memo(() => <Header title={title()} />)
 *   const sidebar = memo(() => <Sidebar items={items()} />)
 *   const main = memo(() => <MainContent data={data()} />)
 *
 *   return <vstack>{header}{sidebar}{main}</vstack>
 * }
 * ```
 *
 * @param fn Pure computation that reads $state runes and returns a value.
 * @returns Cached value if deps unchanged, fresh value otherwise.
 */
export function memo<T>(fn: () => T): T {
  if (!memoActive) {
    // Outside a memo frame (e.g., one-shot render) — just execute directly.
    return fn()
  }

  const slot = getSlot<T>()

  // Cache hit: no deps changed since last execution
  if (slot.initialized && !slot.dirty) {
    return slot.value as T
  }

  // Cache miss or stale: re-execute with dependency tracking

  // Tear down old subscriptions
  for (const unsub of slot.unsubs) unsub()
  slot.unsubs = []
  slot.deps.clear()

  // Track dependencies during execution
  pushCollector(slot.deps as Set<Trackable>)
  let result: T
  try {
    result = fn()
  } finally {
    popCollector()
  }

  // Subscribe to all tracked deps — mark dirty when any fires
  for (const dep of slot.deps) {
    const unsub = dep.$subscribe(() => {
      slot.dirty = true
    })
    slot.unsubs.push(unsub)
  }

  slot.value = result
  slot.dirty = false
  slot.initialized = true
  return result
}

/**
 * Check if memo is currently active (inside a memo frame).
 * Useful for conditional behavior in rune implementations.
 */
export function isMemoActive(): boolean {
  return memoActive
}

/**
 * Get memo statistics for debugging.
 */
export function getMemoStats(): { totalSlots: number; dirtySlots: number; cleanSlots: number } {
  let dirty = 0
  let clean = 0
  for (const slot of slots) {
    if (slot.dirty || !slot.initialized) dirty++
    else clean++
  }
  return { totalSlots: slots.length, dirtySlots: dirty, cleanSlots: clean }
}
