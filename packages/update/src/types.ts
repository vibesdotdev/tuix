/**
 * Update System Types
 */

import { Effect } from 'effect'

/**
 * Version information
 */
export interface VersionInfo {
  /** Current version */
  current: string
  /** Latest available version */
  latest: string
  /** Is update available */
  updateAvailable: boolean
  /** Release notes URL */
  releaseNotesUrl?: string
  /** Published date */
  publishedAt?: Date
  /** Is breaking change */
  isBreaking?: boolean
}

/**
 * Update check result
 */
export interface UpdateCheckResult {
  /** Version information */
  version: VersionInfo
  /** Update source */
  source: 'npm' | 'github' | 'custom'
  /** Check timestamp */
  checkedAt: Date
}

/**
 * Update checker configuration
 */
export interface UpdateCheckerConfig {
  /** Package name (for npm) */
  packageName?: string
  /** GitHub repo (owner/repo) */
  githubRepo?: string
  /** Custom update URL */
  customUrl?: string
  /** Current version */
  currentVersion: string
  /** Check interval in ms (default: 1 hour) */
  checkInterval?: number
  /** Cache duration in ms (default: 1 hour) */
  cacheDuration?: number
}

/**
 * Update checker interface
 */
export interface UpdateChecker {
  /**
   * Check for updates
   */
  check(): Effect.Effect<UpdateCheckResult, UpdateError>

  /**
   * Get cached result
   */
  getCached(): Effect.Effect<UpdateCheckResult | null, never>
}

/**
 * Update error
 */
export class UpdateError {
  readonly _tag = 'UpdateError'
  constructor(
    readonly message: string,
    readonly cause?: unknown
  ) {}
}

/**
 * Update notification preferences
 */
export interface UpdateNotificationConfig {
  /** Show banner */
  showBanner?: boolean
  /** Banner position */
  bannerPosition?: 'top' | 'bottom'
  /** Auto-check on startup */
  autoCheck?: boolean
  /** Dismiss duration (ms, 0 = never dismiss) */
  dismissDuration?: number
}
