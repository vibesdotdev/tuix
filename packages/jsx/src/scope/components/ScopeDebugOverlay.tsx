/**
 * ScopeDebugOverlay Component
 *
 * Renders a visual overlay showing the scope tree and execution path
 * Designed to be superimposed on top of the actual command output
 */

import { Effect } from 'effect'
import { scopeManager } from '../../manager'
import { text, vstack, hstack } from '@tuix/view/primitives/view'
import { colors, toAnsiSequence, ColorProfile, type Color } from '@tuix/ansi'
import type { View } from '@tuix/core/types'
import { TerminalService } from '../../../../services'
import { RendererService } from '../../../../services'

interface ScopeNode {
  scope: ScopeDef
  children: ScopeNode[]
  depth: number
  isActive: boolean
  isInPath: boolean
}

export function renderScopeDebugOverlay(
  commandPath: string[]
): Effect.Effect<string, never, TerminalService | RendererService> {
  return Effect.gen(function* (_) {
    const terminal = yield* _(TerminalService)
    const renderer = yield* _(RendererService)

    // Get terminal dimensions
    const { columns, rows } = yield* _(terminal.getSize)

    // Build scope tree
    const tree = buildScopeTree(commandPath)

    // Create overlay view
    const overlay = createOverlayView(tree, columns, rows)

    // Render overlay and return as string
    const output = yield* _(overlay.render())
    return output
  })
}

function buildScopeTree(commandPath: string[]): ScopeNode {
  const allScopes = scopeManager.getAllScopes()
  const rootScope = allScopes.find(s => s.type === 'cli') || allScopes[0]

  if (!rootScope) {
    // Return a dummy node if no scopes exist
    return {
      scope: {
        id: 'empty',
        type: 'cli',
        name: 'No scopes registered',
        path: [],
        description: '',
        executable: false,
        metadata: {},
        children: [],
      },
      children: [],
      depth: 0,
      isActive: false,
      isInPath: false,
    }
  }

  function buildNode(scope: ScopeDef, depth: number = 0): ScopeNode {
    const children = scopeManager.getChildScopes(scope.id)
    const isActive = scopeManager.isScopeActive(scope.id)
    const isInPath =
      commandPath.includes(scope.name) || commandPath.join(' ').startsWith(scope.path.join(' '))

    return {
      scope,
      children: children.map(c => buildNode(c, depth + 1)),
      depth,
      isActive,
      isInPath,
    }
  }

  return buildNode(rootScope)
}

function createOverlayView(tree: ScopeNode, width: number, height: number): View {
  const lines: View[] = []
  const maxWidth = 38 // Leave some padding

  // Header with dark background
  lines.push(styledBox('╭' + '─'.repeat(maxWidth - 2) + '╮', colors.cyan))
  lines.push(styledBox('│ ' + '🔍 SCOPE TREE'.padEnd(maxWidth - 3) + '│', colors.cyan))
  lines.push(styledBox('├' + '─'.repeat(maxWidth - 2) + '┤', colors.cyan))
  lines.push(styledBox('╰' + '─'.repeat(maxWidth - 2) + '╯', colors.cyan))
  lines.push(styledBox('│ ' + '● Active  ○ Inactive'.padEnd(maxWidth - 3) + '│', colors.gray))
  lines.push(styledBox('│ ' + '▶ In Path  ▷ Not in Path'.padEnd(maxWidth - 3) + '│', colors.gray))

  // Footer
  lines.push(styledBox('╰' + '─'.repeat(maxWidth - 2) + '╯', colors.cyan))

  // Add legend
  lines.push(text('')) // spacer
  lines.push(styledBox('│ ' + '● Active  ○ Inactive'.padEnd(maxWidth - 3) + '│', colors.gray))
  lines.push(styledBox('│ ' + '▶ In Path  ▷ Not in Path'.padEnd(maxWidth - 3) + '│', colors.gray))

  return vstack(...lines)
}

function addTreeNode(
  node: ScopeNode,
  lines: View[],
  prefix: string,
  isLast: boolean,
  maxWidth: number
): void {
  const connector = isLast ? '└' : '├'
  const extension = isLast ? ' ' : '│'

  // Determine node appearance
  const bullet = node.isActive ? '●' : '○'
  const arrow = node.isInPath ? '▶' : '▷'
  const color = getNodeColor(node)

  // Format node name with type
  const nodeText = `${bullet} ${arrow} ${node.scope.name} [${node.scope.type}]`
  const truncated =
    nodeText.length > maxWidth - prefix.length - 4
      ? nodeText.slice(0, maxWidth - prefix.length - 7) + '...'
      : nodeText

  // Add the node line
  lines.push(
    styledBox(
      '│ ' + prefix + connector + '─ ' + truncated.padEnd(maxWidth - prefix.length - 5) + '│',
      color
    )
  )

  // Add children
  node.children.forEach((child, index) => {
    const isChildLast = index === node.children.length - 1
    const childPrefix = prefix + (isLast ? '  ' : '│ ')
    addTreeNode(child, lines, childPrefix, isChildLast, maxWidth)
  })
}

function getNodeColor(node: ScopeNode): Color {
  if (node.isInPath && node.isActive) return colors.green
  if (node.isInPath) return colors.yellow
  if (node.isActive) return colors.cyan

  switch (node.scope.type) {
    case 'cli':
      return colors.blue
    case 'plugin':
      return colors.magenta
    case 'module':
      return colors.cyan
    case 'service':
      return colors.gray
    default:
      return colors.gray
  }
}

function styledBox(content: string, color: Color): View {
  const colorSeq = toAnsiSequence(color, ColorProfile.ANSI, false)
  return text(`\x1b[48;2;20;20;20m${colorSeq}${content}\x1b[0m`)
}

/**
 * Hook to show overlay after command execution
 */
export function withScopeDebugOverlay<T>(
  commandPath: string[],
  effect: Effect.Effect<T>
): Effect.Effect<T> {
  return Effect.gen(function* (_) {
    const result = yield* _(effect)

    // Show overlay if debug is enabled
    if (process.env.TUIX_DEBUG === 'true') {
      yield* _(renderScopeDebugOverlay(commandPath))
    }

    return result
  })
}
