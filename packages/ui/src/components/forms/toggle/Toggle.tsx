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
import { isFocused } from '@tuix/reactive'
import type { StateRune, BindableRune } from '@tuix/reactive/runes/runes'
import { isBindableRune, isStateRune } from '@tuix/reactive/runes/runes'
import { style, colors, Borders } from '@tuix/ansi'
import { useUITheme } from '../../../theme'

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
  const { theme } = useUITheme()
  const boundValue = props['bind:checked'] || props['bind:value']
  const localOn = $state(
    props.on ?? props.checked ?? props.defaultOn ?? props.defaultChecked ?? false
  )

  const boundRune = boundValue as (StateRune<boolean> & { $key?: string }) | undefined
  const focusId = boundRune?.$key
    ? `bind:${boundRune.$key}`
    : props.className
      ? `interactive:${props.className}`
      : undefined
  const isFieldFocused = focusId ? isFocused(focusId) : false

  const isOn = () => {
    if (boundValue && (isBindableRune(boundValue) || isStateRune(boundValue))) {
      return boundValue()
    }
    return localOn()
  }

  $effect(() => {
    if (boundValue && (isBindableRune(boundValue) || isStateRune(boundValue))) {
      if (boundValue() !== localOn()) {
        localOn.$set(boundValue())
      }
    }
  })

  function handleKeyPress(key: string) {
    if (props.disabled) return

    const k = key
    if (k === 'enter' || k === 'space') {
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
  const dimColor = theme.colors.textDim ?? colors.gray
  const toggleColor = props.disabled
    ? dimColor
    : on
      ? (theme.colors.success ?? colors.green)
      : dimColor
  const borderColor = props.disabled
    ? dimColor
    : isFieldFocused
      ? theme.colors.primary
      : on
        ? (theme.colors.success ?? colors.green)
        : dimColor

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
          toggleOn()
        }
      }}
      focusable={!props.disabled}
      focusId={focusId}
      className={props.className}
    >
      <hstack gap={1} align="middle">
        <box
          border={Borders.Thin}
          borderColor={borderColor}
          padding={{ vertical: 0, horizontal: 1 }}
        >
          <text style={style().foreground(toggleColor)}>{on ? ' ON ' : ' OFF '}</text>
        </box>
        {props.label && (
          <text style={props.disabled ? style().foreground(dimColor) : undefined}>
            {props.label}
          </text>
        )}
      </hstack>
    </interactive>
  )
}

// Factory function
export const toggle = (props: ToggleProps) => <Toggle {...props} />
