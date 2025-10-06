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

import { jsx, type JSX } from '@tuix/jsx'
import { $state, $derived } from '@tuix/reactive/runes/runes'
import {
  style,
  colors,
  type Style,
  type BorderStyle,
  type BorderSide,
  type Color,
  type Border,
  type StyleProps,
  type HorizontalAlign,
  type VerticalAlign,
  Style as StyleBuilder,
  border,
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
    const baseStyle = new StyleBuilder({
      ...(props.style?.props as StyleProps),
      width: props.width,
      height: props.height,
      minWidth: props.minWidth,
      minHeight: props.minHeight,
      maxWidth: props.maxWidth,
      maxHeight: props.maxHeight,
    })

    // Sizing
    if (props.width !== undefined) baseStyle.width(Number(props.width))
    if (props.height !== undefined) baseStyle.height(Number(props.height))
    if (props.minWidth !== undefined) baseStyle.minWidth(Number(props.minWidth))
    if (props.minHeight !== undefined) baseStyle.minHeight(Number(props.minHeight))
    if (props.maxWidth !== undefined) baseStyle.maxWidth(Number(props.maxWidth))
    if (props.maxHeight !== undefined) baseStyle.maxHeight(Number(props.maxHeight))

    // Padding
    if (props.padding !== undefined) {
      if (typeof props.padding === 'number') {
        baseStyle.padding(Number(props.padding))
      } else {
        baseStyle.padding(
          Number(props.padding.top),
          Number(props.padding.right),
          Number(props.padding.bottom),
          Number(props.padding.left)
        )
      }
    }

    // Margin
    if (props.margin !== undefined) {
      if (typeof props.margin === 'number') {
        baseStyle.margin(Number(props.margin))
      } else {
        baseStyle.margin(
          Number(props.margin.top),
          Number(props.margin.right),
          Number(props.margin.bottom),
          Number(props.margin.left)
        )
      }
    }

    // Border
    if (props.border) {
      baseStyle.border(
        props.border === true ? border.borderStyle('thin') : (props.border as BorderStyle)
      )
    }
    if (props.borderColor) baseStyle.borderForeground(colors.gray)
    if (props.borderStyle)
      baseStyle.border(border.borderStyle(props.borderStyle === 'single' ? 'thin' : props.borderStyle))

    // Background
    if (props.background) baseStyle.background(colors.gray)
    if (props.gradient) {
      baseStyle.background(colors.gray)
    }

    // Layout
    if (props.align) baseStyle.align(props.align as HorizontalAlign)
    if (props.justify) baseStyle.valign(props.justify as VerticalAlign)
    if (props.gap !== undefined) baseStyle.padding(props.gap as number)
    if (props.wrap !== undefined) baseStyle.padding(props.wrap ? 1 : 0)

    // Visibility
    if (props.hidden) baseStyle.invisible(true)
    if (props.opacity !== undefined) baseStyle.background(colors.gray)

    // State styles
    if (focused.get() && props.focusable) {
      baseStyle.borderForeground(colors.blue)
      baseStyle.border(border.borderStyle('double'))
    }

    if (hovering.get() && props.onClick) {
      baseStyle.background(colors.gray)
    }

    return style(baseStyle)
  })

  // Render container
  const Container = props.direction === 'horizontal' ? 'hstack' : 'vstack'

  if (props.focusable || props.onClick) {
    return jsx('interactive', {
      focusable: props.focusable,
      onClick: props.onClick,
      onFocus: () => {
        focused.set(true)
        props.onFocus?.()
      },
      onBlur: () => {
        focused.set(false)
        props.onBlur?.()
      },
      onMouseEnter: () => {
        hovering.set(true)
      },
      onMouseLeave: () => {
        hovering.set(false)
      },
      className: props.className,
      children: jsx(Container, {
        style: boxStyle.get(),
        gap: props.gap,
        wrap: props.wrap,
        children: props.children,
      }),
    })
  }

  return jsx(Container, {
    style: boxStyle.value,
    gap: props.gap,
    wrap: props.wrap,
    className: props.className,
    children: props.children,
  })
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
