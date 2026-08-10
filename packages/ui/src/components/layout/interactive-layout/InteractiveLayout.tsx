/**
 * @tuix/ui - InteractiveLayout component
 *
 * Full-screen layout for interactive commands (dashboard, live views).
 * Provides header, content, and footer zones that fill the terminal.
 */

import { Box } from '../box'
import { useUITheme } from '../../../theme'

/**
 * InteractiveLayout props
 */
export interface InteractiveLayoutProps {
  /**
   * Optional header content (appears at top)
   */
  header?: JSX.Element

  /**
   * Main content (fills available space)
   */
  children: JSX.Element | JSX.Element[]

  /**
   * Optional footer content (appears at bottom)
   */
  footer?: JSX.Element

  /**
   * Clear screen before rendering
   * @default true
   */
  clearScreen?: boolean
}

/**
 * InteractiveLayout component
 *
 * Renders a full-screen layout for interactive commands.
 * Content fills the entire terminal with optional header and footer zones.
 *
 * Features:
 * - Full terminal dimensions
 * - Optional clear screen on mount
 * - Header/content/footer zones
 * - Auto-applies vibes theme
 * - Content zone fills available vertical space
 *
 * @example
 * ```tsx
 * <InteractiveLayout
 *   header={
 *     <Header title="Dashboard" subtitle="System Metrics" />
 *   }
 *   footer={
 *     <Text>Press 'q' to quit</Text>
 *   }
 * >
 *   <Viewport width={process.stdout.columns} height={24}>
 *     <Text>Interactive content here</Text>
 *   </Viewport>
 * </InteractiveLayout>
 * ```
 */
export function InteractiveLayout(props: InteractiveLayoutProps): JSX.Element {
  const { theme } = useUITheme()
  const clearScreen = props.clearScreen ?? true

  // Terminal dimensions
  const terminalWidth = process.stdout.columns || 80
  const terminalHeight = process.stdout.rows || 24

  // Clear screen if requested
  if (clearScreen) {
    // ANSI escape codes: clear screen and move cursor to home
    process.stdout.write('\x1b[2J\x1b[H')
  }

  // Calculate content height
  // Account for header and footer if present
  let contentHeight = terminalHeight
  if (props.header) {
    // Estimate header height (simplified - in practice would measure rendered height)
    contentHeight -= 3
  }
  if (props.footer) {
    // Estimate footer height
    contentHeight -= 2
  }

  return (
    <Box direction="vertical" width={terminalWidth} height={terminalHeight}>
      {/* Header zone */}
      {props.header && (
        <Box direction="vertical" width={terminalWidth}>
          {props.header}
        </Box>
      )}

      {/* Content zone - fills available space */}
      <Box direction="vertical" width={terminalWidth} height={contentHeight}>
        {props.children}
      </Box>

      {/* Footer zone */}
      {props.footer && (
        <Box direction="vertical" width={terminalWidth}>
          {props.footer}
        </Box>
      )}
    </Box>
  )
}

/**
 * InteractiveLayout factory function (for non-JSX usage)
 */
export function interactiveLayout(props: InteractiveLayoutProps): JSX.Element {
  return <InteractiveLayout {...props} />
}
