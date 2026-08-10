/**
 * Debug Scopes Tab
 */

import { color, scopeManager } from '@tuix/core'
import { Flex, Text } from '@tuix/ui'
import { debugStore } from '../../../core/store'
import type { ScopeDef } from '@tuix/core'
import type { JSX } from '@tuix/jsx'

interface ScopeTreeNode {
  scope: ScopeDef
  children: ScopeTreeNode[]
}

export function DebugScopes(): JSX.Element {
  const state = debugStore.getState()
  const scopes = scopeManager.getAllScopes()
  const tree = buildScopeTree(scopes)

  return (
    <Flex direction="column">
      <Text color={color.cyan} bold>
        🌳 Scope Tree
      </Text>
      <Text>Total: {scopes.length} scopes</Text>
      <Text />
      <ScopeNode node={tree} commandPath={state.commandPath} depth={0} />
    </Flex>
  )
}

function buildScopeTree(scopes: ScopeDef[]): ScopeTreeNode {
  const root = scopes.find(s => s.type === 'cli') || scopes[0]
  if (!root) {
    return {
      scope: createDummyScope(),
      children: [],
    }
  }

  function buildNode(scope: ScopeDef): ScopeTreeNode {
    const children = scopes.filter(
      s =>
        s.path.length === scope.path.length + 1 &&
        s.path.slice(0, -1).join('/') === scope.path.join('/')
    )

    return {
      scope,
      children: children.map(buildNode),
    }
  }

  return buildNode(root)
}

function ScopeNode({
  node,
  commandPath,
  depth,
}: { node: ScopeTreeNode; commandPath: string[]; depth: number }): JSX.Element {
  const indent = '  '.repeat(depth)
  const isMatched = commandPath.includes(node.scope.name)
  const isActive = scopeManager.isScopeActive(node.scope.id)

  const marker = isActive ? '●' : '○'
  const textColor = isMatched ? color.green : isActive ? color.cyan : color.gray

  return (
    <Flex direction="column">
      <Text color={textColor}>{`${indent}${marker} ${node.scope.name} [${node.scope.type}]`}</Text>
      {node.children.map(child => (
        <ScopeNode key={child.scope.id} node={child} commandPath={commandPath} depth={depth + 1} />
      ))}
    </Flex>
  )
}

function createDummyScope(): ScopeDef {
  return {
    id: 'dummy',
    type: 'cli',
    name: 'No scopes registered',
    path: [],
    description: '',
    executable: false,
    metadata: {},
    children: [],
  }
}
