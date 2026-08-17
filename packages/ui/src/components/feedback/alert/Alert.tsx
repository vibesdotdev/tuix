/** @jsxImportSource @tuix/jsx */

import { labelOf } from '../../../bind'
import { useUITheme, type ThemeVariant } from '../../../theme'

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger'

export interface AlertProps {
  variant?: AlertVariant
  title?: string
  children?: unknown
  message?: string
  className?: string
}

const ALERT_GLYPH: Record<AlertVariant, string> = {
  info: 'ℹ',
  success: '✓',
  warning: '⚠',
  danger: '✖',
}

/**
 * Inline (non-modal) callout. Sits in flow — unlike `Modal` it never covers
 * the surface or takes focus.
 *
 * @example
 * ```tsx
 * <Alert variant="warning" title="Read-only">Workspace is in review mode.</Alert>
 * ```
 */
export function Alert(props: AlertProps): JSX.Element {
  const { depth, getColor, theme } = useUITheme()
  const variant = props.variant ?? 'info'
  const accent = getColor(variant as ThemeVariant)
  const body = props.message ?? labelOf(props.children)

  return (
    <box
      className={props.className}
      background={depth.surface}
      border="thin"
      borderColor={accent}
      padding={0}
    >
      <hstack gap={1}>
        <text fg={accent}>{ALERT_GLYPH[variant]}</text>
        {props.title ? <text fg={accent}>{props.title}</text> : null}
        {body ? <text fg={theme.colors.fg}>{body}</text> : null}
      </hstack>
    </box>
  )
}

export const alert = (props: AlertProps) => <Alert {...props} />
export const infoAlert = (message: string, title?: string) => (
  <Alert variant="info" message={message} title={title} />
)
export const successAlert = (message: string, title?: string) => (
  <Alert variant="success" message={message} title={title} />
)
export const warningAlert = (message: string, title?: string) => (
  <Alert variant="warning" message={message} title={title} />
)
export const dangerAlert = (message: string, title?: string) => (
  <Alert variant="danger" message={message} title={title} />
)
