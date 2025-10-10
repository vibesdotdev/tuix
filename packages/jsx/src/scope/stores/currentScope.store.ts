/**
 * Current scope store - tracks last registered scope for parent-child linking
 */

import { $state, type StateRune } from '@tuix/reactive/runes'
import type { ScopeDef } from '../types'

class CurrentScopeStore {
  private lastScope: ScopeDef | null = null
  private registrationOrder: ScopeDef[] = []

  /**
   * Record a scope registration
   * Only set as lastScope if it's executable, has no parent, and has no children
   */
  register(scope: ScopeDef): void {
    this.registrationOrder.push(scope)

    // Only make this the "child" if it's executable, has no parent, and has no children
    // (scopes with children are parents, not children)
    if (scope.executable && !scope.metadata._parentScopeId && !scope.metadata._hasChildren) {
      this.lastScope = scope
    }
  }

  /**
   * Get child scope (last registered, since children evaluate first in JSX)
   * Returns undefined after the child has been claimed by a parent
   */
  getChild(): ScopeDef | undefined {
    return this.lastScope || undefined
  }

  /**
   * Clear the current child (called after linking to parent)
   */
  clearChild(): void {
    this.lastScope = null
  }

  /**
   * Get all registered scopes in order (children first, then parents)
   */
  getRegistrationOrder(): ScopeDef[] {
    return [...this.registrationOrder]
  }

  /**
   * Get children of a scope (scopes registered before it)
   */
  getChildren(scope: ScopeDef): ScopeDef[] {
    const index = this.registrationOrder.indexOf(scope)
    if (index === -1) return []
    return this.registrationOrder.slice(0, index)
  }

  /**
   * Legacy get() - returns child (last registered)
   */
  get(): ScopeDef | null {
    return this.lastScope
  }

  /**
   * Legacy set() - registers scope
   */
  set(scope: ScopeDef | null): void {
    if (scope) {
      this.register(scope)
    }
  }
}

// Export singleton instance
export const currentScopeStore = new CurrentScopeStore()

/**
 * Helper to get current scope in components
 */
export function useCurrentScope(): ScopeDef | null {
  return currentScopeStore.get()
}
