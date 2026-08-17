/**
 * Toast Component - Notification toast for terminal UI
 *
 * @example
 * ```tsx
 * import { Toast } from '@tuix/ui'
 *
 * function NotificationExample() {
 *   const open = $state(true)
 *   return (
 *     <Toast
 *       kind="success"
 *       message="File saved successfully!"
 *       icon="✓"
 *       duration={4000}
 *       onDismiss={() => open.$set(false)}
 *     />
 *   )
 * }
 * ```
 */

/** @jsxImportSource @tuix/jsx */

import { $effect } from '@tuix/reactive'
import { useUITheme, type ThemeVariant } from '../../../theme'

export type ToastKind = 'info' | 'success' | 'warning' | 'danger' | 'error'

export interface ToastProps {
  open?: boolean
  kind?: ToastKind
  message?: string
  icon?: string
  /** Auto-dismiss after this many ms. Requires `onDismiss`. */
  duration?: number
  onDismiss?: () => void
  children?: JSX.Element | JSX.Element[]
  className?: string
}

const TOAST_ICONS: Record<ToastKind, string> = {
  info: 'ℹ',
  success: '✓',
  warning: '⚠',
  danger: '✖',
  error: '✖',
}

function kindVariant(kind: ToastKind): ThemeVariant {
  if (kind === 'success') return 'success'
  if (kind === 'warning') return 'warning'
  if (kind === 'danger' || kind === 'error') return 'error'
  return 'info'
}

/**
 * Toast Component - Individual toast notification
 */
export function Toast(props: ToastProps): JSX.Element | null {
  const open = props.open !== false
  if (!open) return null

  const kind = props.kind || 'info'
  const { theme, getColor, depth } = useUITheme()
  const accent = getColor(kindVariant(kind))
  const icon = props.icon || TOAST_ICONS[kind]

  if (props.duration && props.onDismiss) {
    const dismiss = props.onDismiss
    $effect(() => {
      const timer = setTimeout(() => dismiss(), props.duration)
      return () => clearTimeout(timer)
    })
  }

  return (
    <box
      border="thin"
      borderColor={accent}
      background={depth.surface}
      className={props.className}
      padding={0}
    >
      <hstack gap={1} align="middle">
        <text fg={accent}>{icon}</text>
        {props.message ? <text fg={theme.colors.fg}>{props.message}</text> : null}
        {props.children}
      </hstack>
    </box>
  )
}

// Factory function
export const toast = (props: ToastProps) => <Toast {...props} />

// Convenience factory functions for specific toast types
export const infoToast = (message: string, icon?: string) => (
  <Toast kind="info" message={message} icon={icon} />
)

export const successToast = (message: string, icon?: string) => (
  <Toast kind="success" message={message} icon={icon} />
)

export const warningToast = (message: string, icon?: string) => (
  <Toast kind="warning" message={message} icon={icon} />
)

export const errorToast = (message: string, icon?: string) => (
  <Toast kind="error" message={message} icon={icon} />
)

export const dangerToast = (message: string, icon?: string) => (
  <Toast kind="danger" message={message} icon={icon} />
)
