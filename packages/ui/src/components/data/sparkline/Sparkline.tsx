/** @jsxImportSource @tuix/jsx */

import { useUITheme } from '../../../theme'

export type SparklineVariant = 'bar' | 'line'

export interface SparklineProps {
  values: number[]
  variant?: SparklineVariant
  /** Total columns; values are resampled to fit (default: value count). */
  width?: number
  label?: string
  className?: string
}

const BAR_GLYPHS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']
const EMPTY = '·'

/** Resample `values` to exactly `width` points (nearest neighbor). */
function resample(values: number[], width: number): number[] {
  if (width === values.length || width <= 0) return values
  const out: number[] = []
  for (let i = 0; i < width; i++) {
    const index = Math.min(values.length - 1, Math.floor((i * values.length) / width))
    out.push(values[index]!)
  }
  return out
}

/** Render a one-line bar sparkline. Non-finite points render as `·`. */
export function sparklineBars(values: number[], width?: number): string {
  const points = resample(values, width ?? values.length)
  if (points.length === 0) return ''
  const finite = points.filter(value => Number.isFinite(value))
  const max = finite.length > 0 ? Math.max(...finite) : 0
  const min = finite.length > 0 ? Math.min(...finite) : 0
  const span = max - min

  return points
    .map(value => {
      if (!Number.isFinite(value)) return EMPTY
      const step = span === 0 ? 1 : (value - min) / span
      const index = Math.min(BAR_GLYPHS.length - 1, Math.round(step * (BAR_GLYPHS.length - 1)))
      return BAR_GLYPHS[index]!
    })
    .join('')
}

/**
 * One-line chart. Bars use block glyphs scaled min→max; the line variant
 * marks each point with `•` separated by `─`.
 *
 * @example
 * ```tsx
 * <Sparkline values={latency} label="p99 ms" />
 * ```
 */
export function Sparkline(props: SparklineProps): JSX.Element {
  const { theme } = useUITheme()
  const variant = props.variant ?? 'bar'
  const width = props.width
  const points = resample(props.values, width ?? props.values.length)

  let chart: string
  if (variant === 'line') {
    chart = points.map(value => (Number.isFinite(value) ? '•' : EMPTY)).join('─')
  } else {
    chart = sparklineBars(props.values, width)
  }

  if (!props.label) {
    return (
      <text className={props.className} fg={theme.colors.secondary}>
        {chart}
      </text>
    )
  }

  return (
    <hstack gap={1} className={props.className}>
      <text fg={theme.colors.secondary}>{chart}</text>
      <text fg={theme.colors.textDim}>{props.label}</text>
    </hstack>
  )
}

export const sparkline = (props: SparklineProps) => <Sparkline {...props} />
