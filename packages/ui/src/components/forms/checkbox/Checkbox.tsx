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
import { isFocused } from '@tuix/reactive'
import type { StateRune, BindableRune } from '@tuix/reactive/runes/runes'
import { isBindableRune, isStateRune } from '@tuix/reactive/runes/runes'
import { style, colors } from '@tuix/ansi'
import { useUITheme } from '../../../theme'

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
  const { theme } = useUITheme()
  const boundChecked = props['bind:checked']
  const localChecked = $state(props.checked ?? false)

  const boundRune = boundChecked as (StateRune<boolean> & { $key?: string }) | undefined
  const focusId = boundRune?.$key
    ? `bind:${boundRune.$key}`
    : props.className
      ? `interactive:${props.className}`
      : undefined
  const isFieldFocused = focusId ? isFocused(focusId) : false

  const isChecked = () => {
    if (boundChecked && (isBindableRune(boundChecked) || isStateRune(boundChecked))) {
      return boundChecked()
    }
    return localChecked()
  }

  $effect(() => {
    if (boundChecked && (isBindableRune(boundChecked) || isStateRune(boundChecked))) {
      if (boundChecked() !== localChecked()) {
        localChecked.$set(boundChecked())
      }
    }
  })

  function handleKeyPress(key: string) {
    if (props.disabled) return

    const k = key
    if (k === 'enter' || k === 'space') {
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
  const checkboxColor = props.disabled
    ? (theme.colors.textDim ?? colors.gray)
    : isFieldFocused
      ? theme.colors.primary
      : (theme.colors.textBright ?? theme.colors.fg ?? colors.white)

  return (
    <interactive
      onKeyPress={handleKeyPress}
      onFocus={() => {
        props.onFocus?.()
      }}
      onBlur={() => {
        props.onBlur?.()
      }}
      onClick={() => {
        if (!props.disabled) {
          toggleChecked()
        }
      }}
      focusable={!props.disabled}
      focusId={focusId}
      className={props.className}
    >
      <hstack gap={1} align="middle">
        <text style={style().foreground(checkboxColor)}>{checkboxChar}</text>
        {props.label && (
          <text
            style={
              props.disabled
                ? style().foreground(theme.colors.textDim ?? colors.gray)
                : isFieldFocused
                  ? style().foreground(theme.colors.primary)
                  : undefined
            }
          >
            {props.label}
          </text>
        )}
      </hstack>
    </interactive>
  )
}

// Factory function
export const checkbox = (props: CheckboxProps) => <Checkbox {...props} />
