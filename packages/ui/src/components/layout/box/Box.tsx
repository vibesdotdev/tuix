/**
 * Box Component - JSX version for flexible container layouts
 *
 * A fundamental layout component that provides:
 * - Flexible box model with padding and margins
 * - Border styles and colors
 * - Background colors and gradients
 * - Alignment and justification
 * - Responsive sizing
 *
 * @example
 * ```tsx
 * import { Box } from 'tuix/components/layout/box'
 *
 * function MyLayout() {
 *   return (
 *     <Box
 *       padding={2}
 *       border="rounded"
 *       borderColor="blue"
 *       background="gray"
 *     >
 *       <text>Content inside a box</text>
 *     </Box>
 *   )
 * }
 * ```
 */

import { $state, $derived } from '@tuix/reactive/runes/runes'
import {
  type Style,
  type BorderStyle,
  style,
  border,
  colors,
  color,
  parseColor,
  type Color,
} from '@tuix/ansi'

// Types
export interface BoxProps {
  children?: JSX.Element | JSX.Element[]

  // Sizing
  width?: number | string
  height?: number | string
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number

  // Spacing
  padding?:
    | number
    | {
        top?: number
        right?: number
        bottom?: number
        left?: number
        horizontal?: number
        vertical?: number
      }
  margin?:
    | number
    | {
        top?: number
        right?: number
        bottom?: number
        left?: number
        horizontal?: number
        vertical?: number
      }

  // Border
  border?: BorderStyle | boolean
  borderColor?: string
  borderStyle?: 'single' | 'double' | 'rounded' | 'thick'

  // Background
  background?: string
  gradient?: { from: string; to: string; direction?: 'horizontal' | 'vertical' | 'diagonal' }

  // Layout
  align?: 'left' | 'center' | 'right' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  direction?: 'horizontal' | 'vertical'
  gap?: number
  wrap?: boolean

  // Behavior
  scrollable?: boolean
  focusable?: boolean
  onClick?: () => void
  onFocus?: () => void
  onBlur?: () => void

  // Styling
  style?: Style
  className?: string
  hidden?: boolean
  opacity?: number
}

/**
 * Box Component
 */
export function Box(props: BoxProps): JSX.Element {
  // Internal state
  const focused = $state(false)
  const hovering = $state(false)

  // Computed style
  const boxStyle = $derived(() => {
    let nextStyle = props.style ?? style()

    // Sizing
    if (typeof props.width === 'number') nextStyle = nextStyle.width(props.width)
    if (typeof props.height === 'number') nextStyle = nextStyle.height(props.height)
    if (typeof props.minWidth === 'number') nextStyle = nextStyle.minWidth(props.minWidth)
    if (typeof props.minHeight === 'number') nextStyle = nextStyle.minHeight(props.minHeight)
    if (typeof props.maxWidth === 'number') nextStyle = nextStyle.maxWidth(props.maxWidth)
    if (typeof props.maxHeight === 'number') nextStyle = nextStyle.maxHeight(props.maxHeight)

    // Padding
    if (props.padding !== undefined) {
      if (typeof props.padding === 'number') {
        nextStyle = nextStyle.padding(props.padding)
      } else {
        const padding = normalizeBoxSpacing(props.padding)
        if (padding.top !== undefined) nextStyle = nextStyle.paddingTop(padding.top)
        if (padding.right !== undefined) nextStyle = nextStyle.paddingRight(padding.right)
        if (padding.bottom !== undefined) nextStyle = nextStyle.paddingBottom(padding.bottom)
        if (padding.left !== undefined) nextStyle = nextStyle.paddingLeft(padding.left)
      }
    }

    // Margin
    if (props.margin !== undefined) {
      if (typeof props.margin === 'number') {
        nextStyle = nextStyle.margin(props.margin)
      } else {
        const margin = normalizeBoxSpacing(props.margin)
        if (margin.top !== undefined) nextStyle = nextStyle.marginTop(margin.top)
        if (margin.right !== undefined) nextStyle = nextStyle.marginRight(margin.right)
        if (margin.bottom !== undefined) nextStyle = nextStyle.marginBottom(margin.bottom)
        if (margin.left !== undefined) nextStyle = nextStyle.marginLeft(margin.left)
      }
    }

    // Border
    if (props.border) {
      const borderStyle =
        props.border === true
          ? border.borderStyle('thin')
          : typeof props.border === 'string'
            ? border.borderStyle(props.border)
            : props.border

      if (borderStyle) {
        nextStyle = nextStyle.border(borderStyle)
      }
    } else if (props.borderStyle) {
      nextStyle = nextStyle.border(border.borderStyle(props.borderStyle))
    }

    const resolvedBorderColor = parseColor(props.borderColor)
    if (resolvedBorderColor) {
      nextStyle = nextStyle.borderForeground(resolvedBorderColor)
    }

    // Background / gradient
    const resolvedBackground = parseColor(props.background)
    if (resolvedBackground) {
      nextStyle = nextStyle.background(resolvedBackground)
    }

    if (props.gradient) {
      const gradientFrom = resolveColor(props.gradient.from)
      const gradientTo = resolveColor(props.gradient.to)

      if (gradientFrom && gradientTo) {
        nextStyle = nextStyle.copy({
          gradient: {
            from: gradientFrom,
            to: gradientTo,
            direction: props.gradient.direction ?? 'horizontal',
          },
        })
      }
    }

    // Alignment
    const horizontalAlign = mapHorizontalAlign(props.align)
    if (horizontalAlign) {
      nextStyle = nextStyle.align(horizontalAlign)
    }

    const verticalAlign = mapVerticalAlign(props.justify)
    if (verticalAlign) {
      nextStyle = nextStyle.valign(verticalAlign)
    }

    if (props.hidden) {
      nextStyle = nextStyle.invisible(true)
    }

    // State styling (lightweight defaults unless user provided overrides)
    if (focused.get() && props.focusable) {
      if (!props.border && !props.borderStyle) {
        nextStyle = nextStyle.border(border.borderStyle('double'))
      }
      if (!props.borderColor) {
        nextStyle = nextStyle.borderForeground(colors.blue)
      }
    }

    if (hovering.get() && props.onClick && !resolvedBackground) {
      nextStyle = nextStyle.background(colors.gray)
    }

    return nextStyle
  })

  // Render container
  const renderContainer = (styleValue: Style, className?: string) =>
    props.direction === 'horizontal' ? (
      <hstack style={styleValue} gap={props.gap} wrap={props.wrap} className={className}>
        {props.children}
      </hstack>
    ) : (
      <vstack style={styleValue} gap={props.gap} wrap={props.wrap} className={className}>
        {props.children}
      </vstack>
    )

  if (props.focusable || props.onClick) {
    return (
      <interactive
        focusable={props.focusable}
        onClick={props.onClick}
        onFocus={() => {
          focused.set(true)
          props.onFocus?.()
        }}
        onBlur={() => {
          focused.set(false)
          props.onBlur?.()
        }}
        onMouseEnter={() => {
          hovering.set(true)
        }}
        onMouseLeave={() => {
          hovering.set(false)
        }}
        className={props.className}
      >
        {renderContainer(boxStyle.get())}
      </interactive>
    )
  }

  return renderContainer(boxStyle.value, props.className)
}

// Factory functions for common box patterns
export const box = (props: BoxProps) => <Box {...props} />

export const card = (props: BoxProps) => (
  <Box padding={2} border="rounded" borderColor={colors.gray} background={colors.black} {...props} />
)

export const panel = (props: BoxProps & { title?: string }) => {
  const { title, children, ...boxProps } = props

  return (
    <Box border="single" borderColor={colors.gray} {...boxProps}>
      {title && (
        <Box padding={{ horizontal: 1 }} borderColor={colors.gray} margin={{ bottom: 1 }}>
          <text bold>{title}</text>
        </Box>
      )}
      {children}
    </Box>
  )
}

export const centerBox = (props: BoxProps) => (
  <Box align="center" justify="center" width="100%" height="100%" {...props} />
)

export const scrollBox = (props: BoxProps) => (
  <Box scrollable border="single" borderColor={colors.gray} {...props} />
)

function resolveColor(value?: string | Color): Color | undefined {
  if (!value) return undefined

  if (typeof value !== 'string') {
    return value
  }

  const named = (colors as Record<string, Color>)[value as keyof typeof colors]
  if (named) {
    return named
  }

  try {
    return parseColor(value)
  } catch {
    return undefined
  }
}

function normalizeBoxSpacing(
  spacing: {
    top?: number
    right?: number
    bottom?: number
    left?: number
    horizontal?: number
    vertical?: number
  }
): { top?: number; right?: number; bottom?: number; left?: number } {
  const { top, right, bottom, left, horizontal, vertical } = spacing

  return {
    top: top ?? vertical,
    bottom: bottom ?? vertical,
    left: left ?? horizontal,
    right: right ?? horizontal,
  }
}

function mapHorizontalAlign(
  align?: 'left' | 'center' | 'right' | 'stretch'
): 'left' | 'center' | 'right' | undefined {
  switch (align) {
    case 'left':
    case 'center':
    case 'right':
      return align
    default:
      return undefined
  }
}

function mapVerticalAlign(
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
): 'top' | 'middle' | 'bottom' | undefined {
  switch (justify) {
    case 'start':
      return 'top'
    case 'center':
      return 'middle'
    case 'end':
      return 'bottom'
    default:
      return undefined
  }
}
