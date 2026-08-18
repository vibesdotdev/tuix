/**
 * JSX app run types.
 *
 * The runnable `runApp` lives in `../compiler` (argv routing, scope
 * registration, interactive detection, MVU hand-off). This module keeps
 * only the shared types.
 */

/**
 * JSX Component - a simple function that returns a View
 */
export type JSXComponent = () => any

/**
 * Configuration for JSX app
 */
export interface JSXRunConfig {
  /** Enable debug output */
  debug?: boolean
  /** Keep app running (don't auto-exit after render) */
  interactive?: boolean
}
