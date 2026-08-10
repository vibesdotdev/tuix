/**
 * @tuix/ui - Divider component
 *
 * Horizontal or vertical separator line with optional label.
 */

import { style, colors } from '@tuix/ansi'
import { Box } from '../../layout/box'
import { useUITheme } from '../../../theme'

/**
 * Divider props
 */
export interface DividerProps {
  /**
   * Orientation
   */
  orientation?: 'horizontal' | 'vertical'

  /**
   * Optional label (centered)
   */
  label?: string

  /**
   * Line style
   */
  variant?: 'solid' | 'dashed' | 'dotted'

  /**
   * Custom width (for horizontal) or height (for vertical)
   */
  length?: number

  /**
   * Margin around divider
   */
  margin?: number
}

/**
 * Divider component
 *
 * Visual separator with optional label.
 *
 * @example
 * ```tsx
 * <Divider />
 * <Divider label="Section" />
 * <Divider orientation="vertical" length={10} />
 * <Divider variant="dashed" margin={2} />
 * ```
 */
export function Divider(props: DividerProps): JSX.Element {
  const { theme } = useUITheme()
  const orientation = props.orientation || 'horizontal'
  const variant = props.variant || 'solid'
  const margin = props.margin ?? 1

  // Select line character based on variant
  const lineChar = (() => {
    switch (variant) {
      case 'dashed':
        return orientation === 'horizontal' ? '╌' : '┊'
      case 'dotted':
        return orientation === 'horizontal' ? '·' : '·'
      case 'solid':
      default:
        return orientation === 'horizontal' ? '─' : '│'
    }
  })()

  if (orientation === 'horizontal') {
    const length = props.length ?? 40

    if (props.label) {
      const halfLength = Math.max(2, Math.floor(length / 2))

      return (
        <Box direction="horizontal" align="center" gap={2} margin={{ top: margin, bottom: margin }}>
          <text style={style().foreground(theme.colors.border ?? colors.gray)}>
            {lineChar.repeat(halfLength)}
          </text>
          <text style={style().foreground(theme.colors.textDim ?? colors.gray)}>{props.label}</text>
          <text style={style().foreground(theme.colors.border ?? colors.gray)}>
            {lineChar.repeat(halfLength)}
          </text>
        </Box>
      )
    } else {
      return (
        <Box margin={{ top: margin, bottom: margin }}>
          <text style={style().foreground(theme.colors.border ?? colors.gray)}>
            {lineChar.repeat(length)}
          </text>
        </Box>
      )
    }
  } else {
    // Vertical divider
    const height = props.length || 10
    const lines = Array(height).fill(lineChar)

    return (
      <Box direction="vertical" margin={{ left: margin, right: margin }} gap={0}>
        {lines.map((char, i) => (
          <text key={i} style={style().foreground(theme.colors.border ?? colors.gray)}>
            {char}
          </text>
        ))}
      </Box>
    )
  }
}

/**
 * Divider factory function
 */
export function divider(props?: DividerProps): JSX.Element {
  return <Divider {...(props || {})} />
}
