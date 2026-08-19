/** @jsxImportSource @tuix/jsx */

import { useUITheme } from '../../../theme'
import { stringWidth } from '@tuix/view/string/width'

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
  /** Fixed width in cells, or 'fill' for the full terminal width. */
  width?: number | 'fill'
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
  // Use visual width (not UTF-16 length) so wide glyphs count correctly.
  const total = segments.reduce((sum, segment) => sum + stringWidth(segment.text), 0)
  if (typeof width !== 'number' || width <= 0 || total <= width) return segments

  let budget = Math.max(1, width - 1)
  const clipped: StatusSegment[] = []
  for (const segment of segments) {
    if (budget <= 0) break
    const segmentWidth = stringWidth(segment.text)
    if (segmentWidth <= budget) {
      clipped.push(segment)
      budget -= segmentWidth
    } else {
      let text = ''
      let used = 0
      for (const char of segment.text) {
        const charWidth = stringWidth(char)
        if (used + charWidth > budget) break
        text += char
        used += charWidth
      }
      clipped.push({ text, tone: segment.tone })
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
  const resolved =
    props.width === 'fill'
      ? (process.stdout.columns ?? 80)
      : typeof props.width === 'number'
        ? props.width
        : undefined
  const clipped =
    resolved !== undefined && resolved > 0 ? clipStatusBarSegments(segments, resolved) : segments
  return clipped.map(segment => segment.text).join('')
}

export function StatusBar(props: StatusBarProps): JSX.Element {
  const { theme } = useUITheme()
  const resolvedWidth =
    props.width === 'fill'
      ? (process.stdout.columns ?? 80)
      : (props.width ?? Number.POSITIVE_INFINITY)
  const segments = clipStatusBarSegments(formatStatusBarSegments(props), resolvedWidth)

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
