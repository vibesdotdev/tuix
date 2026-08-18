/**
 * ScopeFallback Component
 *
 * Renders when a scope is active but none of its child scopes will
 * render. This is where help text typically appears.
 */

import { scopeManager } from '../manager'
import { activeRouteStore } from '../stores/activeRoute.store'
import { jsx } from '@tuix/jsx'
import type { JSX } from '@tuix/jsx'

export interface ScopeFallbackProps {
  scopeId: string
  fallback?: JSX.Element
}

export function ScopeFallback(props: ScopeFallbackProps): JSX.Element {
  const { scopeId, fallback } = props

  // A child of this scope matching the active route means real content
  // renders — the fallback should stay out of the way.
  const anyChildWillRender = scopeManager
    .getAllScopes()
    .some(scope => scope.parentId === scopeId && activeRouteStore.matches(scope.path ?? []))

  if (anyChildWillRender) {
    return jsx('text', { children: '' })
  }

  // No children rendering - show fallback
  if (fallback) {
    return fallback
  }

  // Default fallback is basic help text
  return jsx('text', { children: `Help for scope: ${scopeId}` })
}
