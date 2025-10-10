/**
 * ScopeDebugView Component
 *
 * Renders a tree view of all registered scopes for debugging purposes.
 * Shows activation status, render status, and hierarchy.
 */

import { Effect } from 'effect'
import { scopeManager } from '../../manager'
import { vstack, hstack, text } from '@tuix/view/primitives/view'
import { colors, toAnsiSequence, ColorProfile } from '@tuix/ansi'
import type { View } from '@tuix/core/types'
import type { ScopeDef } from '../types'
import { getDebugCategories, getDebugEntries } from '@tuix/core/debug'

interface ScopeTreeNode {
  scope: ScopeDef
  children: ScopeTreeNode[]
  depth: number
  isActive: boolean
  willRender: boolean
  path: string
}

export function ScopeDebugView(): View {
  // Get all scopes
  const allScopes = scopeManager.getAllScopes()

  // Build tree structure
  const rootScopes = allScopes.filter(s => s.path.length === 0 || s.type === 'cli')
  const tree = buildScopeTree(rootScopes, allScopes)

  // Create table rows
  const rows: View[][] = []

  // Header row
  rows.push([
    styledText('Scope', { color: colors.cyan, bold: true }),
    styledText('Type', { color: colors.cyan, bold: true }),
    styledText('Path', { color: colors.cyan, bold: true }),
    styledText('Active', { color: colors.cyan, bold: true }),
    styledText('Render', { color: colors.cyan, bold: true }),
  ])

  // Add tree nodes
  tree.forEach(node => addNodeToRows(node, rows))

  // Create a simple table layout
  return vstack(
    text(''),
    hstack(text('🔍 Scope Debug View'), text(' '.repeat(20))),
    text('─'.repeat(90)),
    ...rows.map(row =>
      hstack(
        ...row.map((cell, i) => {
          const width = [30, 10, 30, 8, 8][i]
          const content = extractTextContent(cell)
          const padded = content.padEnd(width).slice(0, width)
          return cell.type === 'styledText'
            ? { ...cell, props: { ...cell.props, children: padded } }
            : text(padded)
        })
      )
    ),
    text('─'.repeat(90)),
    text(''),
    ...renderDebugLogs()
  )
}

function buildScopeTree(rootScopes: ScopeDef[], allScopes: ScopeDef[]): ScopeTreeNode[] {
  const scopeMap = new Map(allScopes.map(s => [s.id, s]))

  function buildNode(scope: ScopeDef, depth: number = 0): ScopeTreeNode {
    const children = scopeManager.getChildScopes(scope.id)
    const isActive = scopeManager.isScopeActive(scope.id)

    // Check if scope will render (has handler or has active children)
    const willRender =
      scope.handler !== undefined ||
      (scope.executable && children.some(c => scopeManager.isScopeActive(c.id)))

    return {
      scope,
      children: children.map(c => buildNode(c, depth + 1)),
      depth,
      isActive,
      willRender,
      path: scope.path.join(' > '),
    }
  }

  return rootScopes.map(s => buildNode(s))
}

function addNodeToRows(node: ScopeTreeNode, rows: View[][]): void {
  const indent = '  '.repeat(node.depth)
  const prefix = node.children.length > 0 ? '▼ ' : '• '

  // Determine colors based on status
  const nameColor = node.isActive ? colors.green : colors.gray
  const activeColor = node.isActive ? colors.green : colors.red
  const renderColor = node.willRender ? colors.green : colors.yellow

  rows.push([
    styledText(indent + prefix + node.scope.name, { color: nameColor }),
    styledText(node.scope.type, { color: typeColor }),
    styledText(node.path || '-', { color: colors.white, dim: true }),
    styledText(node.isActive ? '✓' : '✗', { color: activeColor }),
    styledText(node.willRender ? '✓' : '○', { color: renderColor }),
  ])

  // Add children
  node.children.forEach(child => addNodeToRows(child, rows))
}

function getTypeColor(type: ScopeDef['type']): string {
  switch (type) {
    case 'cli':
      return colors.blue
    case 'plugin':
      return colors.magenta
    case 'module':
      return colors.cyan
    case 'service':
      return colors.yellow
    default:
      return colors.white
  }
}

// Service imports for overlay rendering
import { TerminalService } from '@tuix/core/services'
import { RendererService } from '@tuix/core/services'

// Helper to create styled text
function styledText(content: string, style: { color?: any; bold?: boolean; dim?: boolean }): View {
  const styles: string[] = []
  if (style.color) {
    // If it's a Color object, convert to ANSI sequence
    if (typeof style.color === 'object' && style.color._tag) {
      styles.push(toAnsiSequence(style.color, ColorProfile.ANSI, false))
    } else {
      // If it's already a string, use it directly
      styles.push(style.color)
    }
  }
  if (style.bold) styles.push('\x1b[1m')
  if (style.dim) styles.push('\x1b[2m')

  return text(styles.length > 0 ? `${styles.join('')}${content}\x1b[0m` : content)
}

// Helper to extract text content from a view
function extractTextContent(view: View): string {
  if (view.type === 'text') {
    return view.props.children || ''
  }
  return ''
}

// Render debug logs section
function renderDebugLogs(): View[] {
  const categories = getDebugCategories()
  const views: View[] = []

  if (categories.length === 0) return views

  views.push(text(''), styledText('📄 Debug Logs', { color: colors.yellow, bold: true }))

  // Show last 10 entries from each category
  categories.forEach(cat => {
    const entries = cat.entries.slice(-10)
    if (entries.length === 0) return

    views.push(
      text(''),
      styledText(`[${cat.name}]`, { color: cat.color || colors.white, bold: true })
    )

    entries.forEach(entry => {
      const time = entry.timestamp.toLocaleTimeString()
      const levelColor = getLevelColor(entry.level)

      views.push(
        hstack(
          styledText(time, { color: colors.gray, dim: true }),
          styledText(entry.level.toUpperCase().padEnd(5), { color: levelColor }),
          text(' '),
          text(entry.message)
        )
      )

      if (entry.data) {
        views.push(
          hstack(
            text('      '),
        styledText(JSON.stringify(entry.data, null, 2), { color: colors.gray, dim: true })
          )
        )
      }
    })
  })

  return views
}

function getLevelColor(level: string): string {
  switch (level) {
    case 'trace':
      return colors.gray
    case 'debug':
      return colors.cyan
    case 'info':
      return colors.green
    case 'warn':
      return colors.yellow
    case 'error':
      return colors.red
    default:
      return colors.white
  }
}
