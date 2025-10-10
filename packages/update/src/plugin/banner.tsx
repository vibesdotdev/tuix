/**
 * Update Notification Banner
 */

import type { Component } from '@tuix/core'
import { Box, Text } from '@tuix/ui'
import type { UpdateCheckResult } from '../types'

export interface BannerProps {
  /** Update check result */
  result: UpdateCheckResult
  /** Banner position */
  position?: 'top' | 'bottom'
  /** On dismiss callback */
  onDismiss?: () => void
  /** On update callback */
  onUpdate?: () => void
}

export interface BannerModel {
  result: UpdateCheckResult
  position: 'top' | 'bottom'
  dismissed: boolean
}

export type BannerMsg =
  | { _tag: 'Dismiss' }
  | { _tag: 'Update' }

export const UpdateBanner: Component<BannerProps, BannerModel, BannerMsg> = {
  init: (props) => ({
    result: props.result,
    position: props.position || 'top',
    dismissed: false,
  }),

  update: (msg, model) => {
    switch (msg._tag) {
      case 'Dismiss':
        return { ...model, dismissed: true }
      case 'Update':
        return model
    }
  },

  view: (model, dispatch) => {
    if (model.dismissed || !model.result.version.updateAvailable) {
      return null
    }

    const { version } = model.result
    const isBreaking = version.isBreaking
    const bgColor = isBreaking ? 'red' : 'yellow'
    const textColor = isBreaking ? 'white' : 'black'

    return (
      <Box
        backgroundColor={bgColor}
        padding={1}
        justifyContent="space-between"
        flexDirection="row"
      >
        <Box flexDirection="row" gap={1}>
          <Text color={textColor} bold>
            {isBreaking ? '⚠️  Breaking Update Available' : '🔔 Update Available'}
          </Text>
          <Text color={textColor}>
            {version.current} → {version.latest}
          </Text>
          {version.releaseNotesUrl && (
            <Text color={textColor} dimColor>
              ({version.releaseNotesUrl})
            </Text>
          )}
        </Box>
        <Box flexDirection="row" gap={1}>
          <Text
            color={textColor}
            bold
            onPress={() => dispatch({ _tag: 'Update' })}
          >
            [Update]
          </Text>
          <Text
            color={textColor}
            dimColor
            onPress={() => dispatch({ _tag: 'Dismiss' })}
          >
            [Dismiss]
          </Text>
        </Box>
      </Box>
    )
  },
}

export default UpdateBanner
