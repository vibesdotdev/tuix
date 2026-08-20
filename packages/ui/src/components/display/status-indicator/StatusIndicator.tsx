/**
 * @tuix/ui - StatusIndicator component
 *
 * Colored status indicator with optional label and pulse animation.
 */

import { style, colors } from '@tuix/ansi'
import { Box } from '../../layout/box'
import { useUITheme } from '../../../theme'
import { $state, $effect } from '@tuix/reactive'
import { StatusGlyph } from '../../../glyphs'

/**
 * Status types
 */
export type Status = 'active' | 'inactive' | 'error' | 'warning' | 'info'

/**
 * StatusIndicator props
 */
export interface StatusIndicatorProps {
  /**
   * Status type - determines color
   */
  status: Status

  /**
   * Optional label text
   */
  label?: string

  /**
   * Enable pulse animation
   */
  pulse?: boolean
}

/**
 * StatusIndicator component
 *
 * Shows colored status dot/circle with optional label.
 *
 * @example
 * ```tsx
 * <StatusIndicator status="active" label="Server Running" pulse />
 * <StatusIndicator status="error" label="Connection Failed" />
 * <StatusIndicator status="inactive" label="Stopped" />
 * ```
 */
export function StatusIndicator(props: StatusIndicatorProps): JSX.Element {
  const { theme } = useUITheme()
  const pulseState = $state(false)

  // Get color based on status
  const statusColor = (() => {
    switch (props.status) {
      case 'active':
        return theme.colors.success ?? colors.green
      case 'inactive':
        return theme.colors.textDim ?? theme.colors.border ?? colors.gray
      case 'error':
        return theme.colors.danger ?? colors.red
      case 'warning':
        return theme.colors.warning ?? colors.yellow
      case 'info':
        return theme.colors.info ?? colors.cyan
      default:
        return theme.colors.textBright ?? theme.colors.fg ?? colors.white
    }
  })()

  // Pulse animation (if enabled)
  if (props.pulse) {
    $effect(() => {
      const interval = setInterval(() => {
        pulseState.$set(!pulseState())
      }, 800)

      return () => clearInterval(interval)
    })
  }

  // Map status to glyph
  const indicator = (() => {
    if (props.status === 'active' && props.pulse) {
      return pulseState() ? StatusGlyph.selected : StatusGlyph.active
    }
    switch (props.status) {
      case 'active':
        return StatusGlyph.active
      case 'inactive':
        return StatusGlyph.inactive
      case 'error':
        return StatusGlyph.error
      case 'warning':
        return StatusGlyph.warning
      case 'info':
        return StatusGlyph.info
      default:
        return StatusGlyph.active
    }
  })()

  return (
    <Box direction="horizontal" align="center" gap={1} style={style().inline(true)}>
      <text style={style().foreground(statusColor)}>{indicator}</text>
      {props.label && (
        <text
          style={style().foreground(theme.colors.textBright ?? theme.colors.fg ?? colors.white)}
        >
          {props.label}
        </text>
      )}
    </Box>
  )
}

/**
 * StatusIndicator factory function
 */
export function statusIndicator(props: StatusIndicatorProps): JSX.Element {
  return <StatusIndicator {...props} />
}
