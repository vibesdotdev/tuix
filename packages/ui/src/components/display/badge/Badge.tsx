/**
 * @tuix/ui - Badge component
 *
 * Small status badge with colored background and text.
 */

import { style, colors } from '@tuix/ansi'
import { Box } from '../../layout/box'
import { useUITheme, type ThemeVariant, getBackgroundColor, getTextColor } from '../../../theme'

/**
 * Badge props
 */
export interface BadgeProps {
  /**
   * Badge label text
   */
  label: string

  /**
   * Visual variant - determines color
   */
  variant?: ThemeVariant

  /**
   * Optional icon/emoji prefix
   */
  icon?: string
}

/**
 * Badge component
 *
 * Small colored badge for status indicators, labels, etc.
 *
 * @example
 * ```tsx
 * <Badge variant="success" label="Active" />
 * <Badge variant="error" label="Failed" icon="✗" />
 * <Badge variant="info" label="v1.0.0" />
 * ```
 */
export function Badge(props: BadgeProps): JSX.Element {
  const { theme } = useUITheme()

  const variant = props.variant || 'default'
  const bgColor = getBackgroundColor(variant, theme) ?? theme.colors.selection ?? colors.gray
  const textColor =
    variant === 'default'
      ? (theme.colors.textBright ?? theme.colors.fg ?? colors.white)
      : (getTextColor(variant, theme) ?? theme.colors.bg ?? colors.black)

  const content = props.icon ? `${props.icon} ${props.label}` : props.label

  return (
    <Box
      padding={{ horizontal: 1 }}
      style={style().background(bgColor).foreground(textColor).bold().inline(true)}
    >
      <text>{content}</text>
    </Box>
  )
}

/**
 * Badge factory function
 */
export function badge(props: BadgeProps): JSX.Element {
  return <Badge {...props} />
}
