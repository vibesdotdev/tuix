/**
 * Radio Component - Radio button group for terminal UI
 *
 * @example
 * ```tsx
 * import { Radio } from '@tuix/ui'
 *
 * function MyForm() {
 *   const theme = $state('dark')
 *
 *   return (
 *     <Radio
 *       bind:value={theme}
 *       options={[
 *         { value: 'dark', label: 'Dark Mode' },
 *         { value: 'light', label: 'Light Mode' },
 *         { value: 'auto', label: 'Auto' }
 *       ]}
 *     />
 *   )
 * }
 * ```
 */

import { $state, $derived, $effect } from '@tuix/reactive/runes/runes'
import { isFocused } from '@tuix/reactive'
import type { StateRune, BindableRune } from '@tuix/reactive/runes/runes'
import { isBindableRune, isStateRune } from '@tuix/reactive/runes/runes'
import { style, colors } from '@tuix/ansi'
import { useUITheme } from '../../../theme'

export interface RadioOption<T = string> {
  value: T
  label: string
  disabled?: boolean
}

export interface RadioProps<T = string> {
  value?: T
  'bind:value'?: BindableRune<T> | StateRune<T>
  options: RadioOption<T>[]
  onChange?: (value: T) => void
  onFocus?: () => void
  onBlur?: () => void
  disabled?: boolean
  className?: string
  direction?: 'vertical' | 'horizontal'
}

/**
 * Radio Component
 */
export function Radio<T = string>(props: RadioProps<T>): JSX.Element {
  const { theme } = useUITheme()
  const boundValue = props['bind:value']
  const localValue = $state<T | undefined>(props.value)
  const focusedIndex = $state(0)

  const direction = props.direction || 'vertical'

  const boundRune = boundValue as (StateRune<T> & { $key?: string }) | undefined
  const focusId = boundRune?.$key
    ? `bind:${boundRune.$key}`
    : props.className
      ? `interactive:${props.className}`
      : undefined
  const isFieldFocused = focusId ? isFocused(focusId) : false

  const currentValue = $derived(() => {
    if (boundValue && (isBindableRune(boundValue) || isStateRune(boundValue))) {
      return boundValue()
    }
    return localValue()
  })

  $effect(() => {
    if (boundValue && (isBindableRune(boundValue) || isStateRune(boundValue))) {
      if (boundValue() !== localValue()) {
        localValue.$set(boundValue())
      }
    }
  })

  function handleKeyPress(key: string) {
    if (props.disabled) return

    switch (key) {
      case 'up':
      case 'left':
        moveFocus(-1)
        break

      case 'down':
      case 'right':
        moveFocus(1)
        break

      case 'enter':
      case 'space': {
        const idx = Math.min(focusedIndex(), props.options.length - 1)
        const option = props.options[idx]
        if (option) selectOption(option.value)
        break
      }
    }
  }

  function moveFocus(delta: number) {
    const newIndex = focusedIndex() + delta
    if (newIndex >= 0 && newIndex < props.options.length) {
      focusedIndex.$set(newIndex)
    }
  }

  function selectOption(value: T) {
    const option = props.options.find(opt => opt.value === value)
    if (option && !option.disabled) {
      localValue.$set(value)
      if (boundValue && (isBindableRune(boundValue) || isStateRune(boundValue))) {
        boundValue.$set(value)
      }
      props.onChange?.(value)
    }
  }

  const Stack = direction === 'vertical' ? 'vstack' : 'hstack'

  return (
    <interactive
      onKeyPress={handleKeyPress}
      onFocus={() => {
        props.onFocus?.()
      }}
      onBlur={() => {
        props.onBlur?.()
      }}
      focusable={!props.disabled}
      focusId={focusId}
      className={props.className}
    >
      <Stack gap={direction === 'horizontal' ? 2 : 0}>
        {props.options.map((option, index) => {
          const isSelected = option.value === currentValue()
          const isFocusedOption = isFieldFocused && index === focusedIndex()
          const radioChar = isSelected ? '◉' : '○'

          let radioColor = theme.colors.textBright ?? theme.colors.fg ?? colors.white
          if (option.disabled || props.disabled) {
            radioColor = theme.colors.textDim ?? colors.gray
          } else if (isFocusedOption) {
            radioColor = theme.colors.primary
          } else if (isSelected) {
            radioColor = theme.colors.info ?? colors.cyan
          }

          return (
            <hstack key={String(option.value)} gap={1} align="middle">
              <text style={style().foreground(radioColor)}>{radioChar}</text>
              <text
                style={
                  option.disabled || props.disabled
                    ? style().foreground(theme.colors.textDim ?? colors.gray)
                    : isFocusedOption
                      ? style().foreground(theme.colors.primary)
                      : undefined
                }
              >
                {option.label}
              </text>
            </hstack>
          )
        })}
      </Stack>
    </interactive>
  )
}

// Factory function
export function radio<T = string>(props: RadioProps<T>): JSX.Element {
  return <Radio {...props} />
}
