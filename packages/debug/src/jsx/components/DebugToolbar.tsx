/**
 * Debug Toolbar Component
 *
 * Tab navigation toolbar
 */

import { Flex, Text } from '@tuix/ui'
import type { DebugTab } from '../../types'
import type { JSX } from '@tuix/jsx'

interface DebugToolbarProps {
  activeTab: DebugTab
  onTabChange: (tab: DebugTab) => void
}

export function DebugToolbar({ activeTab, onTabChange }: DebugToolbarProps): JSX.Element {
  const tabs: Array<{ key: DebugTab; label: string }> = [
    { key: 'scopes', label: 'Scopes' },
    { key: 'events', label: 'Events' },
    { key: 'performance', label: 'Performance' },
    { key: 'state', label: 'State' },
  ]

  return (
    <Flex direction="row" gap={2}>
      {tabs.map((tab, i) => (
        <Text
          key={tab.key}
          style={{
            color: activeTab === tab.key ? 'white' : 'gray',
            bold: activeTab === tab.key,
          }}
          onClick={() => onTabChange(tab.key)}
        >
          [{i + 1}] {tab.label}
        </Text>
      ))}
    </Flex>
  )
}
