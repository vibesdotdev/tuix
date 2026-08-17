/** @jsxImportSource @tuix/jsx */

import { useUITheme } from '../../../theme'

export interface SkeletonProps {
  /** Width in columns. */
  width?: number
  /** Height in rows. */
  height?: number
  className?: string
}

const FILL = '▒'

/** One placeholder line of `width` columns (default 20). */
export function skeletonLine(width = 20): string {
  return FILL.repeat(Math.max(1, width))
}

/**
 * Loading placeholder. Static by design — it never animates, so it can never
 * steal a frame or a keypress.
 *
 * @example
 * ```tsx
 * {loading ? <Skeleton width={32} height={3} /> : <Content />}
 * ```
 */
export function Skeleton(props: SkeletonProps): JSX.Element {
  const { theme } = useUITheme()
  const width = props.width ?? 20
  const height = props.height ?? 1
  const lines = Array.from({ length: Math.max(1, height) }, () => skeletonLine(width))

  return (
    <vstack className={props.className}>
      {lines.map((line, index) => (
        <text key={index} fg={theme.colors.textDim}>
          {line}
        </text>
      ))}
    </vstack>
  )
}

/**
 * Paragraph-shaped placeholder: staggered line widths that read as wrapped text.
 *
 * @example
 * ```tsx
 * <SkeletonText lines={3} width={28} />
 * ```
 */
export function SkeletonText(props: SkeletonProps & { lines?: number }): JSX.Element {
  const { theme } = useUITheme()
  const count = Math.max(1, props.lines ?? 3)
  const width = props.width ?? 32
  const fractions = [1, 1, 0.72]

  return (
    <vstack className={props.className}>
      {Array.from({ length: count }, (_, index) => {
        const fraction = fractions[index % fractions.length] ?? 1
        const line = skeletonLine(Math.max(1, Math.round(width * fraction)))
        return (
          <text key={index} fg={theme.colors.textDim}>
            {line}
          </text>
        )
      })}
    </vstack>
  )
}

export const skeleton = (props: SkeletonProps) => <Skeleton {...props} />
