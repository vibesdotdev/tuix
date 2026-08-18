/** @jsxImportSource @tuix/jsx */

import { labelOf } from '../../../bind'
import { useUITheme } from '../../../theme'

export interface KbdProps {
  keys?: string
  children?: unknown
  className?: string
}

/** Normalize a key chord for display: `ctrl+s` → `^S`, `enter` → `Enter`. */
export function formatKeys(keys: string): string {
  const parts = keys
    .split('+')
    .map(part => part.trim())
    .filter(part => part.length > 0)
    .map(part => {
      const lower = part.toLowerCase()
      if (lower === 'ctrl' || lower === 'control') return '^'
      if (lower === 'alt' || lower === 'option') return '⌥'
      if (lower === 'shift') return '⇧'
      if (lower === 'cmd' || lower === 'meta' || lower === 'command') return '⌘'
      if (lower === 'enter' || lower === 'return') return 'Enter'
      if (lower === 'esc' || lower === 'escape') return 'Esc'
      if (lower === 'space') return 'Space'
      if (lower === 'tab') return 'Tab'
      if (lower === 'up') return '↑'
      if (lower === 'down') return '↓'
      if (lower === 'left') return '←'
      if (lower === 'right') return '→'
      if (lower.length === 1) return lower
      // Combos and words render as typed (j/k, ctrl+c, 1/2/3)
      return part
    })
  return parts.join('')
}

/**
 * One keyboard chip: `[Tab]`. Pairs with a plain label for hints.
 *
 * @example
 * ```tsx
 * <hstack gap={1}>
 *   <Kbd>/</Kbd>
 *   <text>command palette</text>
 * </hstack>
 * ```
 */
export function Kbd(props: KbdProps): JSX.Element {
  const { theme } = useUITheme()
  const keys = formatKeys(props.keys ?? labelOf(props.children))
  return (
    <text className={props.className} fg={theme.colors.textBright ?? theme.colors.fg}>
      {`[${keys}]`}
    </text>
  )
}

export function KbdHint(props: KbdProps & { label?: string }): JSX.Element {
  const { theme } = useUITheme()
  return (
    <hstack gap={1}>
      <Kbd keys={props.keys}>{props.children}</Kbd>
      {props.label ? <text fg={theme.colors.textDim}>{props.label}</text> : null}
    </hstack>
  )
}

export const kbd = (props: KbdProps) => <Kbd {...props} />
