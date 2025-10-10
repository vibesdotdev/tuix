/**
 * ScopeProvider Component
 *
 * Internal component that provides scope context to children.
 * This allows children to know their parent scope even though they're evaluated first.
 */

import type { JSX } from '@tuix/jsx'
import { currentScopeStore } from '../stores'
import type { ScopeDef } from '../types'

export interface ScopeProviderProps {
  scope: ScopeDef
  children?: JSX.Element | JSX.Element[]
}

/**
 * ScopeProvider sets a scope as current before rendering children
 * This allows children evaluated during JSX transformation to see the parent scope
 */
export function ScopeProvider(props: ScopeProviderProps): JSX.Element {
  const { scope, children } = props

  // Set this scope as current BEFORE children are evaluated
  const previousScope = currentScopeStore.get()
  currentScopeStore.set(scope)

  if (process.env.DEBUG_SCOPE) {
    console.log(`[ScopeProvider] Set scope to ${scope.name}, previous was ${previousScope?.name || 'null'}`)
  }

  // Render children (they will now see this scope as current)
  const result = children ? <>{children}</> : <text></text>

  // Restore previous scope
  currentScopeStore.set(previousScope)
  if (process.env.DEBUG_SCOPE) {
    console.log(`[ScopeProvider] Restored scope to ${previousScope?.name || 'null'}`)
  }

  return result
}
