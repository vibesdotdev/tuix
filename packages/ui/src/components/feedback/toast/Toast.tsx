/**
 * Toast Component - Notification toast for terminal UI
 *
 * @example
 * ```tsx
 * import { Toast } from '@tuix/ui'
 *
 * function NotificationExample() {
 *   return (
 *     <Toast
 *       kind="success"
 *       message="File saved successfully!"
 *       icon="✓"
 *     />
 *   )
 * }
 * ```
 */

import { style, colors, Borders } from '@tuix/ansi'

export type ToastKind = 'info' | 'success' | 'warning' | 'danger' | 'error'

export interface ToastProps {
  open?: boolean
  kind?: ToastKind
  message?: string
  icon?: string
  children?: JSX.Element | JSX.Element[]
  className?: string
}

// Toast variant styles (preserved from intrinsic)
const TOAST_VARIANTS = {
  info: { background: colors.blue, foreground: colors.white },
  success: { background: colors.green, foreground: colors.black },
  warning: { background: colors.yellow, foreground: colors.black },
  danger: { background: colors.red, foreground: colors.white },
  error: { background: colors.red, foreground: colors.white },
}

/**
 * Toast Component - Individual toast notification
 */
export function Toast(props: ToastProps): JSX.Element | null {
  const open = props.open !== false
  if (!open) return null

  const kind = props.kind || 'info'
  const variantStyle = TOAST_VARIANTS[kind] || TOAST_VARIANTS.info

  const toastStyle = style()
    .background(variantStyle.background)
    .foreground(variantStyle.foreground)
    .padding(0, 2)

  return (
    <box
      border={Borders.Thin}
      borderColor={variantStyle.background}
      style={toastStyle}
      className={props.className}
    >
      <hstack gap={1} align="middle">
        {props.icon && (
          <text style={style().foreground(variantStyle.foreground)}>{props.icon}</text>
        )}
        {props.message ? <text>{props.message}</text> : props.children ? props.children : null}
      </hstack>
    </box>
  )
}

// Factory function
export const toast = (props: ToastProps) => <Toast {...props} />

// Convenience factory functions for specific toast types
export const infoToast = (message: string, icon?: string) => (
  <Toast kind="info" message={message} icon={icon || 'ℹ'} />
)

export const successToast = (message: string, icon?: string) => (
  <Toast kind="success" message={message} icon={icon || '✓'} />
)

export const warningToast = (message: string, icon?: string) => (
  <Toast kind="warning" message={message} icon={icon || '⚠'} />
)

export const errorToast = (message: string, icon?: string) => (
  <Toast kind="error" message={message} icon={icon || '✖'} />
)

export const dangerToast = (message: string, icon?: string) => (
  <Toast kind="danger" message={message} icon={icon || '✖'} />
)
