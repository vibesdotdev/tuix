/**
 * Core Component Context
 *
 * Provides context for components to access MVU model and dispatch.
 * This is a core abstraction used by both JSX and CLI modules.
 */

import { Context, FiberRef, Effect } from 'effect'

/**
 * Component context that provides access to MVU model and dispatch
 */
export interface ComponentContextValue<Model = unknown, Msg = unknown> {
  /**
   * Get the current model value
   */
  readonly model: () => Model

  /**
   * Dispatch a message to the update function
   */
  readonly dispatch: (msg: Msg) => void

  /**
   * Component ID for tracking
   */
  readonly componentId?: string
}

/**
 * Create the component context tag
 */
export const ComponentContext = Context.Tag<ComponentContextValue>('@tuix/core/ComponentContext')

/**
 * FiberRef for component context
 */
export const ComponentContextRef = FiberRef.unsafeMake<ComponentContextValue<
  unknown,
  unknown
> | null>(null)

/**
 * Hook to access component context
 * This allows components to access the current model and dispatch
 */
export const useComponentContext = <Model, Msg>() =>
  Effect.map(FiberRef.get(ComponentContextRef), (context): ComponentContextValue<Model, Msg> => {
    if (!context) {
      throw new Error(
        "Component context not available. Make sure you're using this inside a component rendered with MVU config."
      )
    }
    return context as ComponentContextValue<Model, Msg>
  })

/**
 * Provider to set component context
 */
export function withComponentContext<R, E, A, Model, Msg>(
  context: ComponentContextValue<Model, Msg>,
  effect: Effect.Effect<A, E, R>
): Effect.Effect<A, E, R> {
  return Effect.locally(
    ComponentContextRef,
    context as ComponentContextValue<unknown, unknown>
  )(effect)
}
