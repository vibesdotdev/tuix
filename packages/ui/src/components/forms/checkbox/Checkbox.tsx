/**
 * Checkbox Component - Checkbox for terminal UI
 *
 * @example
 * ```tsx
 * import { Checkbox } from '@tuix/ui'
 *
 * function MyForm() {
 *   const agreed = $state(false)
 *
 *   return (
 *     <Checkbox
 *       bind:checked={agreed}
 *       label="I agree to the terms"
 *     />
 *   )
 * }
 * ```
 */

import { $state, $effect } from '@tuix/reactive/runes/runes'
import type { StateRune, BindableRune } from '@tuix/reactive/runes/runes'
import { isBindableRune, isStateRune } from '@tuix/reactive/runes/runes'
import { style, colors } from '@tuix/ansi'

export interface CheckboxProps {
  checked?: boolean
  'bind:checked'?: BindableRune<boolean> | StateRune<boolean>
  label?: string
  onChange?: (checked: boolean) => void
  onFocus?: () => void
  onBlur?: () => void
  disabled?: boolean
  className?: string
}

/**
 * Checkbox Component
 */
export function Checkbox(props: CheckboxProps): JSX.Element {
  const boundChecked = props['bind:checked']
  const localChecked = $state(props.checked ?? false)
  const isFocused = $state(false)

  // Get current checked state (bound or local)
  const isChecked = () => {
    if (boundChecked && (isBindableRune(boundChecked) || isStateRune(boundChecked))) {
      return boundChecked()
    }
    return localChecked()
  }

  // Sync bound value
  $effect(() => {
    if (boundChecked && (isBindableRune(boundChecked) || isStateRune(boundChecked))) {
      if (boundChecked() !== localChecked()) {
        localChecked.$set(boundChecked())
      }
    }
  })

  // Event handlers
  function handleKeyPress(key: string) {
    if (props.disabled) return

    if (key === 'Enter' || key === ' ') {
      toggleChecked()
    }
  }

  function toggleChecked() {
    const newValue = !isChecked()
    localChecked.$set(newValue)
    if (boundChecked && (isBindableRune(boundChecked) || isStateRune(boundChecked))) {
      boundChecked.$set(newValue)
    }
    props.onChange?.(newValue)
  }

  // Render
  const checkboxChar = isChecked() ? '☑' : '☐'
  const checkboxColor = props.disabled ? colors.gray : isFocused() ? colors.blue : colors.white

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
      onClick={() => {
        if (!props.disabled) {
          toggleChecked()
        }
      }}
      focusable={!props.disabled}
      className={props.className}
    >
      <hstack gap={1} align="middle">
        <text style={style().foreground(checkboxColor)}>{checkboxChar}</text>
        {props.label && (
          <text style={props.disabled ? style().foreground(colors.gray) : undefined}>
            {props.label}
          </text>
        )}
      </hstack>
    </interactive>
  )
}

// Factory function
export const checkbox = (props: CheckboxProps) => <Checkbox {...props} />
