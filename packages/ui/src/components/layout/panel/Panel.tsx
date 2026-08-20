/**
 * @tuix/ui - Panel component
 *
 * Modern panel container with rounded borders, optional title and footer.
 * Perfect for showcasing content with clean aesthetics.
 */

import { colors, style } from '@tuix/ansi'
import { Box } from '../box'
import { useUITheme, type ThemeVariant } from '../../../theme'

/**
 * Panel props
 */
export interface PanelProps {
  /**
   * Panel title (appears at top)
   */
  title?: string

  /**
   * Panel footer (appears at bottom)
   */
  footer?: string

  /**
   * Visual variant - maps to theme colors
   */
  variant?: ThemeVariant

  /**
   * Use rounded borders (from theme)
   */
  rounded?: boolean

  /**
   * Panel content
   */
  children: JSX.Element | JSX.Element[]

  /**
   * Width (undefined = full width)
   */
  width?: number

  /**
   * Height (undefined = auto)
   */
  height?: number

  /**
   * Padding inside panel
   */
  padding?: number

  /**
   * Margin outside panel
   */
  margin?: number
}

/**
 * Panel component
 *
 * A modern container with borders, optional title and footer.
 * Uses theme colors and rounded borders from the active theme.
 *
 * @example
 * ```tsx
 * <Panel title="Dashboard" variant="primary" rounded>
 *   <text>Panel content here</text>
 * </Panel>
 * ```
 */
export function Panel(props: PanelProps): JSX.Element {
  const { getColor, spacing, theme, depth } = useUITheme()

  const variant = props.variant || 'default'
  const borderColor =
    variant === 'default'
      ? (depth.outset ?? theme.colors.border ?? colors.gray)
      : (getColor(variant) ?? theme.colors.border ?? colors.gray)
  const borderPreset =
    props.rounded !== false ? 'rounded' : (theme.typography.borderStyle ?? 'thin')

  const padding = props.padding ?? spacing.padding
  const margin = props.margin ?? spacing.margin

  // Build panel content
  const content: JSX.Element[] = []

  // Title section
  if (props.title) {
    content.push(
      <Box key="title" padding={{ horizontal: padding }} margin={{ bottom: 1 }}>
        <text
          style={style()
            .foreground(
              variant === 'default'
                ? (theme.colors.textBright ?? theme.colors.fg ?? colors.white)
                : borderColor
            )
            .bold()}
        >
          {props.title}
        </text>
      </Box>
    )
  }

  // Main content
  content.push(
    <Box key="content" padding={{ horizontal: padding }}>
      {props.children}
    </Box>
  )

  // Footer section
  if (props.footer) {
    content.push(
      <Box key="footer" padding={{ horizontal: padding }} margin={{ top: 1 }}>
        <text
          style={style()
            .foreground(theme.colors.textDim ?? colors.gray)
            .dim(true)}
        >
          {props.footer}
        </text>
      </Box>
    )
  }

  return (
    <box
      border={borderPreset}
      borderColor={borderColor}
      width={props.width}
      height={props.height}
      padding={{ vertical: padding }}
    >
      {content}
    </box>
  )
}

/**
 * Panel factory function (for non-JSX usage)
 */
export function panel(props: PanelProps): JSX.Element {
  return <Panel {...props} />
}
