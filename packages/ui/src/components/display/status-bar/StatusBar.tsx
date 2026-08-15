/** @jsxImportSource @tuix/jsx */

import { useUITheme } from '../../../theme'

export interface StatusFact {
  slot: string
  value: string
  tone?: 'default' | 'muted' | 'warning' | 'danger' | 'success'
}

export interface StatusHint {
  keys: string
  label: string
}

export interface StatusBarProps {
  facts?: StatusFact[]
  hints?: StatusHint[]
  width?: number
}

export function formatStatusBar(props: StatusBarProps): string {
  const facts = (props.facts ?? []).map(fact => fact.value).filter(value => value.trim().length > 0)
  const hints = (props.hints ?? [])
    .filter(hint => hint.keys && hint.label)
    .map(hint => `[${hint.keys}] ${hint.label}`)
  const line = [...facts, ...hints].join('  ·  ')
  const width = props.width
  if (typeof width === 'number' && width > 0 && line.length > width) {
    return `${line.slice(0, Math.max(1, width - 1))}…`
  }
  return line
}

export function StatusBar(props: StatusBarProps): JSX.Element {
  const { theme } = useUITheme()
  return <text fg={theme.colors.textDim}>{formatStatusBar(props)}</text>
}
