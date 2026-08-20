/**
 * @tuix/ui - PerfHud (Performance Head-Up Display)
 *
 * Overlay widget showing live rendering performance metrics.
 * Use during development to monitor frame times, dirty-row skip rates,
 * and identify rendering bottlenecks.
 */

import { style, colors } from '@tuix/ansi'
import { Box } from '../../layout/box'
import { useUITheme } from '../../../theme'
import { FRACTIONAL_BLOCKS } from '../../../glyphs'

/**
 * PerfHud props
 */
export interface PerfHudProps {
  /** Render stats from RendererService.getStats() */
  stats: {
    framesRendered: number
    averageFrameTime: number
    lastFrameTime: number
    dirtyRowSkipRate: number
    frameTimeHistory?: readonly number[]
  }
  /** Position corner (default: 'top-right') */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /** Whether to show the frame time histogram */
  showHistogram?: boolean
}

/**
 * Render a mini spark histogram from frame time history.
 */
function miniHistogram(history: readonly number[], width: number): string {
  if (history.length === 0) return ' '.repeat(width)
  // Take last `width` entries
  const slice = history.slice(-width)
  const max = Math.max(...slice, 16) // 16ms = 60fps target
  return slice
    .map(v => {
      const level = Math.min(8, Math.round((v / max) * 8))
      return FRACTIONAL_BLOCKS[level] ?? ' '
    })
    .join('')
}

/**
 * PerfHud component
 *
 * @example
 * ```tsx
 * const stats = yield* RendererService.getStats
 * <PerfHud stats={stats} showHistogram />
 * ```
 */
export function PerfHud(props: PerfHudProps): JSX.Element {
  const { theme } = useUITheme()
  const { stats, showHistogram = true } = props

  const fps = stats.averageFrameTime > 0
    ? Math.round(1000 / stats.averageFrameTime)
    : 0
  const skipPct = stats.dirtyRowSkipRate?.toFixed(0) ?? '0'

  // Color FPS indicator: green > 30, yellow 15-30, red < 15
  const fpsColor = fps >= 30
    ? (theme.colors.success ?? colors.green)
    : fps >= 15
      ? (theme.colors.warning ?? colors.yellow)
      : (theme.colors.danger ?? colors.red)

  const dimColor = theme.colors.textDim ?? colors.gray
  const labelStyle = style().foreground(dimColor)
  const valueStyle = style().foreground(theme.colors.fg ?? colors.white).bold(true)

  const lines: string[] = [
    `FPS: ${fps}`,
    `Frame: ${stats.lastFrameTime}ms (avg ${stats.averageFrameTime.toFixed(1)}ms)`,
    `Skip: ${skipPct}%`,
    `Frames: ${stats.framesRendered}`,
  ]

  return (
    <box style={style().border('rounded').borderColor(dimColor).padding(0, 1)}>
      <vstack>
        <text style={style().foreground(fpsColor).bold(true)}>
          {'● '}{fps} FPS
        </text>
        <text style={labelStyle}>
          frame {stats.lastFrameTime}ms avg {stats.averageFrameTime.toFixed(1)}ms
        </text>
        <text style={labelStyle}>
          skip {skipPct}% rows
        </text>
        {showHistogram && stats.frameTimeHistory && stats.frameTimeHistory.length > 0 && (
          <text style={style().foreground(theme.colors.primary ?? colors.cyan)}>
            {miniHistogram(stats.frameTimeHistory, 20)}
          </text>
        )}
      </vstack>
    </box>
  )
}
