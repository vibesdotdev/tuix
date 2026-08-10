/**
 * @tuix/docs - Generate documentation from JSX components
 *
 * Extracts documentation from JSX Command and Plugin components.
 */

import { Effect } from 'effect'
import type { CommandDoc, PluginDoc, AppDoc, DocError } from '../types'

function typeName(node: { type?: unknown }): string {
  const t = node.type
  if (typeof t === 'function') {
    return (t as { name?: string }).name || ''
  }
  if (typeof t === 'string') return t
  return ''
}

function isCommandNode(node: any): boolean {
  if (!node || typeof node !== 'object') return false
  const name = typeName(node)
  if (name === 'Command') return true
  // Descriptor with CLI command props (name + description) from <Command>
  if (node.props?.name && (node.props.component || node.props.handler || node.props.description)) {
    if (name === 'Command' || name === 'Scope' || name === '') return true
  }
  return false
}

function isPluginNode(node: any): boolean {
  if (!node || typeof node !== 'object') return false
  const name = typeName(node)
  return name === 'Plugin' || name.endsWith('Plugin')
}

/**
 * Extract documentation from a Command component / JSX descriptor
 */
export function extractCommandDoc(component: any): Effect.Effect<CommandDoc, DocError> {
  return Effect.try({
    try: () => {
      const props = component?.props || component || {}

      const doc: CommandDoc = {
        name: props.name || 'unknown',
        description: props.description,
        usage: props.usage ? (Array.isArray(props.usage) ? props.usage : [props.usage]) : undefined,
        args: props.args,
        options: props.options,
        related: props.related,
        examples: props.examples,
      }

      return doc
    },
    catch: error => ({
      _tag: 'DocError' as const,
      message: 'Failed to extract command documentation',
      cause: error,
    }),
  })
}

/**
 * Extract documentation from a Plugin component
 */
export function extractPluginDoc(component: any): Effect.Effect<PluginDoc, DocError> {
  return Effect.try({
    try: () => {
      const props = component?.props || {}
      const children = props.children || []
      const commands: CommandDoc[] = []

      function scanChildren(node: any) {
        if (!node) return
        if (Array.isArray(node)) {
          node.forEach(scanChildren)
          return
        }
        if (typeof node === 'object') {
          if (isCommandNode(node)) {
            commands.push(Effect.runSync(extractCommandDoc(node)))
            return
          }
          if (node.props?.children) scanChildren(node.props.children)
        }
      }

      scanChildren(children)

      return {
        name: props.name || 'unknown',
        description: props.description,
        commands,
      } satisfies PluginDoc
    },
    catch: error => ({
      _tag: 'DocError' as const,
      message: 'Failed to extract plugin documentation',
      cause: error,
    }),
  })
}

/**
 * Normalize root: accept a component function, an evaluated tree, or a descriptor.
 */
function resolveRootTree(root: unknown): unknown {
  if (typeof root === 'function') {
    try {
      return (root as () => unknown)()
    } catch {
      return root
    }
  }
  return root
}

/**
 * Extract documentation from entire app tree.
 * Pass either `TuixApp` (function) or `TuixApp()` (evaluated JSX tree).
 */
export function extractAppDoc(
  rootComponent: any,
  appName?: string,
  appVersion?: string
): Effect.Effect<AppDoc, DocError> {
  return Effect.try({
    try: () => {
      const commands: CommandDoc[] = []
      const plugins: PluginDoc[] = []
      const seen = new Set<string>()

      function scanTree(node: any) {
        if (!node) return
        if (Array.isArray(node)) {
          node.forEach(scanTree)
          return
        }
        if (typeof node === 'function') {
          // Nested component factory — evaluate once
          try {
            scanTree(node())
          } catch {
            /* ignore */
          }
          return
        }
        if (typeof node !== 'object') return

        if (isPluginNode(node)) {
          plugins.push(Effect.runSync(extractPluginDoc(node)))
          return
        }
        if (isCommandNode(node)) {
          const doc = Effect.runSync(extractCommandDoc(node))
          if (doc.name && !seen.has(doc.name)) {
            seen.add(doc.name)
            commands.push(doc)
          }
          return
        }

        if (node.props?.children != null) {
          scanTree(node.props.children)
        }
        // Fragment / array-like
        if (Array.isArray((node as { children?: unknown }).children)) {
          scanTree((node as { children: unknown }).children)
        }
      }

      scanTree(resolveRootTree(rootComponent))

      return {
        name: appName || 'app',
        version: appVersion,
        commands,
        plugins,
      } satisfies AppDoc
    },
    catch: error => ({
      _tag: 'DocError' as const,
      message: 'Failed to extract application documentation',
      cause: error,
    }),
  })
}

/**
 * Build AppDoc from registered CLI scopes (post scope registration).
 * Preferred when Command components have already registered with scopeManager.
 */
export function extractAppDocFromScopes(
  scopes: Array<{
    name?: string
    description?: string
    executable?: boolean
    path?: string[]
    metadata?: { hidden?: boolean }
  }>,
  appName?: string,
  appVersion?: string
): AppDoc {
  const commands: CommandDoc[] = []
  for (const s of scopes) {
    if (!s.executable || !s.name) continue
    if (s.metadata?.hidden) continue
    if (Array.isArray(s.path) && s.path.length !== 1) continue
    commands.push({
      name: s.name,
      description: s.description,
    })
  }
  return {
    name: appName || 'app',
    version: appVersion,
    commands,
    plugins: [],
  }
}
