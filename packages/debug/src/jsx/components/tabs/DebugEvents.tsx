/**
 * Debug Events Tab
 */

import { color } from '@tuix/core'
import { Flex, Text } from '@tuix/ui'
import { debugStore } from '../../../core/store'
import { CATEGORY_ICONS, LEVEL_COLORS } from '../../../constants'
import type { DebugEvent } from '../../../types'
import type { JSX } from '@tuix/jsx'

export function DebugEvents(): JSX.Element {
  const state = debugStore.getState()
  const filteredEvents = debugStore.getFilteredEvents()

  // Show last 15 events
  const recentEvents = filteredEvents.slice(-15)

  return (
    <Flex direction="column">
      <Text color={color.cyan} bold>
        📝 Event Log
      </Text>
      <Text>
        Showing {recentEvents.length} of {filteredEvents.length} events
      </Text>
      {state.filter && <Text color={color.yellow}>Filter: "{state.filter}"</Text>}
      <Text />
      {recentEvents.map(event => (
        <EventRow key={event.id} event={event} />
      ))}
    </Flex>
  )
}

function EventRow({ event }: { event: DebugEvent }): JSX.Element {
  const time = event.timestamp.toLocaleTimeString()
  const levelColor = LEVEL_COLORS[event.level]
  const icon = CATEGORY_ICONS[event.category] || '•'

  return (
    <Flex direction="row">
      <Text color={color.gray}>{time} </Text>
      <Text>{icon} </Text>
      <Text color={color.gray}>[{event.category}] </Text>
      <Text color={levelColor}>{event.message}</Text>
      {event.context?.componentName && (
        <Text color={color.gray}> ({event.context.componentName})</Text>
      )}
      {event.context?.duration !== undefined && (
        <Text color={color.green}> {event.context.duration.toFixed(2)}ms</Text>
      )}
    </Flex>
  )
}
