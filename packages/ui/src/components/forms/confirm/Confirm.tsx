/**
 * Confirm Component - Yes/No confirmation prompt
 *
 * @example
 * ```tsx
 * import { Confirm } from '@tuix/ui'
 *
 * function DeleteDialog() {
 *   return (
 *     <Confirm
 *       message="Are you sure you want to delete this file?"
 *       onConfirm={() => deleteFile()}
 *       onCancel={() => closeDialog()}
 *       defaultChoice="no"
 *     />
 *   )
 * }
 * ```
 */

import { $state } from '@tuix/reactive/runes/runes'
import { style, colors } from '@tuix/ansi'

export interface ConfirmProps {
  message: string
  yesLabel?: string
  noLabel?: string
  defaultChoice?: 'yes' | 'no'
  onConfirm?: () => void
  onCancel?: () => void
  onFocus?: () => void
  onBlur?: () => void
  className?: string
}

/**
 * Confirm Component
 */
export function Confirm(props: ConfirmProps): JSX.Element {
  const yesLabel = props.yesLabel || 'Yes'
  const noLabel = props.noLabel || 'No'
  const selectedChoice = $state<'yes' | 'no'>(props.defaultChoice || 'no')
  const isFocused = $state(false)

  // Event handlers
  function handleKeyPress(key: string) {
    switch (key) {
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'Tab':
        toggleChoice()
        break

      case 'y':
      case 'Y':
        selectedChoice.$set('yes')
        confirm()
        break

      case 'n':
      case 'N':
        selectedChoice.$set('no')
        cancel()
        break

      case 'Enter':
      case ' ':
        if (selectedChoice() === 'yes') {
          confirm()
        } else {
          cancel()
        }
        break

      case 'Escape':
        cancel()
        break
    }
  }

  function toggleChoice() {
    selectedChoice.$set(selectedChoice() === 'yes' ? 'no' : 'yes')
  }

  function confirm() {
    props.onConfirm?.()
  }

  function cancel() {
    props.onCancel?.()
  }

  // Render
  const yesStyle = style().padding(0, 2)
  const noStyle = style().padding(0, 2)

  if (selectedChoice() === 'yes') {
    yesStyle.bg(colors.blue).fg(colors.white).bold()
  } else {
    yesStyle.fg(colors.gray)
  }

  if (selectedChoice() === 'no') {
    noStyle.bg(colors.red).fg(colors.white).bold()
  } else {
    noStyle.fg(colors.gray)
  }

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
      focusable
      className={props.className}
    >
      <vstack gap={1}>
        <text>{props.message}</text>

        <hstack gap={2}>
          <text style={yesStyle}>{yesLabel}</text>
          <text style={noStyle}>{noLabel}</text>
        </hstack>

        <text style={style().foreground(colors.gray).italic()}>
          ← → to select, Enter to confirm, Esc to cancel
        </text>
      </vstack>
    </interactive>
  )
}

// Factory function
export const confirm = (props: ConfirmProps) => <Confirm {...props} />
