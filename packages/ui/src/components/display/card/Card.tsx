/** @jsxImportSource @tuix/jsx */

export interface CardProps {
  title?: string
  description?: string
  children?: unknown
  className?: string
}

function CardRoot(props: CardProps): JSX.Element {
  return (
    <card className={props.className}>
      <vstack>
        {props.title ? <text>{props.title}</text> : null}
        {props.description ? <text>{props.description}</text> : null}
        {props.children}
      </vstack>
    </card>
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
