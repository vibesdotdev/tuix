/**
 * Fallback Component
 *
 * Renders when no command matches the route.
 * If not provided, auto-generated help is shown instead.
 */

import { scopeManager } from '../scope/manager'
import { text } from '@tuix/view'

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
  scopeManager.setFallback({
    component,
    metadata: metadata || {},
  })

  // Return empty text - this is declarative, not rendered directly
  return text('')
}
