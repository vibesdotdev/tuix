/**
 * @tuix/docs - Interactive help explorer component
 *
 * Keyboard navigation is MVU-backed:
 * - named $state.$set → bindMvuPush → UserMsg { type: 'set' } → model update → re-paint
 * - keys via registerKeyHandler (Runtime KeyPress), not raw stdin $effect every frame
 */

import { $state, $derived, registerKeyHandler } from '@tuix/reactive'
import type { AppDoc, CommandDoc } from '../types'
import { generateCommandHelp } from '../generator/help-text'
import { Effect } from 'effect'

export interface HelpExplorerProps {
  docs: AppDoc
  initialCommand?: string
  showPlugins?: boolean
}

/** One stdin/key bridge per process for HelpExplorer (avoids 60fps listener leak). */
let helpKeyCleanup: (() => void) | null = null
let helpKeyOwner: symbol | null = null

function ensureHelpKeys(onKey: (key: string) => void): void {
  const owner = Symbol('HelpExplorer')
  // Replace prior owner (re-mount)
  if (helpKeyCleanup) {
    helpKeyCleanup()
    helpKeyCleanup = null
  }
  helpKeyOwner = owner
  helpKeyCleanup = registerKeyHandler(key => {
    if (helpKeyOwner !== owner) return
    onKey(key)
  })
}

/**
 * Interactive help browser.
 * Controls: ↑↓/jk navigate · Enter detail · Esc back · q quit
 */
export function HelpExplorer(props: HelpExplorerProps): JSX.Element {
  const selectedIndex = $state(0, 'selectedIndex')
  const viewMode = $state<'list' | 'detail'>('list', 'viewMode')
  const selectedCommand = $state<CommandDoc | null>(null, 'selectedCommand')

  const allCommands = $derived(() => {
    const commands = [...(props.docs?.commands ?? [])]
    if (props.showPlugins && props.docs?.plugins) {
      for (const plugin of props.docs.plugins) {
        commands.push(...(plugin.commands ?? []))
      }
    }
    return commands
  })

  function handleKey(key: string) {
    const k = key.length === 1 ? key : key
    if (viewMode() === 'list') {
      if (k === 'up' || k === 'ArrowUp' || k === 'k') {
        selectedIndex.$set(Math.max(0, selectedIndex() - 1))
        return
      }
      if (k === 'down' || k === 'ArrowDown' || k === 'j') {
        const max = Math.max(0, allCommands().length - 1)
        selectedIndex.$set(Math.min(max, selectedIndex() + 1))
        return
      }
      if (k === 'enter' || k === 'Enter' || k === ' ') {
        const cmd = allCommands()[selectedIndex()]
        if (cmd) {
          selectedCommand.$set(cmd)
          viewMode.$set('detail')
        }
        return
      }
      if (k === 'q') {
        process.exit(0)
      }
    } else {
      if (k === 'escape' || k === 'Escape' || k === 'backspace' || k === 'Backspace' || k === 'q') {
        viewMode.$set('list')
        selectedCommand.$set(null)
      }
    }
  }

  // Mount key handler once per view construction (cleanup replaces previous)
  ensureHelpKeys(handleKey)

  function renderList(): JSX.Element {
    const lines: JSX.Element[] = []
    const cmds = allCommands()
    const idx = selectedIndex()

    lines.push(
      <box key="header" padding={[1, 2]}>
        <text bold color="cyan">
          {props.docs.name} — Help
        </text>
        {props.docs.version ? <text color="gray"> v{props.docs.version}</text> : null}
      </box>
    )

    if (props.docs.description) {
      lines.push(
        <box key="desc" padding={[0, 2, 1, 2]}>
          <text color="gray">{props.docs.description}</text>
        </box>
      )
    }

    lines.push(
      <box key="commands-header" padding={[0, 2]}>
        <text bold color="yellow">
          Available Commands:
        </text>
      </box>
    )

    if (cmds.length === 0) {
      lines.push(
        <box key="empty" padding={[0, 2]}>
          <text color="gray">No commands found.</text>
        </box>
      )
    }

    cmds.forEach((cmd, index) => {
      const isSelected = index === idx
      const bg = isSelected ? 'blue' : undefined
      const color = isSelected ? 'white' : 'gray'
      lines.push(
        <box key={`cmd-${index}`} padding={[0, 2]} background={bg}>
          <text color={color}>
            {isSelected ? '> ' : '  '}
            {String(cmd.name).padEnd(20)} {cmd.description || ''}
          </text>
        </box>
      )
    })

    lines.push(
      <box key="footer" padding={[1, 2, 0, 2]}>
        <text color="gray">↑↓/jk navigate · Enter details · q quit</text>
      </box>
    )

    return <box flexDirection="column">{lines}</box>
  }

  function renderDetail(): JSX.Element {
    const cmd = selectedCommand()
    if (!cmd) {
      return <text>No command selected</text>
    }

    let helpText = cmd.description || ''
    try {
      helpText = Effect.runSync(generateCommandHelp(cmd))
    } catch {
      /* keep description */
    }

    return (
      <box flexDirection="column" padding={2}>
        <text color="cyan" bold>
          {cmd.name}
        </text>
        {cmd.description ? <text color="gray">{cmd.description}</text> : null}
        <box marginTop={1}>
          <text>{helpText}</text>
        </box>
        <box marginTop={1}>
          <text color="gray">Esc/q back to list</text>
        </box>
      </box>
    )
  }

  return (
    <box flexDirection="column" width="100%" height="100%">
      {viewMode() === 'list' ? renderList() : renderDetail()}
    </box>
  )
}
;(HelpExplorer as { interactive?: boolean }).interactive = true
