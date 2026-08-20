/** @jsxImportSource @tuix/jsx */

import type { ThemeVariant } from '../../../theme'
import { useUITheme } from '../../../theme'
import { registerOverlayKeyHandler, registerBackdropHandler } from '@tuix/reactive'
import { style, parseColor, renderShadow, type ShadowCell } from '@tuix/ansi'
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
  /** Dismiss via a click that misses the painted overlay (backdrop hit-testing). */
  readonly closeOnBackdrop?: boolean
  /** Dim the surface beneath the modal (default true). */
  readonly scrim?: boolean
  /** Render a drop shadow below and to the right of the modal (default true). */
  readonly shadow?: boolean
  /** 'center' (default) centers vertically; 'top' floats near the top (palettes). */
  readonly placement?: 'center' | 'top'
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
  const closeOnBackdrop = props.closeOnBackdrop ?? false
  const showShadow = props.shadow !== false
  const confirmLabel = props.confirmLabel ?? 'Confirm'
  const cancelLabel = props.cancelLabel ?? 'Cancel'

  function handleKeyPress(key: string) {
    if ((key === 'Escape' || key === 'escape') && closeOnEscape) {
      props.onClose?.()
    }
    if (key === 'Enter' || key === 'enter' || key === ' ') {
      props.onConfirm?.()
    }
  }

  // While open, the modal owns keys (overlay priority) and — with
  // closeOnBackdrop — dismisses on clicks that miss the painted overlay.
  // Registrations are re-made every render and swept after each frame.
  registerOverlayKeyHandler(key => {
    handleKeyPress(key)
    return false
  })
  if (closeOnBackdrop) {
    registerBackdropHandler(() => props.onClose?.())
  }

  // Center the overlay when explicit dimensions allow computing an origin.
  const cols = Math.max(60, process.stdout.columns ?? 80)
  const rows = Math.max(24, process.stdout.rows ?? 24)
  const originX =
    props.width != null ? Math.max(0, Math.floor((cols - props.width) / 2)) : undefined
  const originY =
    props.placement === 'top'
      ? 2
      : props.height != null
        ? Math.max(0, Math.floor((rows - props.height) / 2))
        : undefined

  // Compute shadow cells from @tuix/ansi primitives.
  // The box dimensions include 2 for border + 2 for padding on each axis.
  const boxWidth = props.width ?? 40
  const boxHeight = props.height ?? 12
  const shadowCells = showShadow
    ? renderShadow(boxWidth, boxHeight, {
        style: 'halfblock',
        color: { r: 0, g: 0, b: 0 },
        offsetX: 1,
        offsetY: 1,
        opacity: 0.6,
      })
    : null

  // Build styled shadow strings from the cell grid.
  // Right edge: last column of cells for rows within the box height.
  // Bottom edge: the last row of cells (offset below box).
  const shadowColor = parseColor(depth.base)
  const shadowStyle = shadowColor ? style().foreground(shadowColor) : style().faint()

  return (
    <overlay x={originX} y={originY} scrim={props.scrim !== false}>
      <interactive className={props.className} focusable onKeyPress={handleKeyPress}>
        <vstack>
          <hstack>
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
            {showShadow ? (
              <vstack>
                {/* Top-right gap (shadow offset) */}
                <text>{' '}</text>
                {/* Right edge shadow using left half-block */}
                {renderRightShadow(boxHeight - 1, shadowCells)}
              </vstack>
            ) : null}
          </hstack>
          {showShadow ? (
            <text style={shadowStyle}>
              {' ' + '\u2580'.repeat(boxWidth)}
            </text>
          ) : null}
        </vstack>
      </interactive>
    </overlay>
  )

  function renderRightShadow(height: number, cells: ShadowCell[][] | null): JSX.Element {
    if (!cells) return <text>{''}</text>
    // The right edge is the last column — extract char from each row within box bounds
    const rightCol = cells
      .slice(0, height)
      .map(row => {
        const cell = row[row.length - 1]
        return cell?.char || '\u2590'
      })
      .join('\n')
    return <text style={shadowStyle}>{rightCol}</text>
  }

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
