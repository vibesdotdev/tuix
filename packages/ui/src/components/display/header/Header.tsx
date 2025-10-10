/**
 * @tuix/ui - Header component
 *
 * Page or section header with title, subtitle, and optional actions.
 */

import { style, colors } from '@tuix/ansi'
import { Box } from '../../layout/box'
import { useUITheme } from '../../../theme'

/**
 * Header props
 */
export interface HeaderProps {
  /**
   * Main title
   */
  title: string

  /**
   * Optional subtitle
   */
  subtitle?: string

  /**
   * Optional badge or status element
   */
  badge?: JSX.Element

  /**
   * Optional actions (right-aligned)
   */
  actions?: JSX.Element

  /**
   * Margin below header
   */
  marginBottom?: number
}

/**
 * Header component
 *
 * Clean header for pages or sections with title, subtitle, and optional elements.
 *
 * @example
 * ```tsx
 * <Header
 *   title="TUIX Framework"
 *   subtitle="Modern Terminal UI"
 *   badge={<Badge variant="success" label="v1.0.0" />}
 * />
 * ```
 */
export function Header(props: HeaderProps): JSX.Element {
  const { theme } = useUITheme()
  const marginBottom = props.marginBottom ?? 2
  const titleColor = theme.colors.textBright ?? colors.white
  const subtitleColor = theme.colors.textDim ?? colors.gray

  return (
    <Box direction="vertical" margin={{ bottom: marginBottom }}>
      <Box direction="horizontal" justify="between" align="center">
        <Box direction="horizontal" align="center" gap={2}>
          <text style={style().foreground(titleColor).bold()}>
            {props.title}
          </text>
          {props.badge}
        </Box>
        {props.actions}
      </Box>

      {props.subtitle && (
        <Box margin={{ top: 1 }}>
          <text style={style().foreground(subtitleColor)}>
            {props.subtitle}
          </text>
        </Box>
      )}
    </Box>
  )
}

/**
 * Header factory function
 */
export function header(props: HeaderProps): JSX.Element {
  return <Header {...props} />
}
