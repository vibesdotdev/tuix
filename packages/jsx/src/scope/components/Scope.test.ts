/**
 * Scope component lifecycle regression tests.
 *
 * The onMount cleanup in Scope.tsx referenced an undeclared
 * `previousScope`, throwing a ReferenceError on unmount.
 */
import { describe, expect, test } from 'bun:test'
import { initComponent, cleanupComponent } from '@tuix/reactive/jsx-lifecycle'
import { Scope } from './Scope'
import { scopeManager } from '../manager'
import { currentScopeStore } from '../stores'
import type { ScopeDef } from '../types'

describe('Scope component lifecycle', () => {
  test('onMount cleanup restores the previous scope without throwing', () => {
    scopeManager.clear()

    const previousDef: ScopeDef = {
      id: 'previous-scope',
      path: ['previous-scope'],
      type: 'command',
      name: 'previous-scope',
      executable: true,
      metadata: {},
      children: [],
    }
    currentScopeStore.register(previousDef)

    const component = initComponent()
    try {
      Scope({ type: 'command', name: 'lifecycle-cleanup-test' })
    } finally {
      cleanupComponent(component)
    }

    // While mounted, the new scope is current
    expect(currentScopeStore.get()?.id).not.toBe('previous-scope')

    const cleanups = component.mountCallbacks
      .map(fn => fn())
      .filter((c): c is () => void => typeof c === 'function')
    expect(cleanups.length).toBeGreaterThan(0)

    for (const cleanup of cleanups) {
      expect(() => cleanup()).not.toThrow()
    }

    // Cleanup restored the previous scope
    expect(currentScopeStore.get()?.id).toBe('previous-scope')
  })
})
