/** @jsxImportSource @tuix/jsx */

import type { ThemeVariant } from '../../../theme'
import { useUITheme } from '../../../theme'
import { Button } from '../../forms/button/Button'

export interface ModalProps {
  readonly open?: boolean
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
  readonly children?: unknown
  readonly className?: string
}

/**
 * Overlay surface. Closed when both `open` and `isOpen` are falsy.
 *
 * @example
 * ```tsx
 * <Modal open={open} title="Confirm" onClose={close}>Discard draft?</Modal>
 * ```
 */
export function Modal(props: ModalProps): JSX.Element | null {
  if (!(props.open ?? props.isOpen ?? false)) {
    return null
  }

  const { depth } = useUITheme()
  const showCloseButton = props.showCloseButton ?? true
  const closeOnEscape = props.closeOnEscape ?? true
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

  return (
    <overlay>
      <interactive className={props.className} focusable onKeyPress={handleKeyPress}>
        <box
          border="rounded"
          padding={1}
          width={props.width}
          height={props.height}
          background={depth.overlay}
          borderColor={depth.outset}
        >
          <vstack gap={1}>
            <hstack gap={1}>
              {props.title ? <text>{props.title}</text> : null}
              {showCloseButton ? (
                <interactive onClick={() => props.onClose?.()}>
                  <text>×</text>
                </interactive>
              ) : null}
            </hstack>
            {props.description ? <text>{props.description}</text> : null}
            {props.children}
            {renderFooter()}
          </vstack>
        </box>
      </interactive>
    </overlay>
  )

  function renderFooter(): JSX.Element | null {
    if (props.footer) return props.footer
    if (!props.onConfirm && !props.onCancel) return null
    return (
      <hstack gap={2}>
        {props.onCancel ? (
          <Button variant="secondary" onClick={props.onCancel}>
            {cancelLabel}
          </Button>
        ) : null}
        {props.onConfirm ? (
          <Button variant="primary" onClick={props.onConfirm}>
            {confirmLabel}
          </Button>
        ) : null}
      </hstack>
    )
  }
}
