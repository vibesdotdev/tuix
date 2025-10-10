/**
 * @tuix/ui - ProgressBar component
 *
 * Progress indicator with filled/unfilled sections and percentage display.
 */

import { style, colors } from '@tuix/ansi'
import { Box } from '../../layout/box'
import { useUITheme, type ThemeVariant } from '../../../theme'

/**
 * ProgressBar props
 */
export interface ProgressBarProps {
  /**
   * Current value (0-100 if no total specified)
   */
  value: number

  /**
   * Total value (optional, defaults to 100)
   */
  total?: number

  /**
   * Label text
   */
  label?: string

  /**
   * Visual variant
   */
  variant?: ThemeVariant

  /**
   * Show percentage text
   */
  showPercentage?: boolean

  /**
   * Bar width in characters
   */
  width?: number
}

/**
 * ProgressBar component
 *
 * Visual progress indicator with optional label and percentage.
 *
 * @example
 * ```tsx
 * <ProgressBar value={75} label="Memory Usage" showPercentage />
 * <ProgressBar value={30} total={50} label="Tasks" variant="success" />
 * <ProgressBar value={90} variant="warning" width={40} />
 * ```
 */
export function ProgressBar(props: ProgressBarProps): JSX.Element {
  const { getColor, theme } = useUITheme()

  const variant = props.variant || 'primary'
  const total = props.total || 100
  const percentage = Math.min(100, Math.max(0, (props.value / total) * 100))
  const width = props.width || 40

  const filledColor = getColor(variant) ?? colors.green
  const emptyColor = theme.colors.border ?? colors.gray

  // Calculate filled and empty sections
  const filledChars = Math.round((percentage / 100) * width)
  const emptyChars = width - filledChars

  const filled = '█'.repeat(filledChars)
  const empty = '░'.repeat(emptyChars)

  // Format percentage text
  const percentageText = props.showPercentage
    ? ` ${percentage.toFixed(0)}%`
    : ''

  return (
    <Box direction="vertical" gap={0.5}>
      {props.label && (
        <text style={style().foreground(theme.colors.textBright ?? theme.colors.fg ?? colors.white)}>
          {props.label}
          {percentageText}
        </text>
      )}

      <Box direction="horizontal" gap={0}>
        {filled && (
          <text style={style().foreground(filledColor)}>
            {filled}
          </text>
        )}
        {empty && (
          <text style={style().foreground(emptyColor)}>
            {empty}
          </text>
        )}
      </Box>
    </Box>
  )
}

/**
 * ProgressBar factory function
 */
export function progressBar(props: ProgressBarProps): JSX.Element {
  return <ProgressBar {...props} />
}
