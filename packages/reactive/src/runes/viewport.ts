/**
 * Global viewport store — terminal size as a reactive rune.
 *
 * The runtime hydrates it from WindowResize messages (and once at boot), so
 * view code reads `useViewport()` instead of `process.stdout`. Resizes flow
 * through the normal rune → MVU bridge, so any component consuming the rune
 * re-renders automatically when the terminal size changes.
 */

import { $state, $derived } from './runes'

export interface ViewportSize {
  readonly cols: number
  readonly rows: number
}

function initial(): ViewportSize {
  const stdout = process.stdout as { columns?: number; rows?: number } | undefined
  return {
    cols: Math.max(1, stdout?.columns ?? 80),
    rows: Math.max(1, stdout?.rows ?? 24),
  }
}

const viewport = $state<ViewportSize>(initial(), 'viewport')

/** Runtime hook: replace the viewport size (called on WindowResize). */
export function setViewportSize(cols: number, rows: number): void {
  if (!Number.isFinite(cols) || !Number.isFinite(rows) || cols < 1 || rows < 1) return
  const current = viewport()
  if (current.cols === cols && current.rows === rows) return
  viewport.$set({ cols, rows })
}

/**
 * Reactive terminal size. Returns a rune — call it to read the current
 * viewport. Components using it re-render on terminal resize.
 */
export function useViewport() {
  return $derived(() => viewport())
}
