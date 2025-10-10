/**
 * GitHub Releases Update Checker
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
 * GitHub update checker implementation
 */
export class GitHubUpdateChecker implements UpdateChecker {
  private cache: UpdateCheckResult | null = null
  private cacheTimestamp: number = 0

  constructor(private config: UpdateCheckerConfig) {
    if (!config.githubRepo) {
      throw new Error('githubRepo is required for GitHub update checker')
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

        // Fetch from GitHub API
        const apiUrl = `https://api.github.com/repos/${this.config.githubRepo}/releases/latest`
        const response = await fetch(apiUrl, {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'TUIX-Update-Checker',
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch from GitHub API: ${response.statusText}`)
        }

        const data = await response.json()
        const latestVersion = data.tag_name?.replace(/^v/, '') || data.name

        if (!latestVersion) {
          throw new Error('Latest version not found in GitHub release response')
        }

        const updateAvailable = compareVersions(this.config.currentVersion, latestVersion)
        const isBreaking = updateAvailable && isBreakingChange(this.config.currentVersion, latestVersion)

        const result: UpdateCheckResult = {
          version: {
            current: this.config.currentVersion,
            latest: latestVersion,
            updateAvailable,
            releaseNotesUrl: data.html_url,
            publishedAt: data.published_at ? new Date(data.published_at) : undefined,
            isBreaking,
          },
          source: 'github',
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
          message: `Failed to check GitHub releases: ${error}`,
          cause: error,
        }),
    })
  }

  getCached(): Effect.Effect<UpdateCheckResult | null, never> {
    return Effect.succeed(this.cache)
  }
}

/**
 * Create GitHub update checker
 */
export function createGitHubChecker(config: UpdateCheckerConfig): UpdateChecker {
  return new GitHubUpdateChecker(config)
}
