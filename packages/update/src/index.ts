/**
 * @tuix/update - Update checker and notification system
 */

// Types
export type {
  VersionInfo,
  UpdateCheckResult,
  UpdateCheckerConfig,
  UpdateChecker,
  UpdateError,
  UpdateNotificationConfig,
} from './types'

// Checkers
export { createNpmChecker } from './checker/npm'
export { createGitHubChecker } from './checker/github'
export { createCustomChecker } from './checker/custom'

// Plugin
export { Updater, UpdateBanner } from './plugin'
export type {
  UpdaterProps,
  UpdaterModel,
  UpdaterMsg,
  BannerProps,
  BannerModel,
  BannerMsg,
} from './plugin'
