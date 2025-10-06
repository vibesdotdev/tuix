/**
 * @tuix/jsx - JSX Runtime for Terminal UIs
 *
 * Main exports for the JSX runtime system.
 *
 * @module jsx
 */

export * from './jsx-runtime'
export * from './events'

// Re-export core types that are used in JSX context
export { Effect } from 'effect'
export type {
  ComponentContextValue,
  ComponentContextRef,
  TerminalError,
  WindowSize,
  TerminalCapabilities
} from '@tuix/core'
