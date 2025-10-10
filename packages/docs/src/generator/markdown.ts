/**
 * @tuix/docs - Markdown generator
 *
 * Generate markdown documentation from doc structures.
 */

import { Effect } from 'effect'
import type { CommandDoc, PluginDoc, AppDoc, DocError } from '../types'

/**
 * Generate markdown for a command
 */
export function generateCommandMarkdown(doc: CommandDoc): Effect.Effect<string, DocError> {
  return Effect.try({
    try: () => {
      const lines: string[] = []

      // Command header
      lines.push(`## ${doc.name}`)
      lines.push('')

      // Description
      if (doc.description) {
        lines.push(doc.description)
        lines.push('')
      }

      // Usage
      if (doc.usage && doc.usage.length > 0) {
        lines.push('### Usage')
        lines.push('')
        doc.usage.forEach(usage => {
          lines.push(`\`\`\`bash`)
          lines.push(usage)
          lines.push(`\`\`\``)
          lines.push('')
        })
      }

      // Arguments
      if (doc.args && doc.args.length > 0) {
        lines.push('### Arguments')
        lines.push('')
        doc.args.forEach(arg => {
          const required = arg.required ? '(required)' : '(optional)'
          lines.push(`- **${arg.name}** ${required}`)
          if (arg.description) {
            lines.push(`  ${arg.description}`)
          }
          if (arg.default) {
            lines.push(`  Default: \`${arg.default}\``)
          }
          if (arg.choices && arg.choices.length > 0) {
            lines.push(`  Choices: ${arg.choices.map(c => `\`${c}\``).join(', ')}`)
          }
          lines.push('')
        })
      }

      // Options
      if (doc.options && doc.options.length > 0) {
        lines.push('### Options')
        lines.push('')
        doc.options.forEach(opt => {
          const flags = [opt.short, opt.long].filter(Boolean).join(', ')
          lines.push(`- **${flags}**`)
          if (opt.description) {
            lines.push(`  ${opt.description}`)
          }
          if (opt.default) {
            lines.push(`  Default: \`${opt.default}\``)
          }
          lines.push('')
        })
      }

      // Examples
      if (doc.examples && doc.examples.length > 0) {
        lines.push('### Examples')
        lines.push('')
        doc.examples.forEach(example => {
          lines.push(example.description)
          lines.push('')
          lines.push(`\`\`\`bash`)
          lines.push(example.command)
          lines.push(`\`\`\``)
          lines.push('')
        })
      }

      // Related commands
      if (doc.related && doc.related.length > 0) {
        lines.push('### Related Commands')
        lines.push('')
        lines.push(doc.related.map(r => `- ${r}`).join('\n'))
        lines.push('')
      }

      return lines.join('\n')
    },
    catch: (error) => ({
      _tag: 'DocError' as const,
      message: 'Failed to generate command markdown',
      cause: error,
    }),
  })
}

/**
 * Generate markdown for a plugin
 */
export function generatePluginMarkdown(doc: PluginDoc): Effect.Effect<string, DocError> {
  return Effect.try({
    try: () => {
      const lines: string[] = []

      // Plugin header
      lines.push(`# ${doc.name}`)
      lines.push('')

      // Description
      if (doc.description) {
        lines.push(doc.description)
        lines.push('')
      }

      // Commands
      if (doc.commands.length > 0) {
        lines.push('## Commands')
        lines.push('')

        doc.commands.forEach(cmd => {
          const cmdMd = Effect.runSync(generateCommandMarkdown(cmd))
          lines.push(cmdMd)
        })
      }

      return lines.join('\n')
    },
    catch: (error) => ({
      _tag: 'DocError' as const,
      message: 'Failed to generate plugin markdown',
      cause: error,
    }),
  })
}

/**
 * Generate markdown for entire app
 */
export function generateAppMarkdown(doc: AppDoc): Effect.Effect<string, DocError> {
  return Effect.try({
    try: () => {
      const lines: string[] = []

      // App header
      lines.push(`# ${doc.name}`)
      lines.push('')

      if (doc.version) {
        lines.push(`Version: ${doc.version}`)
        lines.push('')
      }

      // Description
      if (doc.description) {
        lines.push(doc.description)
        lines.push('')
      }

      // Table of contents
      lines.push('## Table of Contents')
      lines.push('')

      if (doc.plugins.length > 0) {
        lines.push('### Plugins')
        lines.push('')
        doc.plugins.forEach(plugin => {
          lines.push(`- [${plugin.name}](#${plugin.name.toLowerCase().replace(/\s+/g, '-')})`)
        })
        lines.push('')
      }

      if (doc.commands.length > 0) {
        lines.push('### Commands')
        lines.push('')
        doc.commands.forEach(cmd => {
          lines.push(`- [${cmd.name}](#${cmd.name.toLowerCase().replace(/\s+/g, '-')})`)
        })
        lines.push('')
      }

      // Plugins
      if (doc.plugins.length > 0) {
        doc.plugins.forEach(plugin => {
          const pluginMd = Effect.runSync(generatePluginMarkdown(plugin))
          lines.push(pluginMd)
          lines.push('')
        })
      }

      // Commands
      if (doc.commands.length > 0) {
        lines.push('# Commands')
        lines.push('')

        doc.commands.forEach(cmd => {
          const cmdMd = Effect.runSync(generateCommandMarkdown(cmd))
          lines.push(cmdMd)
        })
      }

      return lines.join('\n')
    },
    catch: (error) => ({
      _tag: 'DocError' as const,
      message: 'Failed to generate app markdown',
      cause: error,
    }),
  })
}
