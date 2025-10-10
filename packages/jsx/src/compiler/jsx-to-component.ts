/**
 * JSX to MVU Component Compiler
 *
 * Converts JSX components into proper Component<Model, Msg> instances
 * that can be run by the MVU runtime
 */

import { Effect } from 'effect'
import type { Component } from '@tuix/core/types'

/**
 * JSX Component - a function that returns a renderable view
 * Can be async - runtime will handle it automatically
 */
export type JSXComponent<Props = {}> = (props?: Props) => any | Promise<any>

/**
 * Compiled component with extracted model
 */
export interface CompiledComponent<Model = any, Msg = any> {
  component: Component<Model, Msg>
  initialModel: Model
}

/**
 * Options for JSX compilation
 */
export interface CompileOptions {
  /**
   * Extract reactive state as model
   * When true, scans for $state runes and uses them as model
   */
  extractState?: boolean

  /**
   * Is this an interactive component?
   * Auto-detected if not specified
   */
  interactive?: boolean

  /**
   * Enable debug output
   */
  debug?: boolean
}

/**
 * Detect if a JSX component is interactive
 *
 * Interactive components have:
 * - Event handlers (onKeyPress, onClick, etc.)
 * - Input components
 * - Subscriptions
 *
 * Non-interactive (CLI) components just render once and exit
 */
export function detectInteractive(jsxComponent: JSXComponent): boolean {
  // For now, assume non-interactive (CLI commands) by default
  // In a real implementation, we'd analyze the JSX tree for:
  // - Event handler props (onKeyPress, onClick, etc.)
  // - <Input>, <TextInput>, <Select> components
  // - subscriptions() method

  // This is a placeholder - actual implementation would need AST analysis
  // or runtime inspection of the rendered component tree

  return false
}

/**
 * Extract model from JSX component
 *
 * Looks for reactive state ($state runes) and builds initial model
 */
export function extractModel<Model>(
  jsxComponent: JSXComponent,
  options: CompileOptions
): Model {
  // For now, return empty model
  // In a full implementation, this would:
  // 1. Scan the component source for $state() calls
  // 2. Extract their initial values
  // 3. Build a model object

  // Placeholder: return empty object as model
  return {} as Model
}

/**
 * Compile JSX component to MVU Component
 *
 * @example
 * ```tsx
 * function MyApp() {
 *   const count = $state(0)
 *   return <text>Count: {count()}</text>
 * }
 *
 * const { component, initialModel } = compileToComponent(MyApp, {
 *   extractState: true,
 *   interactive: false
 * })
 *
 * // Now can run with MVU runtime
 * await Effect.runPromise(runApp(component))
 * ```
 */
export function compileToComponent<Model = {}, Msg = never>(
  jsxComponent: JSXComponent,
  options: CompileOptions = {}
): Component<Model, Msg> {
  const isInteractive = options.interactive ?? detectInteractive(jsxComponent)

  // Extract initial model from reactive state if requested
  const initialModel = options.extractState
    ? extractModel<Model>(jsxComponent, options)
    : ({} as Model)

  return {
    // Initialize with empty model (or extracted model in future)
    init: Effect.succeed([initialModel, []] as const),

    // Update does nothing for stateless JSX components
    // In future, this would handle messages from interactive components
    update: (msg: Msg, model: Model) =>
      Effect.succeed([model, []] as const),

    // View renders the JSX component (can be async)
    view: async (model: Model) => {
      const result = await jsxComponent()
      return result
    },

    // No subscriptions for non-interactive components
    subscriptions: isInteractive
      ? (model: Model) => {
          // In future, extract subscriptions from component
          return undefined
        }
      : undefined,
  }
}

/**
 * Simplified compiler for basic JSX components
 * Creates a stateless component that just renders
 */
export function createStatelessComponent(
  jsxComponent: JSXComponent
): Component<{}, never> {
  return {
    init: Effect.succeed([{}, []] as const),
    update: (msg: never, model: {}) => Effect.succeed([model, []] as const),
    view: (model: {}) => jsxComponent(),
  }
}
