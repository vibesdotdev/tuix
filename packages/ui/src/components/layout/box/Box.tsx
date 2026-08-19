/** @jsxImportSource @tuix/jsx */

/**
 * Box — a real layout surface.
 *
 * Backed by the `<box>` intrinsic (border + padding + background + numeric
 * sizing via the styledBox pipeline) or, when it has no chrome, by a plain
 * stack with fill semantics (`width="fill"`, `'50%'`). Everything the props
 * promise is implemented; there is no dropped style path.
 */

import type { Style } from '@tuix/ansi'
import { style as styleBuilder } from '@tuix/ansi'

export interface BoxProps {
  children?: JSX.Element | JSX.Element[]

  // Sizing: cells, 'fill', or 'NN%'
  width?: number | string
  height?: number | string
  minWidth?: number
  minHeight?: number

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
  border?: boolean | 'single' | 'double' | 'rounded' | 'thick' | 'ascii'
  borderColor?: string

  // Background
  background?: string

  // Layout
  align?: 'left' | 'center' | 'right'
  justify?: 'start' | 'center' | 'end'
  direction?: 'horizontal' | 'vertical'
  gap?: number
  wrap?: boolean

  // Behavior
  focusable?: boolean
  onClick?: () => void

  // Styling
  style?: Style
  className?: string
}

function normalizeSpacing(value: number | Record<string, number | undefined> | undefined) {
  if (value === undefined) return undefined
  if (typeof value === 'number') return { top: value, right: value, bottom: value, left: value }
  const h = value.horizontal
  const v = value.vertical
  return {
    top: v ?? value.top,
    right: h ?? value.right,
    bottom: v ?? value.bottom,
    left: h ?? value.left,
  }
}

export function Box(props: BoxProps): JSX.Element {
  const margin = normalizeSpacing(props.margin)

  const inner =
    props.direction === 'horizontal' ? (
      <hstack gap={props.gap} wrap={props.wrap} className={props.className}>
        {props.children}
      </hstack>
    ) : props.direction === 'vertical' ? (
      <vstack gap={props.gap} className={props.className}>
        {props.children}
      </vstack>
    ) : (
      <vstack gap={props.gap} className={props.className}>
        {props.children}
      </vstack>
    )

  const hasChrome =
    props.border !== undefined ||
    props.padding !== undefined ||
    props.background !== undefined ||
    props.minWidth !== undefined ||
    props.minHeight !== undefined ||
    margin !== undefined ||
    props.align !== undefined ||
    props.justify !== undefined ||
    props.style !== undefined

  // Margin/alignment ride the style chain (the <box> intrinsic reads them
  // from style inputs, not element props).
  let boxStyle: Style | undefined = props.style
  if (margin) {
    let next = boxStyle ?? styleBuilder()
    if (margin.top !== undefined) next = next.marginTop(margin.top)
    if (margin.right !== undefined) next = next.marginRight(margin.right)
    if (margin.bottom !== undefined) next = next.marginBottom(margin.bottom)
    if (margin.left !== undefined) next = next.marginLeft(margin.left)
    boxStyle = next
  }
  if (props.align) {
    let next = boxStyle ?? styleBuilder()
    next = next.align(
      props.align === 'left' ? 'left' : props.align === 'right' ? 'right' : 'center'
    )
    boxStyle = next
  }
  if (props.justify) {
    let next = boxStyle ?? styleBuilder()
    next = next.valign(
      props.justify === 'start' ? 'top' : props.justify === 'end' ? 'bottom' : 'middle'
    )
    boxStyle = next
  }

  const boxed = hasChrome ? (
    <box
      border={props.border === true ? 'single' : (props.border as never)}
      borderColor={props.borderColor}
      padding={props.padding}
      background={props.background}
      width={props.width}
      height={props.height}
      minWidth={props.minWidth}
      minHeight={props.minHeight}
      style={boxStyle}
    >
      {inner}
    </box>
  ) : (
    <hstack width={props.width} height={props.height} gap={0}>
      {inner}
    </hstack>
  )

  if (props.onClick || props.focusable) {
    return (
      <interactive onClick={props.onClick} focusable={props.focusable}>
        {boxed}
      </interactive>
    )
  }
  return boxed
}

export const box = (props: BoxProps) => <Box {...props} />

/** Box with a rounded border and default padding — the classic panel. */
export function panel(props: BoxProps): JSX.Element {
  return (
    <Box border="rounded" padding={1} {...props}>
      {props.children}
    </Box>
  )
}

/** Centered box: content centered inside a fixed/fill-sized surface. */
export function centerBox(props: BoxProps): JSX.Element {
  return (
    <Box align="center" justify="center" {...props}>
      {props.children}
    </Box>
  )
}

/** Alias for a bordered, padded surface. */
export function card(props: BoxProps): JSX.Element {
  return (
    <Box border="single" padding={1} {...props}>
      {props.children}
    </Box>
  )
}

/** Alias for a Box meant to host scrollable content. */
export function scrollBox(props: BoxProps): JSX.Element {
  return <Box {...props}>{props.children}</Box>
}
