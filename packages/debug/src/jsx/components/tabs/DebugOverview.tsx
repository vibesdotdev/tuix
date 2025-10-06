/**
 * Debug Overview Tab
 */

import { color, scopeManager } from '@tuix/core'
import { Flex, Text } from '@tuix/ui'
import { debugStore } from '../../../core/store'
import type { ScopeDef } from '@tuix/core'
import type { JSX } from '@tuix/jsx'

export function DebugOverview(): JSX.Element {
  const state = debugStore.getState()
  const scopes = scopeManager.getAllScopes()
  const matchedScopes = findMatchedScopes(state.commandPath)

  // Count events by category
  const eventCounts = state.events.reduce(
    (acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <Flex direction="column">
      <Text color={color.cyan} bold>📊 Debug Overview</Text>
      <Text />
      <Text>Command Path: {state.commandPath.join(' → ') || '(root)'}</Text>
      <Text>Total Scopes: {scopes.length}</Text>
      <Text>Matched Scopes: {matchedScopes.length}</Text>
      <Text />
      <Text color={color.yellow}>Event Summary:</Text>
      {Object.entries(eventCounts).map(([category, count]) => (
        <Text>  {category}: {count} events</Text>
      ))}
      <Text />
      <Text color={color.yellow}>Matched Scope Chain:</Text>
      {matchedScopes.map((scope, i) => (
        <Text>  {' '.repeat(i * 2)}→ {scope.name} [{scope.type}]</Text>
      ))}
      <Text />
      <Text>Total Events: {state.events.length}</Text>
      <Text color={state.paused ? color.yellow : color.green}>
        Recording: {state.paused ? 'PAUSED' : 'ACTIVE'}
      </Text>
    </Flex>
  )
}

function findMatchedScopes(commandPath: string[]) {
  const scopes = scopeManager.getAllScopes()
  const matched: ScopeDef[] = []

  // Find root
  const root = scopes.find(s => s.type === 'cli')
  if (root) matched.push(root)

  // Find each segment
  let currentPath: string[] = []
  for (const segment of commandPath) {
    currentPath.push(segment)
    const scope = scopes.find(
      s =>
        s.path.join('/') === currentPath.join('/') ||
        (s.name === segment && s.path.length === currentPath.length)
    )
    if (scope) matched.push(scope)
  }

  return matched
}
