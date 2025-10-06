/**
 * Scoped Component
 *
 * Wrapper that only renders children if within an active scope
 */

import { currentScopeStore } from '@tuix/reactive/scope/jsx/stores'
import { scopeManager } from '@tuix/reactive/scope/manager'
import type { JSX } from '@tuix/jsx'

export interface ScopedProps {
  children?: JSX.Element | JSX.Element[]
}

export function Scoped(props: ScopedProps): JSX.Element | null {
  const currentScope = currentScopeStore.get()

  if (!currentScope) {
    return null
  }

  const isActive = scopeManager.isScopeActive(currentScope.id)

  if (!isActive) {
    return null
  }

  return <>{props.children}</>
}
