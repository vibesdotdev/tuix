/**
 * Toggle Component - Switch toggle for terminal UI
 *
 * @example
 * ```tsx
 * import { Toggle } from '@tuix/ui'
 *
 * function Settings() {
 *   const darkMode = $state(false)
 *
 *   return (
 *     <Toggle
 *       bind:checked={darkMode}
 *       label="Dark Mode"
 *     />
 *   )
 * }
 * ```
 */

import { $state, $effect } from '@tuix/reactive/runes/runes'
import type { StateRune, BindableRune } from '@tuix/reactive/runes/runes'
import { isBindableRune, isStateRune } from '@tuix/reactive/runes/runes'
import { style, colors, Borders } from '@tuix/ansi'

export interface ToggleProps {
  on?: boolean
  checked?: boolean
  'bind:checked'?: BindableRune<boolean> | StateRune<boolean>
  'bind:value'?: BindableRune<boolean> | StateRune<boolean>
  defaultOn?: boolean
  defaultChecked?: boolean
  label?: string
  onChange?: (on: boolean) => void
  onClick?: (on: boolean) => void
  onFocus?: () => void
  onBlur?: () => void
  disabled?: boolean
  className?: string
}

/**
 * Toggle Component
 */
export function Toggle(props: ToggleProps): JSX.Element {
  const boundValue = props['bind:checked'] || props['bind:value']
  const localOn = $state(
    props.on ?? props.checked ?? props.defaultOn ?? props.defaultChecked ?? false
  )
  const isFocused = $state(false)

  // Get current on state (bound or local)
  const isOn = () => {
    if (boundValue && (isBindableRune(boundValue) || isStateRune(boundValue))) {
      return boundValue()
    }
    return localOn()
  }

  // Sync bound value
  $effect(() => {
    if (boundValue && (isBindableRune(boundValue) || isStateRune(boundValue))) {
      if (boundValue() !== localOn()) {
        localOn.$set(boundValue())
      }
    }
  })

  // Event handlers
  function handleKeyPress(key: string) {
    if (props.disabled) return

    if (key === 'Enter' || key === ' ') {
      toggleOn()
    }
  }

  function toggleOn() {
    const newValue = !isOn()
    localOn.$set(newValue)
    if (boundValue && (isBindableRune(boundValue) || isStateRune(boundValue))) {
      boundValue.$set(newValue)
    }
    props.onChange?.(newValue)
    props.onClick?.(newValue)
  }

  // Render
  const on = isOn()
  const toggleColor = props.disabled
    ? colors.gray
    : on
      ? colors.green
      : colors.gray
  const borderColor = props.disabled
    ? colors.gray
    : isFocused()
      ? colors.blue
      : on
        ? colors.green
        : colors.gray

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
          toggleOn()
        }
      }}
      focusable={!props.disabled}
      className={props.className}
    >
      <hstack gap={1} align="middle">
        <box
          border={Borders.Thin}
          borderColor={borderColor}
          padding={{ vertical: 0, horizontal: 1 }}
        >
          <text style={style().foreground(toggleColor)}>
            {on ? ' ON ' : ' OFF '}
          </text>
        </box>
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
export const toggle = (props: ToggleProps) => <Toggle {...props} />
