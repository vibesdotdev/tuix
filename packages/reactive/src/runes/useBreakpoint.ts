/**
 * Responsive breakpoint rune for terminal width adaptation.
 *
 * Provides reactive breakpoint state that changes when the terminal
 * is resized, allowing layouts to adapt between compact, default, and wide.
 *
 * @since 1.0.0
 */

import { $state } from './runes'

/**
 * Breakpoint names following the visual language density rules:
 * - compact: 80×24 (minimum, SSH, embedded)
 * - default: ~120×40 (laptop terminal)
 * - wide: ~200×60 (ultrawide, tiled)
 */
export type Breakpoint = 'compact' | 'default' | 'wide'

/**
 * Default breakpoint thresholds (columns).
 */
export const DEFAULT_BREAKPOINTS = {
  /** Below this width = compact */
  compact: 100,
  /** Above this width = wide */
  wide: 160,
} as const

/**
 * Breakpoint configuration.
 */
export interface BreakpointConfig {
  /** Column threshold below which layout is 'compact' (default: 100) */
  compact?: number
  /** Column threshold above which layout is 'wide' (default: 160) */
  wide?: number
}

/**
 * Determine the current breakpoint from terminal width.
 */
export function resolveBreakpoint(
  columns: number,
  config: BreakpointConfig = {}
): Breakpoint {
  const compactThreshold = config.compact ?? DEFAULT_BREAKPOINTS.compact
  const wideThreshold = config.wide ?? DEFAULT_BREAKPOINTS.wide

  if (columns < compactThreshold) return 'compact'
  if (columns >= wideThreshold) return 'wide'
  return 'default'
}

/**
 * Reactive breakpoint state that updates when terminal size changes.
 *
 * @example
 * ```tsx
 * const bp = useBreakpoint()
 *
 * // In view:
 * if (bp.current === 'compact') {
 *   // Stacked layout, hide sidebar
 * } else if (bp.current === 'wide') {
 *   // Show sidebar + detail panel
 * }
 * ```
 */
export function useBreakpoint(config: BreakpointConfig = {}): {
  /** Current breakpoint value */
  current: Breakpoint
  /** Current terminal width in columns */
  columns: number
  /** Whether current breakpoint is compact */
  isCompact: boolean
  /** Whether current breakpoint is wide */
  isWide: boolean
  /** Update from new terminal dimensions (call on resize) */
  update: (columns: number) => void
} {
  const cols = $state(process.stdout?.columns ?? 120, 'breakpoint_cols')
  const bp = $state<Breakpoint>(
    resolveBreakpoint(cols(), config),
    'breakpoint_current'
  )

  const update = (newCols: number) => {
    cols.$set(newCols)
    bp.$set(resolveBreakpoint(newCols, config))
  }

  return {
    get current() { return bp() },
    get columns() { return cols() },
    get isCompact() { return bp() === 'compact' },
    get isWide() { return bp() === 'wide' },
    update,
  }
}
