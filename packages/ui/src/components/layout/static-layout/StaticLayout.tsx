/**
 * @tuix/ui - StaticLayout component
 *
 * Centered panel layout for non-interactive commands (version, help, welcome).
 * Renders a branded title bar with content centered in the terminal.
 */

import { colors } from '@tuix/ansi'
import { Box } from '../box'
import { Panel } from '../panel'
import { Text } from '../../display/text'
import { useUITheme } from '../../../theme'

/**
 * StaticLayout props
 */
export interface StaticLayoutProps {
  /**
   * Main title (appears in branded title bar)
   */
  title: string

  /**
   * Optional subtitle (appears below title)
   */
  subtitle?: string

  /**
   * Optional version badge text
   */
  version?: string

  /**
   * Optional status line (appears at bottom of panel)
   */
  statusLine?: string | JSX.Element

  /**
   * Content to display in the centered panel
   */
  children: JSX.Element | JSX.Element[]

  /**
   * Panel width as percentage of terminal width (0-1)
   * @default 0.5 (50%)
   */
  widthPercent?: number

  /**
   * Minimum width in columns
   * @default 40
   */
  minWidth?: number

  /**
   * Top margin in lines
   * @default 2
   */
  marginTop?: number

  /**
   * Bottom margin in lines
   * @default 2
   */
  marginBottom?: number
}

/**
 * StaticLayout component
 *
 * Renders content in a centered panel with branded title bar.
 * Perfect for static command output like help, version, or welcome screens.
 *
 * Features:
 * - Centered at 50% terminal width (configurable, min 40 cols)
 * - Pure black background (#000000)
 * - Dark gray border (#222222)
 * - Branded title bar with optional subtitle and version
 * - Optional status line at bottom
 * - Auto-applies vibes theme
 *
 * @example
 * ```tsx
 * <StaticLayout
 *   title="TUIX CLI"
 *   subtitle="Modern Terminal UI Framework"
 *   version="v1.0.0"
 *   statusLine="Type 'tuix help' for more information"
 * >
 *   <Text>Welcome to TUIX!</Text>
 * </StaticLayout>
 * ```
 */
export function StaticLayout(props: StaticLayoutProps): JSX.Element {
  const { theme } = useUITheme()

  // Calculate panel width and centering
  const terminalWidth = process.stdout.columns || 80
  const widthPercent = props.widthPercent ?? 0.5
  const minWidth = props.minWidth ?? 40
  const panelWidth = Math.max(minWidth, Math.floor(terminalWidth * widthPercent))

  // Calculate left margin for horizontal centering
  const leftMargin = Math.max(0, Math.floor((terminalWidth - panelWidth) / 2))

  // Margins
  const marginTop = props.marginTop ?? 2
  const marginBottom = props.marginBottom ?? 2

  // Build title bar content
  const titleBarContent: JSX.Element[] = []

  // Title and version on same line
  const titleLine: JSX.Element[] = [
    <Text key="title" color={theme.colors.primary} bold>
      {props.title}
    </Text>,
  ]

  if (props.version) {
    titleLine.push(
      <Text key="space"> </Text>,
      <Text key="version" color={theme.colors.textDim ?? colors.gray} dim>
        {props.version}
      </Text>
    )
  }

  titleBarContent.push(
    <Box key="title-line" direction="horizontal">
      {titleLine}
    </Box>
  )

  // Subtitle on next line if present
  if (props.subtitle) {
    titleBarContent.push(
      <Box key="subtitle" margin={{ top: 1 }}>
        <Text color={theme.colors.textDim ?? colors.gray}>{props.subtitle}</Text>
      </Box>
    )
  }

  // Build panel footer (status line)
  const footer = props.statusLine ? (
    typeof props.statusLine === 'string' ? (
      <Text color={theme.colors.textDim ?? colors.gray} dim>
        {props.statusLine}
      </Text>
    ) : (
      props.statusLine
    )
  ) : undefined

  const panel = (
    <Panel width={panelWidth} variant="default" rounded>
      {/* Title bar */}
      <Box direction="vertical" margin={{ bottom: 2 }}>
        {titleBarContent}
      </Box>

      {/* Main content */}
      <Box direction="vertical">{props.children}</Box>

      {/* Status line */}
      {footer && (
        <Box direction="vertical" margin={{ top: 2 }}>
          {footer}
        </Box>
      )}
    </Panel>
  )

  const horizontalWithMargin =
    leftMargin > 0 ? (
      <hstack>
        <text>{' '.repeat(leftMargin)}</text>
        {panel}
      </hstack>
    ) : (
      panel
    )

  const topMarginLines = Array.from({ length: Math.max(marginTop, 0) }, (_, index) => (
    <text key={`margin-top-${index}`}> </text>
  ))

  const bottomMarginLines = Array.from({ length: Math.max(marginBottom, 0) }, (_, index) => (
    <text key={`margin-bottom-${index}`}> </text>
  ))

  return (
    <vstack>
      {topMarginLines}
      {horizontalWithMargin}
      {bottomMarginLines}
    </vstack>
  )
}

/**
 * StaticLayout factory function (for non-JSX usage)
 */
export function staticLayout(props: StaticLayoutProps): JSX.Element {
  return <StaticLayout {...props} />
}
