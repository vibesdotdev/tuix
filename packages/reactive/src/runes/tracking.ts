/**
 * Shared dependency-tracking context for $state / $derived / untrack.
 */

export type Trackable = {
  $subscribe(listener: (value: unknown) => void): () => void
}

type DepCollector = Set<Trackable>

const trackingStack: DepCollector[] = []
let untrackDepth = 0

export function trackRead(rune: Trackable): void {
  if (untrackDepth > 0) return
  const top = trackingStack[trackingStack.length - 1]
  if (top) top.add(rune)
}

export function pushCollector(deps: DepCollector): void {
  trackingStack.push(deps)
}

export function popCollector(): void {
  trackingStack.pop()
}

export function runUntracked<T>(fn: () => T): T {
  untrackDepth++
  try {
    return fn()
  } finally {
    untrackDepth--
  }
}

export function isTracking(): boolean {
  return trackingStack.length > 0 && untrackDepth === 0
}
