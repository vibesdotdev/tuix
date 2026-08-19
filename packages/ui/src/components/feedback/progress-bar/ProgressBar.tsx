/**
 * @tuix/ui - ProgressBar component
 *
 * Progress indicator with sub-cell precision using fractional block characters,
 * filled/unfilled sections, and percentage display.
 */

import { style, colors } from '@tuix/ansi'
import { Box } from '../../layout/box'
import { useUITheme, type ThemeVariant } from '../../../theme'
import { FRACTIONAL_BLOCKS } from '../../../glyphs'

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

  /**
   * Use sub-cell precision with fractional block characters (default: true).
   * When true, the last partial cell uses ▏▎▍▌▋▊▉ for 8-level sub-cell fill.
   * When false, uses whole-character fill (█/░) only.
   */
  subcell?: boolean
}

/**
 * ProgressBar component
 *
 * Visual progress indicator with optional label, percentage, and sub-cell
 * precision for smooth fill rendering.
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
  const useSubcell = props.subcell !== false // default true

  const filledColor = getColor(variant) ?? colors.green
  const emptyColor = theme.colors.border ?? colors.gray

  // Calculate fill with sub-cell precision (8 levels per cell).
  const fillExact = (percentage / 100) * width
  const filledChars = Math.floor(fillExact)
  const fractionalLevel = Math.round((fillExact - filledChars) * 8)
  const emptyChars = width - filledChars - (fractionalLevel > 0 ? 1 : 0)

  let barContent: string
  if (useSubcell && fractionalLevel > 0 && fractionalLevel < 8) {
    // Sub-cell: full blocks + fractional block + empty
    const filled = '█'.repeat(filledChars)
    const partial = FRACTIONAL_BLOCKS[fractionalLevel]!
    const empty = '░'.repeat(Math.max(0, emptyChars))
    barContent = filled + partial + empty
  } else {
    // Whole-cell fallback
    const adjustedFilled = filledChars + (fractionalLevel >= 4 ? 1 : 0)
    const filled = '█'.repeat(Math.min(adjustedFilled, width))
    const empty = '░'.repeat(Math.max(0, width - adjustedFilled))
    barContent = filled + empty
  }

  // Format percentage text
  const percentageText = props.showPercentage ? ` ${percentage.toFixed(0)}%` : ''

  return (
    <Box direction="vertical" gap={0.5}>
      {props.label && (
        <text
          style={style().foreground(theme.colors.textBright ?? theme.colors.fg ?? colors.white)}
        >
          {props.label}
          {percentageText}
        </text>
      )}

      <Box direction="horizontal" gap={0}>
        <text style={style().foreground(filledColor)}>{barContent}</text>
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
