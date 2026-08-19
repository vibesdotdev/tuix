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
import { isFocused } from '@tuix/reactive'
import { style, colors } from '@tuix/ansi'
import { useUITheme } from '../../../theme'

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
  const { theme } = useUITheme()
  const yesLabel = props.yesLabel || 'Yes'
  const noLabel = props.noLabel || 'No'
  const selectedChoice = $state<'yes' | 'no'>(props.defaultChoice || 'no')

  const focusId = props.className ? `interactive:${props.className}` : 'tuix-confirm'
  const isFieldFocused = isFocused(focusId)

  function handleKeyPress(key: string) {
    switch (key) {
      case 'left':
      case 'right':
        toggleChoice()
        break

      case 'y':
        selectedChoice.$set('yes')
        confirm()
        break

      case 'n':
        selectedChoice.$set('no')
        cancel()
        break

      case 'enter':
      case 'space':
        if (selectedChoice() === 'yes') {
          confirm()
        } else {
          cancel()
        }
        break

      case 'escape':
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
  const dimColor = theme.colors.textDim ?? colors.gray
  const brightColor = theme.colors.textBright ?? theme.colors.fg ?? colors.white

  if (selectedChoice() === 'yes') {
    yesStyle.background(theme.colors.primary).foreground(brightColor).bold()
  } else {
    yesStyle.foreground(dimColor)
  }

  if (selectedChoice() === 'no') {
    noStyle
      .background(theme.colors.danger ?? colors.red)
      .foreground(brightColor)
      .bold()
  } else {
    noStyle.foreground(dimColor)
  }

  return (
    <interactive
      onKeyPress={handleKeyPress}
      onFocus={() => {
        props.onFocus?.()
      }}
      onBlur={() => {
        props.onBlur?.()
      }}
      focusable
      focusId={focusId}
      className={props.className}
    >
      <box
        border={isFieldFocused ? 'rounded' : undefined}
        borderColor={isFieldFocused ? theme.colors.primary : undefined}
        padding={isFieldFocused ? 1 : 0}
      >
        <vstack gap={1}>
          <text>{props.message}</text>

          <hstack gap={2}>
            <text style={yesStyle}>{yesLabel}</text>
            <text style={noStyle}>{noLabel}</text>
          </hstack>

          <text style={style().foreground(dimColor).italic()}>
            ← → to select, Enter to confirm, Esc to cancel
          </text>
        </vstack>
      </box>
    </interactive>
  )
}

// Factory function
export const confirm = (props: ConfirmProps) => <Confirm {...props} />
