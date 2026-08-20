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
 *
 * @example Destructive confirmation
 * ```tsx
 * <Confirm
 *   message="This will permanently delete all data."
 *   destructive
 *   yesLabel="Delete"
 *   onConfirm={() => deleteAll()}
 *   onCancel={() => closeDialog()}
 * />
 * ```
 *
 * @example Type-to-confirm for dangerous actions
 * ```tsx
 * <Confirm
 *   message="This action cannot be undone."
 *   destructive
 *   typeToConfirm="delete"
 *   yesLabel="Delete"
 *   onConfirm={() => deleteAll()}
 *   onCancel={() => closeDialog()}
 * />
 * ```
 */

import { $state } from '@tuix/reactive/runes/runes'
import { isFocused } from '@tuix/reactive'
import { style, colors } from '@tuix/ansi'
import { useUITheme } from '../../../theme'
import { StatusGlyph } from '../../../glyphs'

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
  /** Whether this is a destructive/dangerous action */
  destructive?: boolean
  /** If set, user must type this exact text to confirm (for extra safety) */
  typeToConfirm?: string
}

/**
 * Confirm Component
 */
export function Confirm(props: ConfirmProps): JSX.Element {
  const { theme } = useUITheme()
  const yesLabel = props.yesLabel || 'Yes'
  const noLabel = props.noLabel || 'No'
  const selectedChoice = $state<'yes' | 'no'>(props.defaultChoice || 'no')
  const typedText = $state<string>('')

  const dangerColor = theme.colors.danger ?? colors.red
  const isDestructive = props.destructive ?? false

  const focusId = props.className ? `interactive:${props.className}` : 'tuix-confirm'
  const isFieldFocused = isFocused(focusId)

  /** Whether the confirm action is currently allowed */
  function canConfirm(): boolean {
    if (props.typeToConfirm) {
      return typedText() === props.typeToConfirm
    }
    return true
  }

  function handleKeyPress(key: string) {
    switch (key) {
      case 'left':
      case 'right':
        toggleChoice()
        break

      case 'y':
        if (!props.typeToConfirm) {
          selectedChoice.$set('yes')
          if (canConfirm()) confirm()
        }
        break

      case 'n':
        if (!props.typeToConfirm) {
          selectedChoice.$set('no')
          cancel()
        }
        break

      case 'enter':
      case 'space':
        if (selectedChoice() === 'yes' && canConfirm()) {
          confirm()
        } else if (selectedChoice() === 'no') {
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
  const accentColor = isDestructive ? dangerColor : theme.colors.primary
  const borderColor = isFieldFocused ? accentColor : undefined

  if (selectedChoice() === 'yes') {
    if (canConfirm()) {
      yesStyle.background(accentColor).foreground(brightColor).bold()
    } else {
      // Confirm selected but type-to-confirm not satisfied: show muted
      yesStyle.foreground(dimColor).strikethrough()
    }
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

  const messageStyle = isDestructive
    ? style().foreground(dangerColor)
    : style()

  const titleContent = isDestructive
    ? `${StatusGlyph.warning} ${props.message}`
    : props.message

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
        borderColor={borderColor}
        padding={isFieldFocused ? 1 : 0}
      >
        <vstack gap={1}>
          <text style={messageStyle}>{titleContent}</text>

          {props.typeToConfirm && (
            <vstack gap={0}>
              <text style={style().foreground(dimColor).italic()}>
                Type '{props.typeToConfirm}' to confirm
              </text>
              <input
                value={typedText()}
                placeholder={props.typeToConfirm}
                bind:value={undefined}
                onChange={(v: string) => typedText.$set(v)}
              />
            </vstack>
          )}

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
