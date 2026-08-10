/**
 * Global Reactive State
 *
 * Svelte-style global state for execution context and app-wide data.
 * Import and use directly in any component - changes trigger re-renders automatically.
 *
 * @example
 * ```tsx
 * import { context, app } from '@tuix/reactive/state'
 *
 * export function MyCommand() {
 *   const key = context.arg(0)
 *   const verbose = context.flag('verbose', false)
 *
 *   return <text>Key: {key}</text>
 * }
 * ```
 */

import { $state, $derived } from '@tuix/reactive/runes/runes'

/**
 * Lightweight scope shape to avoid reactive -> jsx coupling.
 */
export interface ScopeDef {
  id: string
  type: string
  name: string
  path: string[]
  executable?: boolean
  description?: string
  metadata?: Record<string, unknown>
  children?: ScopeDef[]
}

/**
 * Current execution context
 *
 * Contains everything about the active command being executed:
 * - Command path (scope)
 * - Arguments and flags
 * - Arbitrary context data
 */
export const context = {
  /**
   * Current command path (e.g., ["config", "get"])
   */
  scope: $state<string[]>([]),

  /**
   * Positional arguments passed to the command
   */
  args: $state<string[]>([]),

  /**
   * Parsed flags from command line
   * Values can be string, boolean, or number
   */
  flags: $state<Record<string, string | boolean | number>>({}),

  /**
   * Helper: get positional arg by index
   *
   * @example
   * ```tsx
   * const filename = context.arg(0) // First positional arg
   * ```
   */
  arg: (index: number): string | undefined => context.args()[index],

  /**
   * Helper: get flag value with optional default
   *
   * @example
   * ```tsx
   * const format = context.flag('format', 'json')
   * const verbose = context.flag<boolean>('verbose', false)
   * ```
   */
  flag: <T = any>(name: string, defaultValue?: T): T =>
    (context.flags()[name] as T) ?? defaultValue,

  /**
   * Whether --help or -h was passed
   */
  helpRequested: $state(false),

  /**
   * Arbitrary context data storage
   * Use for sharing state between commands or storing session data
   */
  data: $state<Record<string, unknown>>({}),

  /**
   * Get value from context data
   *
   * @example
   * ```tsx
   * const theme = context.get('theme', 'dark')
   * ```
   */
  get: <T = any>(key: string, defaultValue?: T): T => (context.data()[key] as T) ?? defaultValue,

  /**
   * Set value in context data
   *
   * @example
   * ```tsx
   * context.set('theme', 'light')
   * context.set('user', { name: 'Alice', id: 123 })
   * ```
   */
  set: (key: string, value: unknown): void => {
    const d = context.data()
    context.data.$set({ ...d, [key]: value })
  },

  /**
   * Clear all context data
   */
  clear: (): void => {
    context.data.$set({})
  },
}

/**
 * Application-wide scope registry
 *
 * Provides access to all registered scopes (commands, plugins, etc.)
 * and utilities for querying the scope tree.
 */
export const app = {
  /**
   * All registered scopes indexed by ID
   */
  scopes: $state(new Map<string, ScopeDef>()),

  /**
   * Check if a scope exists by ID
   *
   * @example
   * ```tsx
   * if (app.hasScope('config-get-cmd')) {
   *   // ...
   * }
   * ```
   */
  hasScope: (id: string): boolean => app.scopes().has(id),

  /**
   * Get scope definition by ID
   *
   * @example
   * ```tsx
   * const configScope = app.getScope('config-plugin')
   * ```
   */
  getScope: (id: string): ScopeDef | undefined => app.scopes().get(id),

  /**
   * Find scope by path
   *
   * @example
   * ```tsx
   * const getCmd = app.findScope(['config', 'get'])
   * ```
   */
  findScope: (path: string[]): ScopeDef | undefined => {
    const pathStr = path.join('/')
    return Array.from(app.scopes().values()).find(s => s.path.join('/') === pathStr)
  },

  /**
   * All root-level scopes (path length === 1)
   * Derived - automatically updates when scopes change
   */
  rootScopes: $derived(() => Array.from(app.scopes().values()).filter(s => s.path.length === 1)),

  /**
   * All executable scopes (commands and plugins)
   * Derived - automatically updates when scopes change
   */
  commands: $derived(() => Array.from(app.scopes().values()).filter(s => s.executable)),

  /**
   * Get all child scopes of a given scope
   *
   * @example
   * ```tsx
   * const configChildren = app.getChildren(['config'])
   * // Returns: [{ path: ['config', 'get'], ... }, { path: ['config', 'set'], ... }]
   * ```
   */
  getChildren: (scopePath: string[]): ScopeDef[] => {
    const pathStr = scopePath.join('/')
    return Array.from(app.scopes().values()).filter(s => {
      if (s.path.length !== scopePath.length + 1) return false
      return s.path.slice(0, -1).join('/') === pathStr
    })
  },
}
