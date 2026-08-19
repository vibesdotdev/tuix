/** @jsxImportSource @tuix/jsx */

import { useUITheme } from '../../../theme'

export type SparklineVariant = 'bar' | 'line' | 'braille'

export interface SparklineProps {
  values: number[]
  variant?: SparklineVariant
  /** Total columns; values are resampled to fit (default: value count). */
  width?: number
  /** Terminal rows tall for the braille variant (default 1). */
  rows?: number
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
 * Braille sparkline: each terminal cell carries a 2×4 dot grid, so a chart
 * `rows` tall resolves `rows*4` vertical steps. Area-filled from the
 * baseline. Non-finite points leave their column empty.
 */
export function sparklineBraille(values: number[], width?: number, rows = 1): string {
  const dotCols = Math.max(1, (width ?? values.length) * 2)
  const points = resample(values, dotCols)
  if (points.length === 0) return ''
  const finite = points.filter(value => Number.isFinite(value))
  const max = finite.length > 0 ? Math.max(...finite) : 0
  const min = finite.length > 0 ? Math.min(...finite) : 0
  const span = max - min
  const height = rows * 4

  const heights = points.map(value => {
    if (!Number.isFinite(value)) return 0
    const step = span === 0 ? 1 : (value - min) / span
    return Math.round(step * height)
  })

  const lines: string[] = []
  for (let cy = 0; cy < rows; cy++) {
    let line = ''
    for (let cx = 0; cx < Math.ceil(dotCols / 2); cx++) {
      let mask = 0
      for (let dx = 0; dx < 2; dx++) {
        const column = cx * 2 + dx
        if (column >= dotCols) continue
        const h = heights[column]!
        for (let dy = 0; dy < 4; dy++) {
          // Dot rows are top-down; count fill from the baseline.
          const cellRowFromBottom = 3 - dy
          const rowFromBottom = (rows - 1 - cy) * 4 + cellRowFromBottom
          if (rowFromBottom < h) {
            const bit = dy < 3 ? dx * 3 + dy : 6 + dx
            mask |= 1 << bit
          }
        }
      }
      line += String.fromCodePoint(0x2800 + mask)
    }
    lines.push(line)
  }
  return lines.join('\n')
}

/**
 * One-line chart. Bars use block glyphs scaled min→max; the line variant
 * marks each point with `•` separated by `─`; the braille variant renders
 * an area chart at 2×4 sub-cell resolution (optionally multi-row).
 *
 * @example
 * ```tsx
 * <Sparkline values={latency} label="p99 ms" />
 * <Sparkline values={rps} variant="braille" rows={2} width={40} />
 * ```
 */
export function Sparkline(props: SparklineProps): JSX.Element {
  const { theme } = useUITheme()
  const variant = props.variant ?? 'bar'
  const width = props.width
  const points = resample(props.values, width ?? props.values.length)

  let chart: string
  if (variant === 'braille') {
    chart = sparklineBraille(props.values, width, props.rows ?? 1)
  } else if (variant === 'line') {
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
