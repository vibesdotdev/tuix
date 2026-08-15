/** @jsxImportSource @tuix/jsx */

import { useUITheme } from '../../../theme'

export interface CardProps {
  title?: string
  description?: string
  children?: unknown
  className?: string
}

function CardRoot(props: CardProps): JSX.Element {
  const { depth, theme } = useUITheme()
  return (
    <box
      className={props.className}
      border="rounded"
      padding={1}
      background={depth.surface}
      borderColor={depth.outset}
    >
      <vstack>
        {props.title ? (
          <text fg={theme.colors.textBright ?? theme.colors.fg}>{props.title}</text>
        ) : null}
        {props.description ? <text fg={theme.colors.textDim}>{props.description}</text> : null}
        {props.children}
      </vstack>
    </box>
  )
}

export function CardHeader(props: { children?: unknown; className?: string }): JSX.Element {
  return <vstack className={props.className}>{props.children}</vstack>
}

export function CardTitle(props: { children?: unknown; className?: string }): JSX.Element {
  return <text className={props.className}>{props.children}</text>
}

export function CardDescription(props: { children?: unknown; className?: string }): JSX.Element {
  return <text className={props.className}>{props.children}</text>
}

export function CardContent(props: { children?: unknown; className?: string }): JSX.Element {
  return <vstack className={props.className}>{props.children}</vstack>
}

export function CardFooter(props: { children?: unknown; className?: string }): JSX.Element {
  return <hstack className={props.className}>{props.children}</hstack>
}

/**
 * Elevated surface. Compose with `Card.Header` / `Card.Title` or pass `title`.
 *
 * @example
 * ```tsx
 * <Card title="Workers">3 running</Card>
 * ```
 */
export const Card = Object.assign(CardRoot, {
  Root: CardRoot,
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
  Footer: CardFooter,
})
