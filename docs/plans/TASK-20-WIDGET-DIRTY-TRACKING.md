# Task 20: Widget-Level Dirty Tracking (View Memoization)

## Goal
Prevent rebuilding unchanged subtrees in the view function. When only one model field changes, only the widgets that read that field should re-render.

## Current State
- `view(model)` re-invokes the **entire JSX component function** every frame
- `compileToComponent` wraps view as: `beginViewHydration(model) → jsxComponent(model) → endViewHydration()`
- There is **zero memoization** at any layer
- The `$derived` rune already has dependency tracking via `tracking.ts` (`pushCollector/popCollector/trackRead`)
- `$state` already calls `trackRead(rune)` when read during a tracked computation
- The dirty flag in the runtime is **frame-level** (any message = full re-render)

## Architecture Analysis

### The dependency tracking infrastructure exists:
```
trackingStack: DepCollector[]   ← stack of Set<Trackable>
pushCollector(deps) → adds to stack
trackRead(rune) → adds rune to top collector
popCollector() → removes from stack
```

When `$derived(fn)` runs, it:
1. Pushes a fresh collector
2. Executes `fn()` (which reads `$state` runes, triggering `trackRead`)
3. Pops the collector — now has the exact set of dependencies
4. Subscribes to all deps; recomputes when any dep fires

### The key insight:
**A widget subtree is conceptually a `$derived` computation.** It reads specific `$state` fields and produces a View. If none of its deps changed, its output is the same.

## Design

### Approach: `memo()` JSX wrapper with dependency-tracked caching

```typescript
/**
 * Memoize a JSX subtree. Re-renders only when its $state dependencies change.
 *
 * @example
 * ```tsx
 * const header = memo(() => <Header title={title()} user={user()} />)
 * const sidebar = memo(() => <Sidebar items={items()} />)
 * 
 * return <vstack>{header}{sidebar}{content}</vstack>
 * ```
 */
export function memo<T>(fn: () => T): T
```

Internally:
1. First call: push a dep collector, execute `fn()`, pop collector, cache result + deps
2. Subsequent calls: check if any dep in the set has been invalidated since last run
3. If no deps changed: return cached result (skip entire subtree)
4. If deps changed: re-execute, update cache + deps

### Where it hooks in:

```
JSX component function (re-invoked every frame by compileToComponent)
  ├── memo(() => <Header ... />)   ← tracks deps, caches View
  ├── memo(() => <Sidebar ... />)  ← tracks deps, caches View  
  └── <MainContent ... />          ← always re-renders (no memo)
```

### Cache invalidation signal:
- Each `$state.$set()` already notifies listeners
- The memo wrapper subscribes to its deps (like `$derived` does)
- On notification: mark the memo as stale (set a dirty flag)
- On next `view(model)` call: stale memos re-execute, clean memos return cache

### The render result cache:
- Cache key: identity of the memo (created once per component lifetime)
- Cache value: the JSX result (View or JSX descriptor)
- Invalidation: subscription-based (not comparison-based)

## Implementation Plan

### Phase 1: Core `memo()` rune (packages/reactive)

Create `packages/reactive/src/runes/memo.ts`:

```typescript
interface MemoState<T> {
  value: T | undefined
  deps: Set<Trackable>
  dirty: boolean
  unsubs: Array<() => void>
}

export function memo<T>(fn: () => T): T {
  // Get or create memo state for this call site
  const state = getMemoSlot<T>()
  
  if (state.value !== undefined && !state.dirty) {
    // Cache hit: no deps changed since last execution
    return state.value
  }
  
  // Cache miss or stale: re-execute with dep tracking
  // Unsubscribe from old deps
  for (const unsub of state.unsubs) unsub()
  state.unsubs = []
  state.deps.clear()
  
  // Track new deps
  pushCollector(state.deps)
  let result: T
  try {
    result = fn()
  } finally {
    popCollector()
  }
  
  // Subscribe to all tracked deps
  for (const dep of state.deps) {
    const unsub = dep.$subscribe(() => { state.dirty = true })
    state.unsubs.push(unsub)
  }
  
  state.value = result
  state.dirty = false
  return result
}
```

### Phase 2: Slot management (call-site identity)

The challenge: `memo(fn)` is called inside a component function that re-executes every frame. We need stable identity for each memo call site across invocations.

**Solution: Positional slot array** (like React hooks):
```typescript
let memoSlots: MemoState<any>[] = []
let memoIndex = 0

export function beginMemoFrame(): void { memoIndex = 0 }
export function endMemoFrame(): void { /* trim excess slots */ }

function getMemoSlot<T>(): MemoState<T> {
  if (memoIndex >= memoSlots.length) {
    memoSlots.push({ value: undefined, deps: new Set(), dirty: true, unsubs: [] })
  }
  return memoSlots[memoIndex++]!
}
```

Wire `beginMemoFrame()` into `beginViewHydration()` and `endMemoFrame()` into `endViewHydration()`.

### Phase 3: Integration with compileToComponent

In `packages/jsx/src/compiler/jsx-to-component.ts`, the view function:
```typescript
view: async (model) => {
  beginViewHydration(record)
  beginMemoFrame()           // ← ADD
  try {
    const result = await jsxComponent(model)
    return toView(result)
  } finally {
    endMemoFrame()           // ← ADD
    endViewHydration()
  }
}
```

### Phase 4: Smart dirty detection in runtime

Currently the runtime sets `dirty = true` on ANY message. With memo, we can be smarter:
- `SetMsg` (from $state.$set): only the specific $state changed → only memos that depend on it will recompute
- The render fiber still runs every frame when dirty, but memo'd subtrees skip
- Net effect: `view(model)` is called, but 80%+ of the tree returns cached Views

### Phase 5: View-level render caching (optional optimization)

Even after memo returns a cached JSX tree, `View.render()` still produces strings. Add:
```typescript
function cachedView(view: View): View {
  let cached: string | undefined
  let cachedContext: RenderContext | undefined
  return {
    ...view,
    render: (context) => {
      if (cached && shallowEqual(context, cachedContext)) {
        return Effect.succeed(cached)
      }
      return view.render(context).pipe(Effect.tap(result => {
        cached = typeof result === 'string' ? result : result.content
        cachedContext = context
      }))
    }
  }
}
```

Apply this to memo'd subtrees: when the memo returns a cached value, the View's render is also cached.

## Execution Steps

| Step | Description | Tests | Estimated |
|------|-------------|-------|-----------|
| 1 | Create `memo.ts` with slot management | Unit tests for memo cache hit/miss | 1h |
| 2 | Wire beginMemoFrame/endMemoFrame into hydration | Existing tests still pass | 30m |
| 3 | Wire into compileToComponent | Integration test: memo skips unchanged subtree | 1h |
| 4 | Add `$state` change tracking (per-field dirty) | Test: only changed-field memos recompute | 1h |
| 5 | View.render() caching for memo'd trees | Benchmark: frame time reduction | 1h |
| 6 | Add `memo()` export to @tuix/reactive barrel | Docs, examples | 30m |
| 7 | Dogfood in apps/demo kit workbench | Visual verification, PTY evidence | 1h |

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Stale UI from over-caching | Memo is opt-in (explicit `memo()` wrapper). Un-memo'd trees always re-render |
| Slot ordering violation (conditionals) | Same constraint as React hooks: memo() must be called unconditionally. Lint rule. |
| Memory leak from subscriptions | `endMemoFrame()` trims excess slots and unsubscribes. Component unmount clears all. |
| Non-pure side effects in memo'd fn | Document: memo'd functions must be pure (read state, return JSX). Same as $derived contract. |
| Context (width/height) changes | View-level cache keys on context. Memo invalidates on resize (resize sets dirty=true globally). |

## Expected Impact

For a typical app with 5-10 widget regions (kit workbench):
- **Without memo**: Every frame re-invokes all JSX, re-creates all Views, re-renders all strings
- **With memo**: Only the 1-2 regions whose deps changed re-execute; others return cached View+string
- **Estimated**: 60-80% reduction in view function cost per frame
- **Measured by**: PerfHud frame time before/after memo adoption

## Dependencies
- Task 4 (typed-array buffer) is independent — these compose well together
- Requires the existing `tracking.ts` infrastructure (already works)
- Requires `beginViewHydration`/`endViewHydration` hooks (already exist)
