/**
 * JSX to MVU Component Compiler
 *
 * Converts JSX components into proper Component<Model, Msg> instances
 * that can be run by the MVU runtime
 */

import { Effect } from 'effect'
import type { Component, View } from '@tuix/core/types'
import {
  beginModelExtraction,
  endModelExtraction,
  beginViewHydration,
  endViewHydration,
  $state,
} from '@tuix/reactive'
import { render as renderJsx, type JSXNode } from '../jsx-runtime'

/**
 * Convert any JSX component return value into a View with a working render().
 */
export function toView(node: unknown): View {
  if (node == null || typeof node === 'boolean') {
    return {
      render: () => Effect.succeed(''),
      width: 0,
      height: 0,
    }
  }
  if (typeof node === 'object' && node !== null && typeof (node as View).render === 'function') {
    return node as View
  }
  // JSX descriptor / tree → View via jsx-runtime
  return renderJsx(node as JSXNode)
}

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
   * Explicit initial model (highest priority when extractState is true)
   */
  initialModel?: Record<string, unknown>

  /**
   * Alias for initialModel
   */
  model?: Record<string, unknown>

  /**
   * Enable debug output
   */
  debug?: boolean
}

/**
 * Message shape supported by compiled interactive components
 */
export type SetMsg =
  | { type: 'set'; key: string; value: unknown }
  | { type: 'set'; path: string; value: unknown }

/**
 * Parse `const name = $state(literal)` / `let name = $state(literal)` from source.
 * Returns a model object of { name: literal } for number/string/boolean/null literals.
 */
export function extractStateFromSource(source: string): Record<string, unknown> {
  const model: Record<string, unknown> = {}
  // Match: const|let name = $state(...)
  const re = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\$state\s*\(\s*([^)]*?)\s*\)/g

  let match: RegExpExecArray | null
  while ((match = re.exec(source)) !== null) {
    const name = match[1]
    const raw = match[2].trim()
    const value = parseLiteral(raw)
    if (value !== undefined) {
      model[name] = value
    }
  }

  // Bun may rewrite `const count = $state(0)` to `return $state(0)` — capture bare calls
  if (Object.keys(model).length === 0) {
    const bare = /\$state\s*\(\s*([^)]*?)\s*\)/g
    let i = 0
    while ((match = bare.exec(source)) !== null) {
      const value = parseLiteral(match[1].trim())
      if (value !== undefined) {
        model[i === 0 ? 'value' : `value${i}`] = value
        i++
      }
    }
  }

  return model
}

/**
 * Parse a simple JS literal from a string. Returns undefined if not a literal.
 */
function parseLiteral(raw: string): unknown | undefined {
  if (raw === 'true') return true
  if (raw === 'false') return false
  if (raw === 'null') return null
  if (raw === 'undefined') return undefined

  // Number (int/float, optional sign)
  if (/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw)) {
    return Number(raw)
  }

  // Single- or double-quoted string
  if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) {
    try {
      // Normalize to JSON double-quoted
      const asJson = raw.startsWith("'")
        ? `"${raw.slice(1, -1).replace(/\\'/g, "'").replace(/"/g, '\\"')}"`
        : raw
      return JSON.parse(asJson)
    } catch {
      return raw.slice(1, -1)
    }
  }

  // Template literal without interpolation
  if (raw.startsWith('`') && raw.endsWith('`') && !raw.includes('${')) {
    return raw.slice(1, -1)
  }

  return undefined
}

/**
 * Detect if a JSX component is interactive
 *
 * Interactive components have:
 * - Event handlers (onKeyPress, onClick, etc.)
 * - Input components
 * - Subscriptions / $state
 */
export function detectInteractive(jsxComponent: JSXComponent): boolean {
  const fn = jsxComponent as JSXComponent & {
    interactive?: boolean
    name?: string
  }

  // Explicit opt-in always wins (CLI shells may be named *App without being interactive).
  if (fn.interactive === true) return true
  if (fn.interactive === false) return false

  // Name heuristics: Interactive / Game / Editor only.
  // Never match bare *App (TuixApp/MyApp CLI shells) or *Command one-shots.
  if (
    typeof fn.name === 'string' &&
    /Interactive|Game|Editor/i.test(fn.name) &&
    !/Command$/i.test(fn.name)
  ) {
    return true
  }

  try {
    const source = Function.prototype.toString.call(jsxComponent)
    if (
      /\bon(Key|Click|Press|Input|Submit|Change|Mouse)/.test(source) ||
      /\$state\s*\(/.test(source) ||
      /subscriptions\s*[\(=]/.test(source) ||
      /text-input|TextInput|button|checkbox|toggle/i.test(source)
    ) {
      return true
    }
  } catch {
    // ignore toString failures
  }

  return false
}

/**
 * Extract model from JSX component
 *
 * Priority:
 * 1. options.initialModel / options.model
 * 2. component.initialModel / component.__tuixModel / component.__model
 * 3. Invoke with empty props → $model / model field
 * 4. When extractState: parse $state literals from source
 * 5. Empty object
 */
export function extractModel<Model>(
  jsxComponent: JSXComponent,
  options: CompileOptions = {}
): Model {
  if (options.initialModel != null) {
    return options.initialModel as Model
  }
  if (options.model != null) {
    return options.model as Model
  }

  const fn = jsxComponent as JSXComponent & {
    initialModel?: unknown
    __tuixModel?: unknown
    __model?: unknown
  }

  if (fn.initialModel != null) {
    return fn.initialModel as Model
  }
  if (fn.__tuixModel != null) {
    return fn.__tuixModel as Model
  }
  if (fn.__model != null) {
    return fn.__model as Model
  }

  if (options.extractState) {
    // 1) Runtime extraction session — captures $state(init, 'name') / $states({ name: init })
    //    This is the Bun-safe path (const names are stripped from toString).
    try {
      beginModelExtraction()
      let result: unknown
      try {
        if (typeof jsxComponent === 'function') {
          result = jsxComponent({})
        }
      } catch {
        // Component may throw without full runtime; still collect registered states
      }
      const fromSession = endModelExtraction()

      // Prefer named keys from session (exclude pure anonymous value-only if we have better)
      const named = Object.fromEntries(
        Object.entries(fromSession).filter(([k]) => k !== 'value' && !/^value\d+$/.test(k))
      )
      if (Object.keys(named).length > 0) {
        return named as Model
      }

      // StateRune with $key from $state(init, name)
      if (
        typeof result === 'function' &&
        (result as { $type?: string; $key?: string }).$type === 'state'
      ) {
        const key = (result as { $key?: string }).$key
        const val = (result as () => unknown)()
        if (key) return { [key]: val } as Model
      }

      // Explicit $model / model bag on return value
      if (result && typeof result === 'object' && !Array.isArray(result)) {
        if ('$model' in result && (result as { $model: unknown }).$model != null) {
          return (result as { $model: Model }).$model
        }
        if ('model' in result && typeof (result as { model: unknown }).model === 'object') {
          return (result as { model: Model }).model
        }
        // Object of StateRunes: { count: $state(0) }
        const fromRunes: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(result as Record<string, unknown>)) {
          if (typeof v === 'function' && (v as { $type?: string }).$type === 'state') {
            fromRunes[k] = (v as () => unknown)()
          }
        }
        if (Object.keys(fromRunes).length > 0) return fromRunes as Model
      }

      // Source parse when Bun preserves const names (or tests use Function source)
      try {
        const source = Function.prototype.toString.call(jsxComponent)
        const fromSource = extractStateFromSource(source)
        const namedSrc = Object.fromEntries(
          Object.entries(fromSource).filter(([k]) => k !== 'value' && !/^value\d+$/.test(k))
        )
        if (Object.keys(namedSrc).length > 0) return namedSrc as Model
        // Anonymous session / bare return $state(n) → { value: n } last resort
        if (Object.keys(fromSession).length > 0) return fromSession as Model
        if (Object.keys(fromSource).length > 0) return fromSource as Model
      } catch {
        if (Object.keys(fromSession).length > 0) return fromSession as Model
      }
    } catch {
      try {
        endModelExtraction()
      } catch {
        /* ignore */
      }
    }
  }

  // Non-extract path: still honor $model on invoke
  try {
    if (typeof jsxComponent === 'function') {
      const result = jsxComponent({})
      if (result && typeof result === 'object' && !Array.isArray(result)) {
        if ('$model' in result && (result as { $model: unknown }).$model != null) {
          return (result as { $model: Model }).$model
        }
      }
    }
  } catch {
    /* ignore */
  }

  return {} as Model
}

/** Re-export for consumers compiling models with named state */
export { $state }

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
 * const component = compileToComponent(MyApp, {
 *   extractState: true,
 *   interactive: false
 * })
 *
 * // Now can run with MVU runtime
 * await Effect.runPromise(runApp(component))
 * ```
 */
export function compileToComponent<Model = {}, Msg = SetMsg>(
  jsxComponent: JSXComponent,
  options: CompileOptions = {}
): Component<Model, Msg> {
  const isInteractive = options.interactive ?? detectInteractive(jsxComponent)

  // Extract initial model from reactive state / options
  const initialModel = options.extractState
    ? extractModel<Model>(jsxComponent, { ...options, extractState: true })
    : options.initialModel != null
      ? (options.initialModel as Model)
      : options.model != null
        ? (options.model as Model)
        : ({} as Model)

  return {
    init: Effect.succeed([initialModel, []] as const),

    update: (msg: Msg, model: Model) => {
      // Handle set messages for interactive state updates
      if (msg && typeof msg === 'object' && (msg as { type?: string }).type === 'set') {
        const setMsg = msg as SetMsg
        const key =
          'key' in setMsg && setMsg.key != null
            ? setMsg.key
            : 'path' in setMsg
              ? setMsg.path
              : undefined
        if (key != null) {
          const next = { ...(model as Record<string, unknown>), [key]: setMsg.value }
          return Effect.succeed([next as Model, []] as const)
        }
      }
      return Effect.succeed([model, []] as const)
    },

    // View: hydrate named $state from model, invoke JSX, convert → View
    view: async (model: Model) => {
      const record =
        model && typeof model === 'object' && !Array.isArray(model)
          ? (model as Record<string, unknown>)
          : {}
      beginViewHydration(record)
      try {
        const result = await jsxComponent(model as any)
        return toView(result)
      } finally {
        endViewHydration()
      }
    },

    // Interactive components expose a subscriptions function (empty by default)
    subscriptions: isInteractive
      ? (_model: Model) => [] as ReadonlyArray<Effect.Effect<Msg, never, never>>
      : undefined,
  } as Component<Model, Msg>
}

/**
 * Simplified compiler for basic JSX components
 * Creates a stateless component that just renders
 */
export function createStatelessComponent(jsxComponent: JSXComponent): Component<{}, never> {
  return {
    init: Effect.succeed([{}, []] as const),
    update: (_msg: never, model: {}) => Effect.succeed([model, []] as const),
    view: async (_model: {}) => toView(await jsxComponent()),
  }
}
