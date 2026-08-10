/**
 * State Inspector Component
 *
 * Displays application / debug store state.
 */

import { Box, Text } from '@tuix/ui'
import type { JSX } from '@tuix/jsx'
import { debugStore } from '../../core/store'

export function StateInspector(props: { state?: Record<string, unknown> }): JSX.Element {
  const storeState = debugStore.getState()
  const payload =
    props.state ??
    ({
      paused: storeState.paused,
      filter: storeState.filter,
      selectedEvent: storeState.selectedEvent,
      selectedScope: storeState.selectedScope,
      commandPath: storeState.commandPath,
      eventCount: storeState.events.length,
      matchedScopes: storeState.matchedScopes,
      renderTreeNodes: storeState.renderTree.length,
    } as Record<string, unknown>)

  const lines = Object.entries(payload).map(([k, v]) => {
    const shown =
      typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
        ? String(v)
        : JSON.stringify(v)
    return `${k}: ${shown}`
  })

  return (
    <Box direction="vertical">
      <Text bold color="cyan">
        State Inspector
      </Text>
      {lines.length === 0 ? (
        <Text color="gray">No state fields</Text>
      ) : (
        lines.map((line, i) => (
          <Text key={i} color="gray">
            {line}
          </Text>
        ))
      )}
    </Box>
  )
}
