/**
 * Modal Component
 *
 * Core JSX-first modal overlay with theming support.
 */

import type { JSX } from '@tuix/jsx'
import { style, colors, border } from '@tuix/ansi'
import { useUITheme, type ThemeVariant } from '../../../theme'
import { Box } from '../../layout/box'
import { Button } from '../../forms/button/Button'

export interface ModalProps {
  readonly isOpen?: boolean
  readonly title?: string
  readonly description?: string
  readonly width?: number
  readonly height?: number
  readonly variant?: ThemeVariant
  readonly showCloseButton?: boolean
  readonly closeOnEscape?: boolean
  readonly closeOnBackdrop?: boolean
  readonly onClose?: () => void
  readonly onConfirm?: () => void
  readonly onCancel?: () => void
  readonly confirmLabel?: string
  readonly cancelLabel?: string
  readonly footer?: JSX.Element
  readonly children?: JSX.Element | JSX.Element[]
  readonly className?: string
}

export function Modal(props: ModalProps): JSX.Element | null {
  if (!props.isOpen) {
    return null
  }

  const { theme, getColor } = useUITheme()
  const variant = props.variant ?? 'info'
  const accent = getColor(variant) ?? colors.blue
  const width = props.width ?? 60
  const height = props.height
  const closeOnEscape = props.closeOnEscape ?? true
  const closeOnBackdrop = props.closeOnBackdrop ?? true
  const showCloseButton = props.showCloseButton ?? true
  const confirmLabel = props.confirmLabel ?? 'Confirm'
  const cancelLabel = props.cancelLabel ?? 'Cancel'

  function handleKeyPress(key: string) {
    if ((key === 'Escape' || key === 'escape') && closeOnEscape) {
      props.onClose?.()
    }
    if (key === 'Enter' || key === ' ') {
      props.onConfirm?.()
    }
  }

  function handleBackdropClick() {
    if (closeOnBackdrop) {
      props.onClose?.()
    }
  }

  return (
    <box
      className={props.className}
      width="100%"
      height="100%"
      align="center"
      justify="center"
      background={theme.colors.selection ?? colors.black}
    >
      <interactive focusable onKeyPress={handleKeyPress} onClick={handleBackdropClick}>
        <box align="center" justify="center" width="100%" height="100%">
          <interactive focusable onClick={event => event.stopPropagation?.()}>
            <Box
              width={width}
              height={height}
              border={border.borderStyle('rounded')}
              borderColor={accent}
              padding={1}
              background={theme.colors.bg ?? colors.black}
            >
              <vstack gap={1}>
                <hstack justify="between" align="middle">
                  <text style={style().foreground(accent).bold()}>{props.title}</text>
                  {showCloseButton && (
                    <interactive onClick={() => props.onClose?.()}>
                      <text style={style().foreground(theme.colors.textDim ?? colors.gray)}>×</text>
                    </interactive>
                  )}
                </hstack>

                {props.description && (
                  <text style={style().foreground(theme.colors.textDim ?? colors.gray)}>
                    {props.description}
                  </text>
                )}

                {props.children && <vstack gap={1}>{props.children}</vstack>}

                {renderFooter()}
              </vstack>
            </Box>
          </interactive>
        </box>
      </interactive>
    </box>
  )

  function renderFooter(): JSX.Element | null {
    if (props.footer) {
      return props.footer
    }

    if (!props.onConfirm && !props.onCancel) {
      return null
    }

    return (
      <hstack gap={2} justify="end">
        {props.onCancel && (
          <Button variant="secondary" onClick={props.onCancel}>
            {cancelLabel}
          </Button>
        )}
        {props.onConfirm && (
          <Button variant="primary" onClick={props.onConfirm}>
            {confirmLabel}
          </Button>
        )}
      </hstack>
    )
  }
}
