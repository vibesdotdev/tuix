/**
 * Updater Plugin Component
 */

import type { Component } from '@tuix/core'
import { Effect } from 'effect'
import { Box } from '@tuix/ui'
import { UpdateBanner } from './banner'
import { createNpmChecker } from '../checker/npm'
import { createGitHubChecker } from '../checker/github'
import { createCustomChecker } from '../checker/custom'
import type {
  UpdateChecker,
  UpdateCheckResult,
  UpdateCheckerConfig,
  UpdateNotificationConfig,
} from '../types'

export interface UpdaterProps extends UpdateCheckerConfig, UpdateNotificationConfig {
  /** Children to render */
  children?: any
}

export interface UpdaterModel {
  checker: UpdateChecker
  checkResult: UpdateCheckResult | null
  checking: boolean
  error: string | null
  config: UpdateNotificationConfig
  bannerDismissed: boolean
}

export type UpdaterMsg =
  | { _tag: 'CheckForUpdates' }
  | { _tag: 'CheckComplete'; result: UpdateCheckResult }
  | { _tag: 'CheckError'; error: string }
  | { _tag: 'DismissBanner' }
  | { _tag: 'PerformUpdate' }

/**
 * Create update checker based on config
 */
function createChecker(config: UpdateCheckerConfig): UpdateChecker {
  if (config.packageName) {
    return createNpmChecker(config)
  }
  if (config.githubRepo) {
    return createGitHubChecker(config)
  }
  if (config.customUrl) {
    return createCustomChecker(config)
  }
  throw new Error('Must provide packageName, githubRepo, or customUrl')
}

export const Updater: Component<UpdaterProps, UpdaterModel, UpdaterMsg> = {
  init: props => {
    const checker = createChecker(props)
    const notificationConfig: UpdateNotificationConfig = {
      showBanner: props.showBanner ?? true,
      bannerPosition: props.bannerPosition ?? 'top',
      autoCheck: props.autoCheck ?? true,
      dismissDuration: props.dismissDuration ?? 0,
    }

    return {
      checker,
      checkResult: null,
      checking: false,
      error: null,
      config: notificationConfig,
      bannerDismissed: false,
    }
  },

  update: (msg, model) => {
    switch (msg._tag) {
      case 'CheckForUpdates':
        return [
          { ...model, checking: true, error: null },
          Effect.gen(function* (_) {
            const result = yield* model.checker.check()
            return { _tag: 'CheckComplete' as const, result }
          }).pipe(
            Effect.catchAll(error =>
              Effect.succeed({
                _tag: 'CheckError' as const,
                error: error.message || 'Unknown error',
              })
            )
          ),
        ]

      case 'CheckComplete':
        return {
          ...model,
          checking: false,
          checkResult: msg.result,
        }

      case 'CheckError':
        return {
          ...model,
          checking: false,
          error: msg.error,
        }

      case 'DismissBanner':
        return { ...model, bannerDismissed: true }

      case 'PerformUpdate':
        // In a real implementation, this would trigger the update process
        // For now, we just open the release notes URL
        if (model.checkResult?.version.releaseNotesUrl) {
          console.log(`Update available at: ${model.checkResult.version.releaseNotesUrl}`)
        }
        return model
    }
  },

  view: (model, dispatch, props) => {
    const showBanner =
      model.config.showBanner &&
      !model.bannerDismissed &&
      model.checkResult?.version.updateAvailable

    return (
      <Box flexDirection="column">
        {showBanner && model.config.bannerPosition === 'top' && model.checkResult && (
          <UpdateBanner
            result={model.checkResult}
            position="top"
            onDismiss={() => dispatch({ _tag: 'DismissBanner' })}
            onUpdate={() => dispatch({ _tag: 'PerformUpdate' })}
          />
        )}

        {props.children}

        {showBanner && model.config.bannerPosition === 'bottom' && model.checkResult && (
          <UpdateBanner
            result={model.checkResult}
            position="bottom"
            onDismiss={() => dispatch({ _tag: 'DismissBanner' })}
            onUpdate={() => dispatch({ _tag: 'PerformUpdate' })}
          />
        )}
      </Box>
    )
  },

  subscriptions: model => {
    // Auto-check on startup if enabled
    if (model.config.autoCheck && !model.checkResult && !model.checking) {
      return [Effect.succeed({ _tag: 'CheckForUpdates' as const })]
    }
    return []
  },
}

export default Updater
