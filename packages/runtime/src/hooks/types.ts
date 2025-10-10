/**
 * Runtime Hooks System
 *
 * Provides integration points for reactivity, JSX compilation, and custom behaviors
 */

import { Effect } from 'effect'
import type { View } from '@tuix/core/types'

/**
 * Runtime hooks for lifecycle integration
 *
 * Hooks allow external systems (reactivity, JSX, plugins) to integrate
 * with the MVU runtime at specific lifecycle points.
 *
 * @example
 * ```typescript
 * const hooks: RuntimeHooks<Model, Msg> = {
 *   afterUpdate: (oldModel, newModel, msg) =>
 *     Effect.sync(() => {
 *       console.log('Model updated:', { oldModel, newModel, msg })
 *     }),
 *   beforeRender: (model) =>
 *     Effect.sync(() => {
 *       // Sync reactive state before render
 *       syncReactiveState(model)
 *     })
 * }
 * ```
 */
export interface RuntimeHooks<Model = any, Msg = any> {
  /**
   * Called before component initialization
   * Use: Setup reactive scopes, initialize context
   */
  beforeInit?: () => Effect.Effect<void>

  /**
   * Called after component initialization
   * Use: Store initial model in reactive state
   */
  afterInit?: (model: Model) => Effect.Effect<void>

  /**
   * Called before processing an update
   * Use: Intercept messages, add logging
   */
  beforeUpdate?: (msg: Msg, model: Model) => Effect.Effect<void>

  /**
   * Called after processing an update
   * Use: Sync reactive state, trigger $effect runs
   */
  afterUpdate?: (oldModel: Model, newModel: Model, msg: Msg) => Effect.Effect<void>

  /**
   * Called before rendering
   * Use: Prepare reactive state for render
   */
  beforeRender?: (model: Model) => Effect.Effect<void>

  /**
   * Called after rendering
   * Use: Track render performance, cleanup
   */
  afterRender?: (view: View, model: Model) => Effect.Effect<void>

  /**
   * Called when a command is executed
   * Use: Track commands, add telemetry
   */
  onCommand?: (cmd: Effect.Effect<Msg | null>) => Effect.Effect<void>

  /**
   * Called when a subscription is registered
   * Use: Track subscriptions, add debugging
   */
  onSubscription?: (sub: Effect.Effect<Msg>) => Effect.Effect<void>

  /**
   * Called when a message is queued
   * Use: Transform messages, filter, log
   * Return null to cancel the message
   */
  onMessage?: (msg: Msg) => Effect.Effect<Msg | null>

  /**
   * Called on runtime error
   * Use: Error reporting, recovery
   */
  onError?: (error: unknown, context: string) => Effect.Effect<void>

  /**
   * Called on runtime shutdown
   * Use: Cleanup reactive scopes, save state
   */
  onShutdown?: () => Effect.Effect<void>
}

/**
 * Helper to create hooks with type inference
 */
export const createHooks = <Model, Msg>(
  hooks: RuntimeHooks<Model, Msg>
): RuntimeHooks<Model, Msg> => hooks

/**
 * Helper to compose multiple hooks
 */
export const composeHooks = <Model, Msg>(
  ...hookSets: Array<RuntimeHooks<Model, Msg>>
): RuntimeHooks<Model, Msg> => {
  const composed: RuntimeHooks<Model, Msg> = {}

  for (const key of [
    'beforeInit',
    'afterInit',
    'beforeUpdate',
    'afterUpdate',
    'beforeRender',
    'afterRender',
    'onCommand',
    'onSubscription',
    'onMessage',
    'onError',
    'onShutdown',
  ] as const) {
    const hooks = hookSets
      .map(set => set[key])
      .filter((hook): hook is NonNullable<typeof hook> => hook != null)

    if (hooks.length === 0) continue

    if (key === 'onMessage') {
      // Special handling for onMessage which can return null
      composed[key] = (msg: Msg) =>
        hooks.reduce(
          (effect, hook) =>
            effect.pipe(
              Effect.flatMap(m => (m === null ? Effect.succeed(null) : hook(m)))
            ),
          Effect.succeed(msg)
        )
    } else {
      // For all other hooks, run sequentially
      composed[key] = ((...args: any[]) =>
        Effect.all(hooks.map(hook => (hook as any)(...args))).pipe(
          Effect.map(() => undefined)
        )) as any
    }
  }

  return composed
}
