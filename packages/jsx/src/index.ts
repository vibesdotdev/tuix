/**
 * @tuix/jsx - JSX Runtime for Terminal UIs
 *
 * Main exports for the JSX runtime system.
 *
 * @module jsx
 */

export * from './jsx-runtime'
export * from './events'

// New: JSX Compiler - compiles JSX to MVU Components
export * from './compiler'

// Parser (merged from @tuix/parser)
export * from './parser'

// App components - Re-exported from app/index.ts to maintain single source of truth
export * from './app'

// Re-export scope components for convenience
export {
  Scope,
  ScopeContent,
  ScopeFallback,
  type ScopeProps,
  type ScopeContentProps,
  type ScopeFallbackProps,
} from './scope/components'

// Re-export core types that are used in JSX context
export { Effect } from 'effect'
export type {
  ComponentContextValue,
  ComponentContextRef,
  TerminalError,
  WindowSize,
  TerminalCapabilities
} from '@tuix/core'
