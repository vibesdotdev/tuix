/**
 * Scope hooks smoke tests
 */

import { test, expect, describe } from 'bun:test'
import { useScope } from './use-scope'
import { scopeManager } from '../manager'

describe('Scope JSX Hooks', () => {
  test('exports useScope', () => {
    expect(typeof useScope).toBe('function')
  })

  test('scopeManager is available', () => {
    expect(scopeManager).toBeDefined()
    expect(typeof scopeManager.clear).toBe('function')
  })

  test('clear does not throw', () => {
    scopeManager.clear()
    expect(true).toBe(true)
  })
})
