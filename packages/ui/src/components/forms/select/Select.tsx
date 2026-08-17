/** @jsxImportSource @tuix/jsx */

import { $state } from '@tuix/reactive'
import type { BindableRune, StateRune } from '@tuix/reactive'
import { readBound } from '../../../bind'
import { Input } from '../text-input/TextInput'

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

function matches<T>(option: SelectOption<T>, query: string): boolean {
  if (query.length === 0) return true
  return option.label.toLowerCase().includes(query.toLowerCase())
}

/**
 * Closed field that shows the current option. Pass `open` to list the rest;
 * with `searchable`, an inline query field filters the list.
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
  const searchable = Boolean(props.searchable) && Boolean(props.open)
  const query = $state('', 'select-query')

  function pick(option: SelectOption<T>) {
    if (disabled || option.disabled) return
    const bound = props['bind:value']
    bound?.$set(option.value)
    props.onChange?.(option.value)
  }

  const visible = searchable
    ? props.options.filter(option => matches(option, query()))
    : props.options

  return (
    <vstack className={props.className}>
      <button
        label={`${label} ▾`}
        disabled={disabled}
        onClick={disabled ? undefined : props.onFocus}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
      />
      {searchable ? (
        <Input bind:value={query} placeholder="Filter…" focused width={props.width} />
      ) : null}
      {props.open
        ? visible.map(option => {
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
