/**
 * Fallback Component
 *
 * Renders when no command matches the route.
 * If not provided, auto-generated help is shown instead.
 */

export interface FallbackProps {
  /**
   * Component to render when no command matches
   */
  component: () => JSX.Element

  /**
   * Optional metadata
   */
  metadata?: Record<string, unknown>
}

/**
 * Fallback component - renders when no command matches
 *
 * @example
 * ```tsx
 * <Fallback component={WelcomeScreen} />
 * ```
 */
export function Fallback({ component, metadata }: FallbackProps): JSX.Element {
  // Register this as the fallback in scope manager
  const { scopeManager } = require('../scope/manager')
  const { text } = require('@tuix/view')

  scopeManager.setFallback({
    component,
    metadata: metadata || {},
  })

  // Return empty text - this is declarative, not rendered directly
  return text('')
}
