/**
 * GitHub Update Checker Tests
 */

import { test, expect, describe } from 'bun:test'
import { Effect } from 'effect'
import { createGitHubChecker } from './github'

describe('GitHub Update Checker', () => {
  test('should create github checker', () => {
    const checker = createGitHubChecker({
      githubRepo: 'owner/repo',
      currentVersion: '1.0.0',
    })

    expect(checker).toBeDefined()
  })

  test('should throw error without githubRepo', () => {
    expect(() =>
      createGitHubChecker({
        currentVersion: '1.0.0',
      })
    ).toThrow('githubRepo is required')
  })

  test('should cache results', async () => {
    const checker = createGitHubChecker({
      githubRepo: 'owner/repo',
      currentVersion: '1.0.0',
      cacheDuration: 10000,
    })

    const cached = await Effect.runPromise(checker.getCached())
    expect(cached).toBeNull()
  })
})
