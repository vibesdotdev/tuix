/**
 * NPM Registry Update Checker
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
 * NPM update checker implementation
 */
export class NpmUpdateChecker implements UpdateChecker {
  private cache: UpdateCheckResult | null = null
  private cacheTimestamp: number = 0

  constructor(private config: UpdateCheckerConfig) {
    if (!config.packageName) {
      throw new Error('packageName is required for NPM update checker')
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

        // Fetch from npm registry
        const registryUrl = `https://registry.npmjs.org/${this.config.packageName}`
        const response = await fetch(registryUrl)

        if (!response.ok) {
          throw new Error(`Failed to fetch from npm registry: ${response.statusText}`)
        }

        const data = await response.json()
        const latestVersion = data['dist-tags']?.latest

        if (!latestVersion) {
          throw new Error('Latest version not found in npm registry response')
        }

        const updateAvailable = compareVersions(this.config.currentVersion, latestVersion)
        const isBreaking = updateAvailable && isBreakingChange(this.config.currentVersion, latestVersion)

        const result: UpdateCheckResult = {
          version: {
            current: this.config.currentVersion,
            latest: latestVersion,
            updateAvailable,
            releaseNotesUrl: `https://www.npmjs.com/package/${this.config.packageName}`,
            publishedAt: data.time?.[latestVersion] ? new Date(data.time[latestVersion]) : undefined,
            isBreaking,
          },
          source: 'npm',
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
          message: `Failed to check npm registry: ${error}`,
          cause: error,
        }),
    })
  }

  getCached(): Effect.Effect<UpdateCheckResult | null, never> {
    return Effect.succeed(this.cache)
  }
}

/**
 * Create npm update checker
 */
export function createNpmChecker(config: UpdateCheckerConfig): UpdateChecker {
  return new NpmUpdateChecker(config)
}
