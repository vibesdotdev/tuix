/**
 * NPM Update Checker Tests
 */

import { test, expect, describe } from 'bun:test'
import { Effect } from 'effect'
import { createNpmChecker } from './npm'

describe('NPM Update Checker', () => {
  test('should create npm checker', () => {
    const checker = createNpmChecker({
      packageName: '@tuix/core',
      currentVersion: '1.0.0',
    })

    expect(checker).toBeDefined()
  })

  test('should throw error without packageName', () => {
    expect(() =>
      createNpmChecker({
        currentVersion: '1.0.0',
      })
    ).toThrow('packageName is required')
  })

  test('should cache results', async () => {
    const checker = createNpmChecker({
      packageName: '@tuix/core',
      currentVersion: '1.0.0',
      cacheDuration: 10000,
    })

    const cached = await Effect.runPromise(checker.getCached())
    expect(cached).toBeNull()
  })
})
