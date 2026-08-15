/** @jsxImportSource @tuix/jsx */

import { colors } from '@tuix/ansi'
import type { BindableRune, StateRune } from '@tuix/reactive'
import { readBound } from '../../../bind'
import { useUITheme } from '../../../theme'

export type EchoMode = 'normal' | 'password' | 'none'
export type CursorStyle = 'block' | 'underline' | 'bar' | 'blink'

export interface InputProps {
  value?: string
  'bind:value'?: BindableRune<string> | StateRune<string>
  placeholder?: string
  width?: number
  echoMode?: EchoMode
  charLimit?: number
  cursorStyle?: CursorStyle
  onSubmit?: (value: string) => void
  onChange?: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
  disabled?: boolean
  focused?: boolean
  className?: string
}

export type TextInputProps = InputProps

/**
 * Single-line field. Composes the `<input>` intrinsic.
 *
 * @example
 * ```tsx
 * <Input bind:value={name} placeholder="Name" />
 * ```
 */
export function Input(props: InputProps): JSX.Element {
  const { depth, theme } = useUITheme()
  const raw = String(readBound(props['bind:value']) ?? props.value ?? '')
  const echo = props.echoMode ?? 'normal'
  const displayed = echo === 'password' ? '•'.repeat(raw.length) : echo === 'none' ? '' : raw

  return (
    <box background={depth.inset} border="thin" borderColor={depth.outset} padding={0}>
      <input
        className={props.className}
        value={displayed}
        placeholder={props.placeholder}
        focused={props.focused}
        disabled={props.disabled}
        fg={props.focused ? theme.colors.primary : colors.white}
        bind:value={echo === 'normal' ? props['bind:value'] : undefined}
        onChange={props.disabled ? undefined : props.onChange}
        onSubmit={props.disabled ? undefined : props.onSubmit}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
      />
    </box>
  )
}

export const TextInput = Input

export const textInput = (props: InputProps) => <Input {...props} />
export const passwordInput = (props: InputProps) => <Input {...props} echoMode="password" />
export const emailInput = (props: InputProps) => (
  <Input {...props} placeholder={props.placeholder ?? 'email@example.com'} />
)
export const numberInput = (props: InputProps) => <Input {...props} />
