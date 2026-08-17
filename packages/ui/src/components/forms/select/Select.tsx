/** @jsxImportSource @tuix/jsx */

import { $state } from '@tuix/reactive'
import type { BindableRune, StateRune } from '@tuix/reactive'
import { readBound } from '../../../bind'
import { useUITheme } from '../../../theme'
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
  onClose?: () => void
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
 * with `searchable`, an inline query field filters the list. While open,
 * ↑/↓ (or j/k) move the cursor, Enter picks, Esc calls `onClose`.
 *
 * @example
 * ```tsx
 * <Select bind:value={kind} options={kinds} />
 * ```
 */
export function Select<T = string>(props: SelectProps<T>): JSX.Element {
  const { theme } = useUITheme()
  const current = (readBound(props['bind:value']) ?? props.value) as T | undefined
  const selected = props.options.find(option => Object.is(option.value, current))
  const label = selected?.label ?? props.placeholder ?? 'Select…'
  const disabled = Boolean(props.disabled)
  const searchable = Boolean(props.searchable) && Boolean(props.open)
  const query = $state('', 'select-query')
  const cursor = $state(0, 'select-cursor')

  function pick(option: SelectOption<T>) {
    if (disabled || option.disabled) return
    const bound = props['bind:value']
    bound?.$set(option.value)
    props.onChange?.(option.value)
    props.onClose?.()
  }

  const visible = searchable
    ? props.options.filter(option => matches(option, query()))
    : props.options

  function stepCursor(delta: number) {
    if (visible.length === 0) return
    cursor.$set((cursor() + delta + visible.length) % visible.length)
  }

  function handleListKeys(key: string): boolean {
    const lower = key.toLowerCase()
    if (lower === 'up' || lower === 'k' || lower === 'ctrl+p') {
      stepCursor(-1)
      return true
    }
    if (lower === 'down' || lower === 'j' || lower === 'ctrl+n') {
      stepCursor(1)
      return true
    }
    if (lower === 'enter') {
      const option = visible[cursor()]
      if (option) pick(option)
      return true
    }
    if ((lower === 'escape' || lower === 'esc') && props.onClose) {
      props.onClose()
      return true
    }
    return false
  }

  const activeIndex = (() => {
    if (cursor() >= 0 && cursor() < visible.length) return cursor()
    const legacy = props.highlighted
      ? visible.findIndex(option => Object.is(option.value, props.highlighted))
      : -1
    return legacy >= 0 ? legacy : -1
  })()

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
        ? visible.map((option, index) => {
            const isCursor = index === activeIndex
            const isSelected = Object.is(option.value, current)
            const mark = isCursor ? '> ' : option.disabled ? '· ' : '  '
            const suffix = isSelected ? ' ✓' : ''
            return (
              <interactive
                key={String(option.value)}
                focusable={!option.disabled}
                onClick={() => pick(option)}
                onKeyPress={key => {
                  if (key === 'Enter') {
                    pick(option)
                    return
                  }
                  handleListKeys(key)
                }}
              >
                <text fg={isCursor ? theme.colors.primary : undefined}>
                  {`${mark}${option.label}${suffix}`}
                </text>
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
