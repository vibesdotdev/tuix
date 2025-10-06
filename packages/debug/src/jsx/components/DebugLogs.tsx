import { $state, $effect, color, View } from '@tuix/core'
import { Box, Flex, Text } from '@tuix/ui'
import { debugStore } from '../../core/store'
import type { DebugEvent } from '../../types'
import { CATEGORY_ICONS, LEVEL_COLORS } from '../../constants'
import type { JSX } from '@tuix/jsx'

export interface DebugLogsProps {
  category?: DebugEvent['category']
  maxItems?: number
  showTimestamp?: boolean
  showLevel?: boolean
  filter?: string
}

export function DebugLogs({
  category,
  maxItems = 20,
  showTimestamp = true,
  showLevel = true,
  filter,
}: DebugLogsProps = {}): JSX.Element {
  const events = $state<DebugEvent[]>([])
  const selectedIndex = $state(0)

  // Subscribe to store updates
  $effect(() => {
    const updateEvents = () => {
      let filtered = debugStore.getFilteredEvents()

      if (category) {
        filtered = filtered.filter(e => e.category === category)
      }

      if (filter) {
        const lowerFilter = filter.toLowerCase()
        filtered = filtered.filter(
          e =>
            e.message.toLowerCase().includes(lowerFilter) ||
            JSON.stringify(e.data).toLowerCase().includes(lowerFilter)
        )
      }

      events.value = filtered.slice(-maxItems)
    }

    updateEvents()
    const unsubscribe = debugStore.subscribe(updateEvents)

    return () => unsubscribe()
  })

  // Keyboard navigation
  $effect(() => {
    const handleKey = (key: Buffer) => {
      const keyStr = key.toString()
      switch (keyStr) {
        case '\u001b[A': // Arrow Up
          selectedIndex.value = Math.max(0, selectedIndex.value - 1)
          break
        case '\u001b[B': // Arrow Down
          selectedIndex.value = Math.min(events.value.length - 1, selectedIndex.value + 1)
          break
        case '\r': // Enter
          if (events.value[selectedIndex.value]) {
            debugStore.setSelectedEvent(events.value[selectedIndex.value].id)
          }
          break
      }
    }

    process.stdin.on('data', handleKey)
    return () => process.stdin.off('data', handleKey)
  })

  return (
    <Flex direction="column">
      <Box
        style={{
          borderColor: color.gray,
          borderStyle: 'single',
          padding: { left: 1, right: 1 },
        }}
      >
        <Flex direction="row">
          <Text color={color.cyan}>📝 Debug Logs</Text>
          <Text color={color.gray}> ({events.value.length} events)</Text>
        </Flex>
      </Box>

      {events.value.map((event, index) => (
        <LogEntry
          key={event.id}
          event={event}
          isSelected={index === selectedIndex.value}
          showTimestamp={showTimestamp}
          showLevel={showLevel}
        />
      ))}
    </Flex>
  )
}

function LogEntry({ event, isSelected, showTimestamp, showLevel }: {
  event: DebugEvent,
  isSelected: boolean,
  showTimestamp: boolean,
  showLevel: boolean
}): JSX.Element {
  const levelColor = LEVEL_COLORS[event.level]
  const icon = CATEGORY_ICONS[event.category] || '•'

  return (
    <Box
      style={{
        padding: { left: 1 },
        backgroundColor: isSelected ? color.blue : undefined,
        color: isSelected ? color.white : undefined,
      }}
    >
      <Flex direction="row">
        {showTimestamp && <Text color={color.gray}>{event.timestamp.toLocaleTimeString()} </Text>}
        <Text>{icon} </Text>
        {showLevel && <Text color={levelColor}>{event.level.toUpperCase().padEnd(5)} </Text>}
        <Text>{event.message}</Text>
        {event.context?.componentName && <Text color={color.gray}> [{event.context.componentName}]</Text>}
        {event.context?.duration !== undefined && <Text color={color.green}> {event.context.duration.toFixed(2)}ms</Text>}
      </Flex>
    </Box>
  )
}

/**
 * Create a filtered debug log view
 */
export function createDebugLog(options: DebugLogsProps = {}) {
  return <DebugLogs {...options} />
}
