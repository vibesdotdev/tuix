/**
 * @tuix/ui - KeyBar component
 *
 * Contextual keyboard shortcut footer bar. Shows available actions
 * based on current focus/state. The canonical progressive disclosure
 * pattern: always-visible hints → '?' full overlay → docs.
 */

import { style, colors } from '@tuix/ansi'
import { useUITheme } from '../../../theme'
import { KeyHintGlyph } from '../../../glyphs'

/**
 * A single key binding hint.
 */
export interface KeyHint {
  /** The key or key combination (e.g., 'q', 'ctrl+c', '/', '?') */
  key: string
  /** Short action label (e.g., 'quit', 'search', 'help') */
  label: string
  /** Whether this hint is currently active/available */
  enabled?: boolean
}

/**
 * KeyBar props
 */
export interface KeyBarProps {
  /** Array of key hints to display */
  hints: KeyHint[]
  /** Separator between hints (default: ' │ ') */
  separator?: string
  /** Alignment (default: 'left') */
  align?: 'left' | 'center' | 'right'
  /** Maximum width (truncates hints that don't fit) */
  maxWidth?: number
}

/**
 * KeyBar component
 *
 * Renders a compact row of keyboard shortcut hints. Typically placed
 * at the bottom of the screen as a persistent footer.
 *
 * @example
 * ```tsx
 * <KeyBar hints={[
 *   { key: 'q', label: 'quit' },
 *   { key: '/', label: 'search' },
 *   { key: '?', label: 'help' },
 *   { key: 'tab', label: 'next panel' },
 * ]} />
 * ```
 */
export function KeyBar(props: KeyBarProps): JSX.Element {
  const { theme, depth } = useUITheme()
  const separator = props.separator ?? ' │ '

  // Build hint fragments
  const fragments: JSX.Element[] = []
  const hints = props.hints.filter(h => h.enabled !== false)

  for (let i = 0; i < hints.length; i++) {
    const hint = hints[i]!
    if (i > 0) {
      fragments.push(
        <text style={style().foreground(theme.colors.border ?? theme.colors.textDim ?? colors.gray)}>
          {separator}
        </text>
      )
    }
    // Key in accent/bright, label in dim
    fragments.push(
      <text style={style().foreground(theme.colors.primary ?? theme.colors.info ?? colors.cyan).bold(true)}>
        {hint.key}
      </text>
    )
    fragments.push(
      <text style={style().foreground(theme.colors.textDim ?? colors.gray)}>
        {' ' + hint.label}
      </text>
    )
  }

  return (
    <box style={style().foreground(theme.colors.textDim ?? colors.gray)}>
      <hstack>{...fragments}</hstack>
    </box>
  )
}

/**
 * KeyBar factory function
 */
export function keyBar(props: KeyBarProps): JSX.Element {
  return <KeyBar {...props} />
}
