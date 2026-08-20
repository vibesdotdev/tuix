/**
 * Svelte-inspired runes with dependency-tracked $derived.
 */

import { Effect } from 'effect'
import { getGlobalEventBus } from '@tuix/core/events'
import { getGlobalRegistry } from '@tuix/core'
import { ReactivityModule } from './module'
import { trackRead, pushCollector, popCollector, runUntracked } from './tracking'
import { beginMemoFrame, endMemoFrame } from './memo'
import {
  dispatchOverlayKey,
  dispatchFocusedKey,
  cycleFocus,
  focusCount,
  hasOverlayKeyHandlers,
  getFocusedId,
} from './focus'

export { runUntracked }

// ---------------------------------------------------------------------------
// Model extraction session (JSX compile-time / extractModel)
// Bun rewrites `const count = $state(0)` → `return $state(0)`, stripping names.
// Named extraction uses $state(0, 'count') or $states({ count: 0 }).
// ---------------------------------------------------------------------------

let extractionModel: Record<string, unknown> | null = null
let extractionAnon = 0

export function beginModelExtraction(): void {
  extractionModel = {}
  extractionAnon = 0
}

export function endModelExtraction(): Record<string, unknown> {
  const out = extractionModel ?? {}
  extractionModel = null
  extractionAnon = 0
  return out
}

export function isModelExtracting(): boolean {
  return extractionModel != null
}

function registerExtracted(name: string | undefined, initial: unknown): void {
  if (!extractionModel) return
  if (name && name.length > 0) {
    extractionModel[name] = initial
    return
  }
  const n = Object.keys(extractionModel).filter(k => k === 'value' || /^value\d+$/.test(k)).length
  extractionModel[n === 0 ? 'value' : `value${n}`] = initial
  extractionAnon = n + 1
}

// ---------------------------------------------------------------------------
// View hydration: named $state reads current MVU model so re-renders paint updates
// ---------------------------------------------------------------------------

let viewHydrationModel: Record<string, unknown> | null = null

export function beginViewHydration(model: Record<string, unknown>): void {
  viewHydrationModel = model
  beginMemoFrame()
}

export function endViewHydration(): void {
  endMemoFrame()
  viewHydrationModel = null
}

function hydrateInitial<T>(initial: T, name?: string): T {
  if (viewHydrationModel && name && name in viewHydrationModel) {
    return viewHydrationModel[name] as T
  }
  return initial
}

// ---------------------------------------------------------------------------
// MVU bridge: named $set must update the model, not only the ephemeral rune.
// Runtime binds a push that offers UserMsg { type: 'set', key, value }.
// Without this, next view() rehydrates from stale model and paints the old value.
// ---------------------------------------------------------------------------

export type MvuSetMsg = { readonly type: 'set'; readonly key: string; readonly value: unknown }

type MvuPush = (msg: MvuSetMsg) => void

let mvuPush: MvuPush | null = null

/** Bind (or clear) the sink for named `$state.$set` → MVU UserMsg. */
export function bindMvuPush(push: MvuPush | null): void {
  mvuPush = push
}

export function getMvuPush(): MvuPush | null {
  return mvuPush
}

// ---------------------------------------------------------------------------
// Key handlers: Runtime KeyPress notifies registered handlers (one-shot mount).
// Prefer this over raw stdin in components (avoids double-read / 60fps $effect leak).
// ---------------------------------------------------------------------------

const keyHandlers = new Set<(key: string) => void>()

/**
 * Register a keyboard handler for the active interactive session.
 * Returns cleanup. Safe to call once from a module-level mount guard.
 */
export function registerKeyHandler(handler: (key: string) => void): () => void {
  keyHandlers.add(handler)
  return () => {
    keyHandlers.delete(handler)
  }
}

/**
 * Called by Runtime on each KeyPress (string form of the key).
 *
 * Routing order: overlay (modal) handlers first — a modal owns keys while
 * open, nothing falls through — then Tab focus cycling (when focusables
 * exist), then the focused widget's scoped handler, then global handlers.
 * A scoped handler that returns `true` consumes the key.
 */
export function emitKeyToHandlers(key: string): void {
  if (process.env.TUIX_DEBUG_KEYS) {
    const consumed = debugRoute(key)
    console.log('[emitKeyToHandlers]', JSON.stringify(key), {
      overlay: hasOverlayKeyHandlers(),
      focusables: focusCount(),
      focused: getFocusedId(),
      consumed,
    })
    return
  }
  debugRoute(key)
}

function debugRoute(key: string): boolean {
  if (hasOverlayKeyHandlers()) {
    dispatchOverlayKey(key)
    return true
  }
  if (focusCount() > 0) {
    if (key === 'tab' || key === 'Tab') {
      cycleFocus(1)
      return true
    }
    if (key === 'shift+tab' || key === 'Shift+Tab' || key === 'btab') {
      cycleFocus(-1)
      return true
    }
  }
  if (dispatchFocusedKey(key)) return true
  for (const h of [...keyHandlers]) {
    try {
      h(key)
    } catch {
      /* handler errors must not kill input */
    }
  }
  return false
}

export function clearKeyHandlers(): void {
  keyHandlers.clear()
}

// Global reactivity module reference
let reactivityModule: ReactivityModule | null = null

function getReactivityModule(): ReactivityModule | null {
  if (!reactivityModule) {
    try {
      const registry = getGlobalRegistry()
      reactivityModule = registry.getModule<ReactivityModule>('reactivity')

      if (!reactivityModule) {
        const eventBus = getGlobalEventBus()
        reactivityModule = new ReactivityModule(eventBus)
        Effect.runSync(registry.register(reactivityModule))
        Effect.runSync(reactivityModule.initialize())
      }
    } catch {
      // Continue without event support
    }
  }
  return reactivityModule
}

export interface Rune<T> {
  (): T
  readonly $type: string
}

export interface StateRune<T> extends Rune<T> {
  readonly $type: 'state'
  /** Optional model key for extractModel under Bun (set via $state(init, name)) */
  readonly $key?: string
  $set(value: T): void
  $update(fn: (current: T) => T): void
  $subscribe(listener: (value: T) => void): () => void
}

export interface BindableRune<T> extends StateRune<T> {
  readonly $type: 'bindable'
  readonly $bindable: true
  $validate?: (value: T) => boolean | string
  $transform?: (value: T) => T
}

export interface DerivedRune<T> extends Rune<T> {
  readonly $type: 'derived'
  $subscribe(listener: (value: T) => void): () => void
}

export interface BindableOptions<T> {
  validate?: (value: T) => boolean | string
  transform?: (value: T) => T
}

/**
 * Create reactive state.
 * @param initial Initial value
 * @param name Optional model field name for extractModel (required for named
 *   fields when Bun rewrites `const count = $state(0)` → `return $state(0)`).
 *   Prefer `$states({ count: 0 })` for multi-field models.
 */
export function $state<T>(initial: T, name?: string): StateRune<T> {
  registerExtracted(name, initial)

  // During view(), hydrate from MVU model so update→view paints new values
  let value = hydrateInitial(initial, name)
  const listeners = new Set<(value: T) => void>()
  const runeId = `state_${Date.now()}_${Math.random()}`

  const module = getReactivityModule()
  if (module) {
    Effect.runSync(module.emitStateChange(runeId, value, 'user'))
  }

  const rune = (() => {
    trackRead(rune as unknown as { $subscribe: StateRune<T>['$subscribe'] })
    return value
  }) as StateRune<T>

  rune.$type = 'state' as const
  if (name) {
    Object.defineProperty(rune, '$key', { value: name, enumerable: false })
  }

  rune.$set = (newValue: T) => {
    if (value !== newValue) {
      value = newValue
      if (module) {
        Effect.runSync(module.emitStateChange(runeId, newValue, 'user'))
      }
      // Snapshot: a listener may unsubscribe/resubscribe during notification
      // (e.g. a $derived recompute), and Set.forEach would then visit the
      // fresh listener too — re-entrant notification loops.
      for (const listener of [...listeners]) listener(value)
      // Named state → MVU model (required for paint after next beginViewHydration)
      if (name && mvuPush) {
        mvuPush({ type: 'set', key: name, value: newValue })
      }
    }
  }

  rune.$update = (fn: (current: T) => T) => {
    rune.$set(fn(value))
  }

  rune.$subscribe = (listener: (value: T) => void) => {
    listeners.add(listener)
    listener(value)
    return () => {
      listeners.delete(listener)
    }
  }

  return rune
}

/**
 * Create a bag of named state runes. Survives Bun rewrite (names from object keys).
 * @example
 * const { count, name } = $states({ count: 0, name: 'hi' })
 */
export function $states<T extends Record<string, unknown>>(
  init: T
): { [K in keyof T]: StateRune<T[K]> } {
  const out = {} as { [K in keyof T]: StateRune<T[K]> }
  for (const key of Object.keys(init) as Array<keyof T>) {
    out[key] = $state(init[key] as T[keyof T], String(key)) as StateRune<T[keyof T]>
  }
  return out
}

export function $bindable<T>(initial: T, options: BindableOptions<T> = {}): BindableRune<T> {
  let value = initial
  const listeners = new Set<(value: T) => void>()
  const runeId = `bindable_${Date.now()}_${Math.random()}`

  const module = getReactivityModule()
  if (module) {
    Effect.runSync(module.emitStateChange(runeId, initial, 'user'))
  }

  const rune = (() => {
    trackRead(rune as unknown as { $subscribe: StateRune<T>['$subscribe'] })
    return value
  }) as BindableRune<T>

  rune.$type = 'bindable' as const
  rune.$bindable = true
  rune.$validate = options.validate
  rune.$transform = options.transform

  rune.$set = (newValue: T) => {
    let finalValue = newValue
    if (options.transform) {
      finalValue = options.transform(finalValue)
    }
    if (options.validate) {
      const result = options.validate(finalValue)
      if (result === false) return
      if (typeof result === 'string') {
        console.error(`Validation error: ${result}`)
        return
      }
    }
    if (value !== finalValue) {
      value = finalValue
      if (module) {
        Effect.runSync(module.emitStateChange(runeId, finalValue, 'user'))
      }
      for (const listener of [...listeners]) listener(value)
    }
  }

  rune.$update = (fn: (current: T) => T) => {
    rune.$set(fn(value))
  }

  rune.$subscribe = (listener: (value: T) => void) => {
    listeners.add(listener)
    listener(value)
    return () => {
      listeners.delete(listener)
    }
  }

  return rune
}

/**
 * Derived value with dependency tracking and cache invalidation.
 */
export function $derived<T>(fn: () => T): DerivedRune<T> {
  let cached: T | undefined
  let hasCache = false
  let computing = false
  const unsubs: Array<() => void> = []
  const derivedListeners = new Set<(value: T) => void>()

  // Assigned right after the rune is created; avoids referencing the binding
  // inside its own initializer (TDZ hazard) while still letting reads of this
  // derived register as a dependency of an enclosing derivation.
  let self: { $subscribe: (l: (v: unknown) => void) => () => void } | null = null

  const recompute = () => {
    if (computing) return
    computing = true
    try {
      for (const u of unsubs) u()
      unsubs.length = 0

      const deps = new Set<{ $subscribe: (l: (v: unknown) => void) => () => void }>()
      pushCollector(deps as any)
      try {
        cached = fn()
        hasCache = true
      } finally {
        popCollector()
      }

      // The immediate callback only primes the `first` flag; real changes
      // arrive later. Notifications iterate a snapshot so a listener that
      // resubscribes during invalidation cannot re-enter the loop.
      for (const dep of deps) {
        let first = true
        unsubs.push(
          dep.$subscribe(() => {
            if (first) {
              first = false
              return
            }
            invalidate()
          })
        )
      }
    } finally {
      computing = false
    }
  }

  const invalidate = () => {
    if (computing) return
    hasCache = false
    const value = rune()
    for (const listener of [...derivedListeners]) listener(value)
  }

  const rune = (() => {
    if (self) trackRead(self)
    if (!hasCache) recompute()
    return cached as T
  }) as DerivedRune<T>
  self = rune as unknown as { $subscribe: (l: (v: unknown) => void) => () => void }

  rune.$type = 'derived' as const
  rune.$subscribe = (listener: (value: T) => void) => {
    derivedListeners.add(listener)
    listener(rune())
    return () => {
      derivedListeners.delete(listener)
    }
  }
  return rune
}

export {
  $effect,
  onMount,
  onDestroy,
  beforeUpdate,
  afterUpdate,
  tick,
  untrack,
} from './jsx-lifecycle'

export function isStateRune<T>(value: any): value is StateRune<T> {
  return !!(value && typeof value === 'function' && value.$type === 'state')
}

export function isBindableRune<T>(value: any): value is BindableRune<T> {
  return !!(
    value &&
    typeof value === 'function' &&
    value.$type === 'bindable' &&
    value.$bindable === true
  )
}

export function isDerivedRune<T>(value: any): value is DerivedRune<T> {
  return !!(value && typeof value === 'function' && value.$type === 'derived')
}

export function isRune<T>(value: any): value is Rune<T> {
  return !!(value && typeof value === 'function' && typeof value.$type === 'string')
}

export function getValue<T>(rune: Rune<T>): T {
  return rune()
}

export function toBindable<T>(
  state: StateRune<T>,
  options: BindableOptions<T> = {}
): BindableRune<T> {
  const bindable = $bindable(state(), options)
  const runeId = `toBindable_${Date.now()}_${Math.random()}`
  const module = getReactivityModule()

  const originalSet = bindable.$set
  bindable.$set = (value: T) => {
    originalSet(value)
    state.$set(value)
    if (module) {
      Effect.runSync(module.emitStateChange(runeId, value, 'sync'))
    }
  }

  state.$subscribe(value => {
    originalSet(value)
    if (module) {
      Effect.runSync(module.emitStateChange(runeId, value, 'sync'))
    }
  })

  return bindable
}
