/**
 * Debug Render Tab
 */

import { color } from '@tuix/core'
import { Flex, Text } from '@tuix/ui'
import { debugStore } from '../../../core/store'
import type { JSX } from '@tuix/jsx'

export function DebugRender(): JSX.Element {
  const state = debugStore.getState()
  const renderEvents = state.events.filter(e => e.category === 'render' || e.category === 'jsx')

  return (
    <Flex direction="column">
      <Text color={color.cyan} bold>🎨 Render Trace</Text>
      <Text>{renderEvents.length} render events</Text>
      <Text />
      {renderEvents.slice(-10).map(event => {
        const time = event.timestamp.toLocaleTimeString()
        const component = event.context?.componentName || 'Unknown'
        const phase = event.context?.phase || ''

        return <Text>{`${time} ${component} ${phase}`}</Text>
      })}
    </Flex>
  )
}
