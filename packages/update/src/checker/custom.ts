/**
 * Custom URL Update Checker
 */

import { Effect } from 'effect'
import type { UpdateChecker, UpdateCheckResult, UpdateCheckerConfig, UpdateError } from '../types'

/**
 * Compare semantic versions
 */
function compareVersions(current: string, latest: string): boolean {
  const parseCurrent = current.replace(/^v/, '').split('.').map(Number)
  const parseLatest = latest.replace(/^v/, '').split('.').map(Number)

  for (let i = 0; i < 3; i++) {
    const c = parseCurrent[i] || 0
    const l = parseLatest[i] || 0
    if (l > c) return true
    if (l < c) return false
  }

  return false
}

/**
 * Check if version is breaking (major version bump)
 */
function isBreakingChange(current: string, latest: string): boolean {
  const currentMajor = parseInt(current.replace(/^v/, '').split('.')[0] || '0')
  const latestMajor = parseInt(latest.replace(/^v/, '').split('.')[0] || '0')
  return latestMajor > currentMajor
}

/**
 * Expected response format from custom URL
 */
interface CustomUpdateResponse {
  version: string
  releaseNotesUrl?: string
  publishedAt?: string
}

/**
 * Custom URL update checker implementation
 */
export class CustomUpdateChecker implements UpdateChecker {
  private cache: UpdateCheckResult | null = null
  private cacheTimestamp: number = 0

  constructor(private config: UpdateCheckerConfig) {
    if (!config.customUrl) {
      throw new Error('customUrl is required for custom update checker')
    }
  }

  check(): Effect.Effect<UpdateCheckResult, UpdateError> {
    return Effect.tryPromise({
      try: async () => {
        // Check cache first
        const now = Date.now()
        const cacheDuration = this.config.cacheDuration || 3600000 // 1 hour default

        if (this.cache && now - this.cacheTimestamp < cacheDuration) {
          return this.cache
        }

        // Fetch from custom URL
        const response = await fetch(this.config.customUrl!)

        if (!response.ok) {
          throw new Error(`Failed to fetch from custom URL: ${response.statusText}`)
        }

        const data: CustomUpdateResponse = await response.json()

        if (!data.version) {
          throw new Error('Version not found in custom update response')
        }

        const latestVersion = data.version.replace(/^v/, '')
        const updateAvailable = compareVersions(this.config.currentVersion, latestVersion)
        const isBreaking = updateAvailable && isBreakingChange(this.config.currentVersion, latestVersion)

        const result: UpdateCheckResult = {
          version: {
            current: this.config.currentVersion,
            latest: latestVersion,
            updateAvailable,
            releaseNotesUrl: data.releaseNotesUrl,
            publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
            isBreaking,
          },
          source: 'custom',
          checkedAt: new Date(),
        }

        // Update cache
        this.cache = result
        this.cacheTimestamp = now

        return result
      },
      catch: (error) =>
        ({
          _tag: 'UpdateError' as const,
          message: `Failed to check custom update URL: ${error}`,
          cause: error,
        }),
    })
  }

  getCached(): Effect.Effect<UpdateCheckResult | null, never> {
    return Effect.succeed(this.cache)
  }
}

/**
 * Create custom update checker
 */
export function createCustomChecker(config: UpdateCheckerConfig): UpdateChecker {
  return new CustomUpdateChecker(config)
}
