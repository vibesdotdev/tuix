/**
 * @tuix/docs - Interactive help explorer component
 *
 * Provides an interactive TUI for browsing command documentation.
 */

import { $state, $derived } from '@tuix/reactive'
import type { AppDoc, CommandDoc, PluginDoc } from '../types'
import { generateCommandHelp, generateAppHelp } from '../generator/help-text'
import { Effect } from 'effect'

/**
 * HelpExplorer props
 */
export interface HelpExplorerProps {
  /**
   * Application documentation
   */
  docs: AppDoc

  /**
   * Initial selected command
   */
  initialCommand?: string

  /**
   * Show plugin groups?
   */
  showPlugins?: boolean
}

/**
 * HelpExplorer component
 *
 * Interactive help browser with keyboard navigation.
 *
 * @example
 * ```tsx
 * import { HelpExplorer } from '@tuix/docs/explorer'
 *
 * function MyApp() {
 *   const docs = extractAppDoc(myAppComponent)
 *
 *   return (
 *     <HelpExplorer
 *       docs={docs}
 *       showPlugins={true}
 *     />
 *   )
 * }
 * ```
 *
 * Controls:
 * - Up/Down: Navigate commands
 * - Enter: View command details
 * - Escape/Backspace: Back to list
 * - q: Quit
 */
export function HelpExplorer(props: HelpExplorerProps): JSX.Element {
  const selectedIndex = $state(0)
  const viewMode = $state<'list' | 'detail'>('list')
  const selectedCommand = $state<CommandDoc | null>(null)

  // Get all commands (from app + plugins)
  const allCommands = $derived(() => {
    const commands = [...props.docs.commands]

    if (props.showPlugins) {
      props.docs.plugins.forEach(plugin => {
        commands.push(...plugin.commands)
      })
    }

    return commands
  })

  // Handle keyboard input
  function handleKey(key: string) {
    if (viewMode() === 'list') {
      switch (key) {
        case 'ArrowUp':
        case 'k':
          selectedIndex.$set(Math.max(0, selectedIndex() - 1))
          break

        case 'ArrowDown':
        case 'j':
          selectedIndex.$set(Math.min(allCommands().length - 1, selectedIndex() + 1))
          break

        case 'Enter':
        case ' ':
          const cmd = allCommands()[selectedIndex()]
          if (cmd) {
            selectedCommand.$set(cmd)
            viewMode.$set('detail')
          }
          break

        case 'q':
          process.exit(0)
          break
      }
    } else {
      // Detail view
      switch (key) {
        case 'Escape':
        case 'Backspace':
        case 'q':
          viewMode.$set('list')
          selectedCommand.$set(null)
          break
      }
    }
  }

  // Render command list
  function renderList(): JSX.Element {
    const lines: JSX.Element[] = []

    // Header
    lines.push(
      <box key="header" padding={[1, 2]}>
        <text bold color="cyan">
          {props.docs.name} - Help
        </text>
        {props.docs.version && (
          <text color="gray"> v{props.docs.version}</text>
        )}
      </box>
    )

    if (props.docs.description) {
      lines.push(
        <box key="desc" padding={[0, 2, 1, 2]}>
          <text color="gray">{props.docs.description}</text>
        </box>
      )
    }

    // Commands
    lines.push(
      <box key="commands-header" padding={[0, 2]}>
        <text bold color="yellow">Available Commands:</text>
      </box>
    )

    allCommands().forEach((cmd, index) => {
      const isSelected = index === selectedIndex()
      const bg = isSelected ? 'blue' : undefined
      const color = isSelected ? 'white' : 'gray'

      lines.push(
        <box key={`cmd-${index}`} padding={[0, 2]} background={bg}>
          <text color={color}>
            {isSelected ? '> ' : '  '}
            {cmd.name.padEnd(20)} {cmd.description || ''}
          </text>
        </box>
      )
    })

    // Footer
    lines.push(
      <box key="footer" padding={[1, 2, 0, 2]}>
        <text color="gray">
          Use ↑↓ to navigate, Enter to view details, q to quit
        </text>
      </box>
    )

    return <box flexDirection="column">{lines}</box>
  }

  // Render command detail
  function renderDetail(): JSX.Element {
    const cmd = selectedCommand()
    if (!cmd) {
      return <text>No command selected</text>
    }

    // Generate help text
    const helpText = Effect.runSync(generateCommandHelp(cmd))

    return (
      <box flexDirection="column" padding={2}>
        <text color="cyan" bold>{cmd.name}</text>
        {cmd.description && (
          <text color="gray">{cmd.description}</text>
        )}

        <box marginTop={1}>
          <text>{helpText}</text>
        </box>

        <box marginTop={1}>
          <text color="gray">Press Esc or q to go back</text>
        </box>
      </box>
    )
  }

  // Set up keyboard listener
  $effect(() => {
    // Note: In real implementation, this would use input service
    // For now, this is a placeholder showing the pattern
    const listener = (key: string) => handleKey(key)
    // input.on('key', listener)
    // return () => input.off('key', listener)
  })

  return (
    <box flexDirection="column" width="100%" height="100%">
      {viewMode() === 'list' ? renderList() : renderDetail()}
    </box>
  )
}
