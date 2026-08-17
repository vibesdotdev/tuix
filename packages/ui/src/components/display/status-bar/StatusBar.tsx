/** @jsxImportSource @tuix/jsx */

import { useUITheme } from '../../../theme'

export type StatusTone = 'default' | 'muted' | 'warning' | 'danger' | 'success'

export interface StatusFact {
  slot: string
  value: string
  tone?: StatusTone
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

export interface StatusSegment {
  text: string
  tone: StatusTone | 'hint'
}

const SEPARATOR = '  ·  '

/** Facts and hints as colored segments; separators and hints render dim. */
export function formatStatusBarSegments(props: StatusBarProps): StatusSegment[] {
  const facts = (props.facts ?? [])
    .filter(fact => fact.value.trim().length > 0)
    .map(fact => ({ text: fact.value, tone: fact.tone ?? 'muted' }) as StatusSegment)
  const hints = (props.hints ?? [])
    .filter(hint => hint.keys && hint.label)
    .map(hint => ({ text: `[${hint.keys}] ${hint.label}`, tone: 'hint' }) as StatusSegment)

  const segments: StatusSegment[] = []
  for (const segment of [...facts, ...hints]) {
    if (segments.length > 0) segments.push({ text: SEPARATOR, tone: 'muted' })
    segments.push(segment)
  }
  return segments
}

/** Clip segments to `width` visible columns, appending `…` when cut. */
export function clipStatusBarSegments(segments: StatusSegment[], width: number): StatusSegment[] {
  const total = segments.reduce((sum, segment) => sum + segment.text.length, 0)
  if (typeof width !== 'number' || width <= 0 || total <= width) return segments

  let budget = Math.max(1, width - 1)
  const clipped: StatusSegment[] = []
  for (const segment of segments) {
    if (budget <= 0) break
    if (segment.text.length <= budget) {
      clipped.push(segment)
      budget -= segment.text.length
    } else {
      clipped.push({ text: segment.text.slice(0, budget), tone: segment.tone })
      budget = 0
    }
  }
  const last = clipped[clipped.length - 1]
  if (last) {
    clipped[clipped.length - 1] = { text: `${last.text}…`, tone: last.tone }
  }
  return clipped
}

export function formatStatusBar(props: StatusBarProps): string {
  const segments = formatStatusBarSegments(props)
  const width = props.width
  const clipped =
    typeof width === 'number' && width > 0 ? clipStatusBarSegments(segments, width) : segments
  return clipped.map(segment => segment.text).join('')
}

export function StatusBar(props: StatusBarProps): JSX.Element {
  const { theme } = useUITheme()
  const segments = clipStatusBarSegments(
    formatStatusBarSegments(props),
    props.width ?? Number.POSITIVE_INFINITY
  )

  function colorOf(tone: StatusSegment['tone']): string {
    switch (tone) {
      case 'warning':
        return theme.colors.warning
      case 'danger':
        return theme.colors.danger
      case 'success':
        return theme.colors.success
      case 'default':
        return theme.colors.fg
      default:
        return theme.colors.textDim
    }
  }

  return (
    <hstack>
      {segments.map((segment, index) => (
        <text key={index} fg={colorOf(segment.tone)}>
          {segment.text}
        </text>
      ))}
    </hstack>
  )
}
