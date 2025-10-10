/**
 * Custom Update Checker Tests
 */

import { test, expect, describe } from 'bun:test'
import { Effect } from 'effect'
import { createCustomChecker } from './custom'

describe('Custom Update Checker', () => {
  test('should create custom checker', () => {
    const checker = createCustomChecker({
      customUrl: 'https://example.com/version.json',
      currentVersion: '1.0.0',
    })

    expect(checker).toBeDefined()
  })

  test('should throw error without customUrl', () => {
    expect(() =>
      createCustomChecker({
        currentVersion: '1.0.0',
      })
    ).toThrow('customUrl is required')
  })

  test('should cache results', async () => {
    const checker = createCustomChecker({
      customUrl: 'https://example.com/version.json',
      currentVersion: '1.0.0',
      cacheDuration: 10000,
    })

    const cached = await Effect.runPromise(checker.getCached())
    expect(cached).toBeNull()
  })
})
