/**
 * Debug Console Tab
 */

import { color } from '@tuix/core'
import { Box, Flex, Text } from '@tuix/ui'
import { debugStore } from '../../../core/store'
import type { JSX } from '@tuix/jsx'

export function DebugConsole(): JSX.Element {
  const state = debugStore.getState()
  const loggerEvents = state.events.filter(e => e.category === 'logger')

  return (
    <Flex direction="column">
      <Text color={color.cyan} bold>
        💻 Console Output
      </Text>
      <Text>{loggerEvents.length} log entries</Text>
      <Text />
      <Box borderColor={color.gray} borderStyle="single" padding={1} maxHeight={15}>
        <Flex direction="column">
          {loggerEvents.slice(-20).map(event => (
            <Text color={LEVEL_COLORS[event.level]}>{event.message}</Text>
          ))}
        </Flex>
      </Box>
    </Flex>
  )
}

const LEVEL_COLORS = {
  debug: 'gray',
  info: 'white',
  warn: 'yellow',
  error: 'red',
} as const
