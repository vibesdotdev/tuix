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
import type { StateRune, BindableRune } from '@tuix/reactive/runes/runes'
import { isBindableRune, isStateRune } from '@tuix/reactive/runes/runes'
import { style, colors } from '@tuix/ansi'

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
  const boundValue = props['bind:value']
  const localValue = $state<T | undefined>(props.value)
  const isFocused = $state(false)
  const focusedIndex = $state(0)

  const direction = props.direction || 'vertical'

  // Get current value (bound or local)
  const currentValue = $derived(() => {
    if (boundValue && (isBindableRune(boundValue) || isStateRune(boundValue))) {
      return boundValue()
    }
    return localValue()
  })

  // Sync bound value
  $effect(() => {
    if (boundValue && (isBindableRune(boundValue) || isStateRune(boundValue))) {
      if (boundValue() !== localValue()) {
        localValue.$set(boundValue())
      }
    }
  })

  // Event handlers
  function handleKeyPress(key: string) {
    if (props.disabled) return

    switch (key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        moveFocus(-1)
        break

      case 'ArrowDown':
      case 'ArrowRight':
        moveFocus(1)
        break

      case 'Enter':
      case ' ': {
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
        isFocused.$set(true)
        props.onFocus?.()
      }}
      onBlur={() => {
        isFocused.$set(false)
        props.onBlur?.()
      }}
      focusable={!props.disabled}
      className={props.className}
    >
      <Stack gap={direction === 'horizontal' ? 2 : 0}>
        {props.options.map((option, index) => {
          const isSelected = option.value === currentValue()
          const isFocusedOption = isFocused() && index === focusedIndex()
          const radioChar = isSelected ? '◉' : '○'

          let radioColor = colors.white
          if (option.disabled || props.disabled) {
            radioColor = colors.gray
          } else if (isFocusedOption) {
            radioColor = colors.blue
          } else if (isSelected) {
            radioColor = colors.cyan
          }

          return (
            <hstack key={String(option.value)} gap={1} align="middle">
              <text style={style().foreground(radioColor)}>{radioChar}</text>
              <text
                style={
                  option.disabled || props.disabled ? style().foreground(colors.gray) : undefined
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
