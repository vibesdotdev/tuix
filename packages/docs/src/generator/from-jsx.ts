/**
 * @tuix/docs - Generate documentation from JSX components
 *
 * Extracts documentation from JSX Command and Plugin components.
 */

import { Effect } from 'effect'
import type { CommandDoc, PluginDoc, AppDoc, DocError } from '../types'

/**
 * Extract documentation from a Command component
 *
 * Looks for JSX props like:
 * - name
 * - description
 * - usage
 * - args (array of arg definitions)
 * - options (array of option definitions)
 */
export function extractCommandDoc(component: any): Effect.Effect<CommandDoc, DocError> {
  return Effect.try({
    try: () => {
      // Extract props from component
      const props = component.props || {}

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
    catch: (error) => ({
      _tag: 'DocError' as const,
      message: 'Failed to extract command documentation',
      cause: error,
    }),
  })
}

/**
 * Extract documentation from a Plugin component
 *
 * Recursively scans children to find Command components.
 */
export function extractPluginDoc(component: any): Effect.Effect<PluginDoc, DocError> {
  return Effect.try({
    try: () => {
      const props = component.props || {}
      const children = props.children || []

      // Find all Command children
      const commands: CommandDoc[] = []

      function scanChildren(node: any) {
        if (!node) return

        if (Array.isArray(node)) {
          node.forEach(scanChildren)
          return
        }

        if (typeof node === 'object') {
          // Check if this is a Command component
          if (node.type?.name === 'Command' || node.props?.name) {
            const cmdDoc = Effect.runSync(extractCommandDoc(node))
            commands.push(cmdDoc)
          }

          // Scan children
          if (node.props?.children) {
            scanChildren(node.props.children)
          }
        }
      }

      scanChildren(children)

      const doc: PluginDoc = {
        name: props.name || 'unknown',
        description: props.description,
        commands,
      }

      return doc
    },
    catch: (error) => ({
      _tag: 'DocError' as const,
      message: 'Failed to extract plugin documentation',
      cause: error,
    }),
  })
}

/**
 * Extract documentation from entire app tree
 *
 * Walks the JSX tree to find all Commands and Plugins.
 */
export function extractAppDoc(rootComponent: any, appName?: string, appVersion?: string): Effect.Effect<AppDoc, DocError> {
  return Effect.try({
    try: () => {
      const commands: CommandDoc[] = []
      const plugins: PluginDoc[] = []

      function scanTree(node: any) {
        if (!node) return

        if (Array.isArray(node)) {
          node.forEach(scanTree)
          return
        }

        if (typeof node === 'object') {
          // Check if this is a Plugin
          if (node.type?.name === 'Plugin' || node.type?.name?.endsWith('Plugin')) {
            const pluginDoc = Effect.runSync(extractPluginDoc(node))
            plugins.push(pluginDoc)
            // Don't scan children - they belong to the plugin
            return
          }
          // Check if this is a Command
          else if (node.type?.name === 'Command' || node.props?.name) {
            const cmdDoc = Effect.runSync(extractCommandDoc(node))
            commands.push(cmdDoc)
            // Don't scan children - they're part of the command implementation
            return
          }

          // Scan children for plugins/commands
          if (node.props?.children) {
            scanTree(node.props.children)
          }
        }
      }

      scanTree(rootComponent)

      const doc: AppDoc = {
        name: appName || 'app',
        version: appVersion,
        commands,
        plugins,
      }

      return doc
    },
    catch: (error) => ({
      _tag: 'DocError' as const,
      message: 'Failed to extract application documentation',
      cause: error,
    }),
  })
}
