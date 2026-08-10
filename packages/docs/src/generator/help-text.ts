/**
 * @tuix/docs - Help text generator
 *
 * Generate terminal help text from doc structures.
 */

import { Effect } from 'effect'
import type { CommandDoc, AppDoc, DocError } from '../types'

/**
 * Generate help text for a command
 */
export function generateCommandHelp(doc: CommandDoc): Effect.Effect<string, DocError> {
  return Effect.try({
    try: () => {
      const lines: string[] = []

      // Command name and description
      lines.push(`${doc.name}`)
      if (doc.description) {
        lines.push(`  ${doc.description}`)
      }
      lines.push('')

      // Usage
      if (doc.usage && doc.usage.length > 0) {
        lines.push('USAGE:')
        doc.usage.forEach(usage => {
          lines.push(`  ${usage}`)
        })
        lines.push('')
      }

      // Arguments
      if (doc.args && doc.args.length > 0) {
        lines.push('ARGUMENTS:')
        const maxNameLen = Math.max(...doc.args.map(a => a.name.length))

        doc.args.forEach(arg => {
          const name = arg.name.padEnd(maxNameLen)
          const desc = arg.description || ''
          lines.push(`  ${name}  ${desc}`)
        })
        lines.push('')
      }

      // Options
      if (doc.options && doc.options.length > 0) {
        lines.push('OPTIONS:')

        const maxFlagLen = Math.max(
          ...doc.options.map(opt => {
            const flags = [opt.short, opt.long].filter(Boolean).join(', ')
            return flags.length
          })
        )

        doc.options.forEach(opt => {
          const flags = [opt.short, opt.long].filter(Boolean).join(', ')
          const paddedFlags = flags.padEnd(maxFlagLen)
          const desc = opt.description || ''
          lines.push(`  ${paddedFlags}  ${desc}`)
        })
        lines.push('')
      }

      // Examples
      if (doc.examples && doc.examples.length > 0) {
        lines.push('EXAMPLES:')
        doc.examples.forEach(example => {
          lines.push(`  # ${example.description}`)
          lines.push(`  ${example.command}`)
          lines.push('')
        })
      }

      return lines.join('\n')
    },
    catch: error => ({
      _tag: 'DocError' as const,
      message: 'Failed to generate command help text',
      cause: error,
    }),
  })
}

/**
 * Generate help text for entire app
 */
export function generateAppHelp(doc: AppDoc): Effect.Effect<string, DocError> {
  return Effect.try({
    try: () => {
      const lines: string[] = []

      // App name and version
      lines.push(`${doc.name}${doc.version ? ` v${doc.version}` : ''}`)
      if (doc.description) {
        lines.push(doc.description)
      }
      lines.push('')

      // Available commands
      if (doc.commands.length > 0) {
        lines.push('AVAILABLE COMMANDS:')

        const maxNameLen = Math.max(...doc.commands.map(c => c.name.length))

        doc.commands.forEach(cmd => {
          const name = cmd.name.padEnd(maxNameLen)
          const desc = cmd.description || ''
          lines.push(`  ${name}  ${desc}`)
        })
        lines.push('')
      }

      // Plugins
      if (doc.plugins.length > 0) {
        lines.push('PLUGINS:')

        const maxNameLen = Math.max(...doc.plugins.map(p => p.name.length))

        doc.plugins.forEach(plugin => {
          const name = plugin.name.padEnd(maxNameLen)
          const desc = plugin.description || ''
          const cmdCount = `(${plugin.commands.length} commands)`
          lines.push(`  ${name}  ${desc} ${cmdCount}`)
        })
        lines.push('')
      }

      lines.push('Use "<command> --help" for more information about a command.')

      return lines.join('\n')
    },
    catch: error => ({
      _tag: 'DocError' as const,
      message: 'Failed to generate app help text',
      cause: error,
    }),
  })
}
