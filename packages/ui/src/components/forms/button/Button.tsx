/** @jsxImportSource @tuix/jsx */

import { labelOf } from '../../../bind'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'ghost'
  | 'default'
export type ButtonSize = 'small' | 'medium' | 'large' | 'default'

export interface ButtonProps {
  children?: unknown
  label?: string
  variant?: ButtonVariant
  size?: ButtonSize
  onClick?: () => void | Promise<void>
  disabled?: boolean
  loading?: boolean
  focused?: boolean
  id?: string
  className?: string
  type?: 'button' | 'submit' | 'cancel'
}

function decorate(label: string, variant: ButtonVariant, size: ButtonSize): string {
  const marked = (() => {
    switch (variant) {
      case 'danger':
        return `! ${label}`
      case 'success':
        return `✓ ${label}`
      case 'warning':
        return `! ${label}`
      default:
        return label
    }
  })()
  switch (size) {
    case 'small':
      return marked
    case 'large':
      return `  ${marked}  `
    case 'medium':
      return ` ${marked} `
    case 'default':
    default:
      return marked
  }
}

/**
 * Action trigger. Composes the `<button>` intrinsic.
 *
 * The `<button>` intrinsic registers as focusable (Tab cycles to it),
 * normalizes keys, and fires `onClick` on Enter/Space. Theme colors are
 * resolved through the `variant` prop (read by `paintCell` via
 * `themeColor`), so this layer no longer needs `useUITheme` /
 * `variantColor` boilerplate.
 *
 * @example
 * ```tsx
 * <Button variant="primary" onClick={save}>Save</Button>
 * ```
 */
export function Button(props: ButtonProps): JSX.Element {
  const variant = props.variant ?? 'default'
  const size = props.size ?? 'default'
  const raw = labelOf(props.children, props.label ?? '')
  const label = props.loading ? `… ${raw}` : raw
  const disabled = Boolean(props.disabled || props.loading)
  const decorated = decorate(label, variant, size)

  if (variant === 'ghost') {
    return (
      <text className={props.className} variant="dim">
        {decorated}
      </text>
    )
  }

  return (
    <button
      id={props.id}
      className={props.className}
      label={decorated}
      focused={props.focused === true}
      disabled={disabled}
      variant={variant}
      onClick={disabled ? undefined : props.onClick}
    />
  )
}

export const button = (props: ButtonProps) => <Button {...props} />
export const primaryButton = (props: ButtonProps) => <Button {...props} variant="primary" />
export const secondaryButton = (props: ButtonProps) => <Button {...props} variant="secondary" />
export const successButton = (props: ButtonProps) => <Button {...props} variant="success" />
export const dangerButton = (props: ButtonProps) => <Button {...props} variant="danger" />
export const warningButton = (props: ButtonProps) => <Button {...props} variant="warning" />
export const infoButton = (props: ButtonProps) => <Button {...props} variant="info" />
export const ghostButton = (props: ButtonProps) => <Button {...props} variant="ghost" />

export function ButtonGroup({ children }: { children?: unknown }): JSX.Element {
  return <hstack gap={2}>{children}</hstack>
}

export function SubmitCancelButtons(props: {
  onSubmit: () => void
  onCancel: () => void
  submitText?: string
  cancelText?: string
  loading?: boolean
}): JSX.Element {
  return (
    <ButtonGroup>
      <Button variant="primary" onClick={props.onSubmit} loading={props.loading}>
        {props.submitText || 'Submit'}
      </Button>
      <Button variant="secondary" onClick={props.onCancel} disabled={props.loading}>
        {props.cancelText || 'Cancel'}
      </Button>
    </ButtonGroup>
  )
}
