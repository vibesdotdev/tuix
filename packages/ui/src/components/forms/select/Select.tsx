/** @jsxImportSource @tuix/jsx */

import type { BindableRune, StateRune } from '@tuix/reactive'
import { readBound } from '../../../bind'

export interface SelectOption<T = string> {
  value: T
  label: string
  disabled?: boolean
}

export interface SelectProps<T = string> {
  value?: T
  'bind:value'?: BindableRune<T> | StateRune<T>
  options: SelectOption<T>[]
  placeholder?: string
  open?: boolean
  highlighted?: T
  width?: number
  onChange?: (value: T) => void
  onFocus?: () => void
  onBlur?: () => void
  disabled?: boolean
  searchable?: boolean
  className?: string
}

/**
 * Closed field that shows the current option. Pass `open` to list the rest.
 *
 * @example
 * ```tsx
 * <Select bind:value={kind} options={kinds} />
 * ```
 */
export function Select<T = string>(props: SelectProps<T>): JSX.Element {
  const current = (readBound(props['bind:value']) ?? props.value) as T | undefined
  const selected = props.options.find(option => Object.is(option.value, current))
  const label = selected?.label ?? props.placeholder ?? 'Select…'
  const disabled = Boolean(props.disabled)

  function pick(option: SelectOption<T>) {
    if (disabled || option.disabled) return
    const bound = props['bind:value']
    bound?.$set(option.value)
    props.onChange?.(option.value)
  }

  return (
    <vstack className={props.className}>
      <button
        label={`${label} ▾`}
        disabled={disabled}
        onClick={disabled ? undefined : props.onFocus}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
      />
      {props.open
        ? props.options.map(option => {
            const active = Object.is(option.value, current)
            const mark = active ? '> ' : option.disabled ? '· ' : '  '
            return (
              <interactive
                key={String(option.value)}
                focusable={!option.disabled}
                onClick={() => pick(option)}
                onKeyPress={key => key === 'Enter' && pick(option)}
              >
                <text>{`${mark}${option.label}`}</text>
              </interactive>
            )
          })
        : null}
    </vstack>
  )
}

export function select<T = string>(props: SelectProps<T>): JSX.Element {
  return <Select {...props} />
}
