/** @jsxImportSource @tuix/jsx */

/**
 * Flex — real flexbox layout.
 *
 * Delegates to the vstack/hstack intrinsics, which route alignment and
 * fill/percent sizing through the flexbox engine. Child flex metadata
 * (`grow`, `flex`, `shrink`, `basis`) is read directly off child elements —
 * put it on <FlexItem> or any child.
 */

import { Box, type BoxProps } from '../box'

export interface FlexProps extends Omit<BoxProps, 'direction'> {
  direction?: 'row' | 'column'
  reverse?: boolean
  wrap?: boolean | 'reverse'
  gap?: number
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
}

export interface FlexItemProps extends BoxProps {
  grow?: number
  shrink?: number
  basis?: number | 'auto'
  alignSelf?: 'auto' | 'start' | 'center' | 'end' | 'stretch' | 'baseline'
}

export function Flex(props: FlexProps): JSX.Element {
  const {
    direction = 'row',
    reverse = false,
    gap,
    align,
    justify,
    width,
    height,
    background,
    children,
  } = props

  const orderedChildren = reverse
    ? Array.isArray(children)
      ? [...children].reverse()
      : children
    : children

  const stackProps = {
    gap,
    align: align as string | undefined,
    justify: justify as string | undefined,
    width,
    height,
    bg: background,
  }

  return direction === 'row' ? (
    <hstack {...stackProps}>{orderedChildren}</hstack>
  ) : (
    <vstack {...stackProps}>{orderedChildren}</vstack>
  )
}

/**
 * FlexItem — passthrough that attaches flex metadata to its child.
 * `grow`/`flex`/`shrink`/`basis` are consumed by the parent flex layout
 * from this element's props; the children render unchanged.
 */
export function FlexItem(props: FlexItemProps): JSX.Element | JSX.Element[] {
  return props.children as JSX.Element | JSX.Element[]
}

// Convenience components
export function Row(props: Omit<FlexProps, 'direction'>): JSX.Element {
  return <Flex {...props} direction="row" />
}

export function Column(props: Omit<FlexProps, 'direction'>): JSX.Element {
  return <Flex {...props} direction="column" />
}

export function SpaceBetween(props: Omit<FlexProps, 'direction' | 'justify'>): JSX.Element {
  return <Flex {...props} direction="row" justify="between" />
}

export function Center(props: Omit<FlexProps, 'direction' | 'align' | 'justify'>): JSX.Element {
  return <Flex {...props} direction="row" align="center" justify="center" />
}

export function Stack(props: Omit<FlexProps, 'direction'>): JSX.Element {
  return <Flex {...props} direction="column" />
}

/** Simple uniform grid: children re-flowed into rows of `columns` cells. */
export function Grid(props: Omit<FlexProps, 'direction'> & { columns?: number }): JSX.Element {
  const columns = Math.max(1, props.columns ?? 2)
  const children = Array.isArray(props.children) ? props.children : [props.children]
  const rows: JSX.Element[][] = []
  for (let i = 0; i < children.length; i += columns) {
    rows.push(children.slice(i, i + columns) as JSX.Element[])
  }
  return (
    <Column gap={props.gap}>
      {rows.map((row, i) => (
        <Row key={`grid-row-${i}`} gap={props.gap}>
          {row.map((cell, j) => (
            <FlexItem key={`grid-cell-${i}-${j}`} grow={1}>
              {cell}
            </FlexItem>
          ))}
        </Row>
      ))}
    </Column>
  )
}

/** Flexible gap: grows to fill remaining space in its parent flex. */
export function Spacer({ size = 1 }: { size?: number }): JSX.Element {
  return <spacer flex={size} />
}

/** Classic app frame: fixed sidebar + a growing main region. */
export function Sidebar(
  props: Omit<FlexProps, 'direction'> & { sidebarWidth?: number }
): JSX.Element {
  const { sidebarWidth = 24, children, ...rest } = props
  const list = Array.isArray(children) ? children : [children]
  const [sidebar, ...main] = list
  return (
    <Row {...rest}>
      <vstack width={sidebarWidth}>{sidebar}</vstack>
      <FlexItem grow={1}>
        <vstack width="fill">{main}</vstack>
      </FlexItem>
    </Row>
  )
}

/** Title bar: a row with bold title text. */
export function Header(props: Omit<FlexProps, 'direction'> & { title?: string }): JSX.Element {
  const { title, children, ...rest } = props
  return (
    <Row {...rest}>
      {title !== undefined ? <text bold>{title}</text> : null}
      {children}
    </Row>
  )
}
