/**
 * Tooltip Component - Tooltip popup for terminal UI
 *
 * A simple tooltip component for displaying helpful information.
 * Note: This is a basic implementation - advanced features like hover detection,
 * positioning, and auto-hide will be added in future versions.
 *
 * @example
 * ```tsx
 * import { Tooltip } from '@tuix/ui'
 *
 * function HelpText() {
 *   const showHelp = $state(false)
 *
 *   return (
 *     <>
 *       <Button onHover={() => showHelp.$set(true)}>
 *         Hover me
 *       </Button>
 *       <Tooltip visible={showHelp()} content="This is a helpful tooltip!" />
 *     </>
 *   )
 * }
 * ```
 */

import { style, colors, Borders } from '@tuix/ansi'

export interface TooltipProps {
  visible?: boolean
  content?: string
  children?: JSX.Element | JSX.Element[]
  className?: string
}

/**
 * Tooltip Component - Simple tooltip display
 */
export function Tooltip(props: TooltipProps): JSX.Element | null {
  const visible = props.visible !== false
  if (!visible) return null

  const tooltipStyle = style()
    .background(colors.gray)
    .foreground(colors.black)
    .padding(0, 1)

  return (
    <box
      border={Borders.Thin}
      borderColor={colors.gray}
      style={tooltipStyle}
      className={props.className}
    >
      {props.content ? (
        <text>{props.content}</text>
      ) : props.children ? (
        props.children
      ) : null}
    </box>
  )
}

// Factory function
export const tooltip = (props: TooltipProps) => <Tooltip {...props} />
