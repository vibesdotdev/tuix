/**
 * Tooltip Component - inline hint anchored to a target line
 *
 * Renders above or below the target as a themed callout with a caret.
 * `duration` auto-hides (requires `onHide`); pairing with focus state
 * (`visible={focused}`) is the idiomatic terminal pattern — there is no
 * hover in a TTY.
 *
 * @example
 * ```tsx
 * import { Tooltip } from '@tuix/ui'
 *
 * <hstack gap={1}>
 *   <text>save</text>
 *   <Tooltip visible={showTip} placement="below" content="Write the buffer to disk" />
 * </hstack>
 * ```
 */

/** @jsxImportSource @tuix/jsx */

import { $effect } from '@tuix/reactive'
import { useUITheme } from '../../../theme'

export type TooltipPlacement = 'above' | 'below'

export interface TooltipProps {
  visible?: boolean
  content?: string
  /** Render the caret above (default) or below the body. */
  placement?: TooltipPlacement
  /** Auto-hide after this many ms. Requires `onHide`. */
  duration?: number
  onHide?: () => void
  children?: JSX.Element | JSX.Element[]
  className?: string
}

/**
 * Tooltip Component - themed inline hint with placement
 */
export function Tooltip(props: TooltipProps): JSX.Element | null {
  const visible = props.visible !== false
  if (!visible) return null

  const { theme, depth } = useUITheme()
  const placement = props.placement ?? 'above'

  if (props.duration && props.onHide) {
    const hide = props.onHide
    $effect(() => {
      const timer = setTimeout(() => hide(), props.duration)
      return () => clearTimeout(timer)
    })
  }

  const caret = placement === 'above' ? '╰─╌' : '╭─╌'

  return (
    <vstack className={props.className}>
      {placement === 'above' ? <text fg={theme.colors.textDim}>{caret}</text> : null}
      <box border="thin" borderColor={theme.colors.border} background={depth.surface} padding={0}>
        <text fg={theme.colors.fg}>
          {props.content ? props.content : props.children ? props.children : null}
        </text>
      </box>
      {placement === 'below' ? <text fg={theme.colors.textDim}>{caret}</text> : null}
    </vstack>
  )
}

// Factory function
export const tooltip = (props: TooltipProps) => <Tooltip {...props} />
