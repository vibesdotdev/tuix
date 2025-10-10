/**
 * Reactive Runtime Hooks
 *
 * Integrates Svelte 5 runes with the MVU runtime via hooks
 */

import { Effect } from 'effect'
import type { RuntimeHooks } from '@tuix/runtime'
import { $state, $effect, type StateRune } from '../runes/runes'

/**
 * Reactive context for managing state sync with MVU model
 */
export class ReactiveContext<Model = any, Msg = any> {
  private modelState: StateRune<Model> | null = null
  private effectCleanups: Array<() => void> = []
  private pendingEffects: Array<() => void> = []

  /**
   * Initialize reactive state from model
   */
  initFromModel(model: Model): void {
    this.modelState = $state(model)
  }

  /**
   * Get current reactive state
   */
  getState(): Model | null {
    return this.modelState ? this.modelState() : null
  }

  /**
   * Update reactive state from model
   */
  syncFromModel(model: Model): void {
    if (this.modelState) {
      this.modelState.$set(model)
    }
  }

  /**
   * Register an effect to run after updates
   */
  registerEffect(fn: () => void | (() => void)): void {
    this.pendingEffects.push(fn)
  }

  /**
   * Run all pending effects
   */
  runEffects(): void {
    // Clean up previous effects
    this.effectCleanups.forEach(cleanup => cleanup())
    this.effectCleanups = []

    // Run new effects and collect cleanups
    for (const effectFn of this.pendingEffects) {
      const cleanup = effectFn()
      if (cleanup) {
        this.effectCleanups.push(cleanup)
      }
    }

    this.pendingEffects = []
  }

  /**
   * Cleanup all effects
   */
  cleanup(): void {
    this.effectCleanups.forEach(cleanup => cleanup())
    this.effectCleanups = []
    this.pendingEffects = []
  }
}

/**
 * Create runtime hooks for reactive integration
 *
 * @example
 * ```typescript
 * const context = new ReactiveContext()
 * const hooks = createReactiveHooks(context)
 *
 * await Effect.runPromise(
 *   runApp(component, { hooks })
 * )
 * ```
 */
export function createReactiveHooks<Model, Msg>(
  context?: ReactiveContext<Model, Msg>
): RuntimeHooks<Model, Msg> {
  const ctx = context || new ReactiveContext<Model, Msg>()

  return {
    // Initialize reactive state when component initializes
    afterInit: (model: Model) =>
      Effect.sync(() => {
        ctx.initFromModel(model)
      }),

    // Sync reactive state after every update
    afterUpdate: (oldModel: Model, newModel: Model, msg: Msg) =>
      Effect.sync(() => {
        ctx.syncFromModel(newModel)
        // Run effects after state update
        ctx.runEffects()
      }),

    // Cleanup effects on shutdown
    onShutdown: () =>
      Effect.sync(() => {
        ctx.cleanup()
      }),
  }
}

/**
 * Global reactive context for default usage
 */
let globalReactiveContext: ReactiveContext | null = null

/**
 * Get or create the global reactive context
 */
export function getGlobalReactiveContext<Model = any, Msg = any>(): ReactiveContext<Model, Msg> {
  if (!globalReactiveContext) {
    globalReactiveContext = new ReactiveContext()
  }
  return globalReactiveContext as ReactiveContext<Model, Msg>
}

/**
 * Create default reactive hooks using global context
 *
 * @example
 * ```typescript
 * const hooks = createDefaultReactiveHooks()
 *
 * await Effect.runPromise(
 *   runApp(component, { hooks })
 * )
 * ```
 */
export function createDefaultReactiveHooks<Model, Msg>(): RuntimeHooks<Model, Msg> {
  return createReactiveHooks(getGlobalReactiveContext())
}

/**
 * Hook to access reactive state in components
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const count = useReactiveState<Model>()
 *   return count ? count.value : 0
 * }
 * ```
 */
export function useReactiveState<Model>(): StateRune<Model> | null {
  const context = getGlobalReactiveContext<Model, any>()
  return context.getState() ? $state(context.getState()!) : null
}

/**
 * Enhanced $effect that integrates with runtime hooks
 *
 * @example
 * ```typescript
 * const count = $state(0)
 *
 * $runtimeEffect(() => {
 *   console.log('Count changed:', count())
 *   return () => console.log('Cleanup')
 * })
 * ```
 */
export function $runtimeEffect(fn: () => void | (() => void)): void {
  const context = getGlobalReactiveContext()
  context.registerEffect(fn)
}
