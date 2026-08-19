/** @jsxImportSource @tuix/jsx */

import { colors } from '@tuix/ansi'
import type { BindableRune, StateRune } from '@tuix/reactive'
import { readBound } from '../../../bind'
import { useUITheme } from '../../../theme'
import { email } from '../../../validation'

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
    <box border="thin" borderColor={props.focused ? theme.colors.primary : depth.outset} padding={0}>
      <input
        className={props.className}
        value={displayed}
        placeholder={props.placeholder}
        width={props.width}
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

/** Numeric field: typing filters to digits, sign, and one decimal point. */
export function NumberInput(props: InputProps): JSX.Element {
  function clean(value: string): string {
    const stripped = value.replace(/[^0-9.\-]/g, '')
    const negative = stripped.startsWith('-')
    const unsigned = negative ? stripped.slice(1) : stripped
    const [whole = '', ...rest] = unsigned.split('.')
    const fraction = rest.join('').slice(0, 1)
    const rebuilt = rest.length > 0 ? `${whole}.${fraction}` : whole
    return negative && rebuilt !== '' ? `-${rebuilt}` : rebuilt
  }

  return (
    <Input
      {...props}
      placeholder={props.placeholder ?? '0'}
      onChange={value => {
        const cleaned = clean(value)
        const bound = props['bind:value']
        if (bound && cleaned !== value) bound.$set(cleaned)
        props.onChange?.(cleaned)
      }}
    />
  )
}

export const numberInput = (props: InputProps) => <NumberInput {...props} />

/** Email field with inline validation once a value is typed. */
export function EmailInput(props: InputProps & { errorMessage?: string }): JSX.Element {
  const raw = String(readBound(props['bind:value']) ?? props.value ?? '')
  const typed = raw.trim().length > 0
  const invalid = typed ? email()(raw) : null

  return (
    <vstack>
      <Input {...props} placeholder={props.placeholder ?? 'email@example.com'} />
      {invalid ? <text fg={themeDanger()}>{props.errorMessage ?? invalid}</text> : null}
    </vstack>
  )
}

function themeDanger(): string {
  return useUITheme().getColor('error')
}

export const emailInput = (props: InputProps & { errorMessage?: string }) => (
  <EmailInput {...props} />
)
