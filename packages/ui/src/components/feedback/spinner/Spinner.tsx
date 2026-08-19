/**
 * Spinner Component - JSX version for loading indicators
 *
 * Animated loading indicators with multiple styles:
 * - Various spinner types (dots, line, circle, etc.)
 * - Customizable colors and sizes
 * - Optional loading text
 * - Smooth animations
 *
 * @example
 * ```tsx
 * import { Spinner } from 'tuix/components/feedback/spinner'
 *
 * function LoadingScreen() {
 *   return (
 *     <Center>
 *       <Spinner type="dots" color="blue" />
 *       <Text>Loading data...</Text>
 *     </Center>
 *   )
 * }
 * ```
 */

import { $state, $effect } from '@tuix/reactive/runes/runes'
import { style, colors, parseColor } from '@tuix/ansi'
import { useUITheme } from '../../../theme'

// Types
export type SpinnerType = 'dots' | 'line' | 'circle' | 'bounce' | 'pulse' | 'wave'
export type SpinnerSize = 'small' | 'medium' | 'large'

export interface SpinnerProps {
  type?: SpinnerType
  color?: string
  size?: SpinnerSize
  text?: string
  speed?: number
  className?: string
}

// Spinner frames for different types
const SPINNER_FRAMES = {
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  line: ['-', '\\', '|', '/'],
  circle: ['◐', '◓', '◑', '◒'],
  bounce: ['⠁', '⠂', '⠄', '⠂'],
  pulse: ['·', '•', '●', '•'],
  wave: ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█', '▇', '▆', '▅', '▄', '▃', '▂'],
}

/**
 * Spinner Component
 */
export function Spinner(props: SpinnerProps): JSX.Element {
  const { theme } = useUITheme()

  // Configuration
  const type = props.type || 'dots'
  const spinnerColor = props.color || theme.colors.primary
  const size = props.size || 'medium'
  const speed = props.speed || 80

  // State
  const frameIndex = $state(0)
  const frames = SPINNER_FRAMES[type]

  // Animation effect
  $effect(() => {
    const interval = setInterval(() => {
      frameIndex.$set((frameIndex() + 1) % frames.length)
    }, speed)

    return () => clearInterval(interval)
  })

  // Terminal cells have no font size — size maps to glyph wrapping, never web px.
  const glyph = frames[frameIndex()]
  const frame = size === 'large' ? `[ ${glyph} ]` : glyph

  // Render
  const spinnerStyle = style({
    foreground: parseColor(spinnerColor),
  })

  if (props.text) {
    return (
      <hstack gap={1} className={props.className} align="middle">
        <text style={spinnerStyle}>{frame}</text>
        <text>{props.text}</text>
      </hstack>
    )
  }

  return (
    <text style={spinnerStyle} className={props.className}>
      {frame}
    </text>
  )
}

// Factory functions for common spinner patterns
export const spinner = (props: SpinnerProps) => <Spinner {...props} />

export const loadingSpinner = (props: Omit<SpinnerProps, 'text'>) => (
  <Spinner {...props} text="Loading..." />
)

export const savingSpinner = (props: Omit<SpinnerProps, 'text'>) => (
  <Spinner {...props} text="Saving..." />
)

export const processingSpinner = (props: Omit<SpinnerProps, 'text'>) => (
  <Spinner {...props} text="Processing..." />
)

// Spinner with custom message
export function SpinnerWithMessage(
  props: SpinnerProps & {
    message: string
    messageColor?: string
  }
): JSX.Element {
  const { theme } = useUITheme()
  const { message, messageColor = theme.colors.textDim ?? colors.gray, ...spinnerProps } = props

  return (
    <vstack align="center" gap={1}>
      <Spinner {...spinnerProps} />
      <text style={style({ foreground: messageColor })}>{message}</text>
    </vstack>
  )
}

// Full-screen loading overlay
export function LoadingOverlay(props: {
  loading: boolean
  message?: string
  spinnerProps?: SpinnerProps
  children?: JSX.Element
}): JSX.Element {
  if (!props.loading) {
    return props.children ?? <text />
  }

  const { depth, theme } = useUITheme()

  return (
    <overlay>
      <interactive focusable>
        <box border="rounded" padding={1} background={depth.overlay} borderColor={depth.outset}>
          <vstack align="center" gap={2}>
            <Spinner size="large" {...props.spinnerProps} />
            {props.message && <text fg={theme.colors.textBright}>{props.message}</text>}
          </vstack>
        </box>
      </interactive>
    </overlay>
  )
}
