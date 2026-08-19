/**
 * Focus ring utility for consistent focus/selection styling across widgets.
 *
 * Provides theme-aware focus ring styles: accent-colored borders, gutter
 * markers, and filled-pill active states. Widgets should use these utilities
 * instead of inventing per-widget focus indicators.
 *
 * @since 1.0.0
 */

import { style as ansiStyle, colors } from '@tuix/ansi'
import type { ThemeColors } from '@tuix/themes'

/**
 * Focus ring configuration.
 */
export interface FocusRingConfig {
  /** Whether the element is currently focused. */
  focused: boolean
  /** Theme colors to derive the focus ring from. */
  colors: ThemeColors
  /** Ring style variant. */
  variant?: 'border' | 'gutter' | 'pill' | 'underline'
}

/**
 * Result of computing a focus ring — contains the ANSI style to apply.
 */
export interface FocusRingResult {
  /** Border color (for 'border' variant). */
  borderColor: unknown
  /** Background color (for 'pill' variant). */
  backgroundColor: unknown | undefined
  /** Foreground color (for 'pill' variant, text inside). */
  foregroundColor: unknown | undefined
  /** Gutter marker character (for 'gutter' variant). */
  gutterChar: string
  /** Whether a gutter marker should be shown. */
  showGutter: boolean
  /** Build an ansi Style with focus ring applied. */
  applyToStyle: (base?: ReturnType<typeof ansiStyle>) => ReturnType<typeof ansiStyle>
}

/**
 * Compute focus ring styling based on theme and focus state.
 *
 * @example
 * ```tsx
 * const ring = computeFocusRing({ focused: isFocused, colors: theme.colors, variant: 'border' })
 * <box style={ring.applyToStyle(style().padding(1))}>content</box>
 * ```
 */
export function computeFocusRing(config: FocusRingConfig): FocusRingResult {
  const { focused, colors: themeColors, variant = 'border' } = config

  // Derive focus accent color from theme.
  const accentColor = themeColors.primary ?? themeColors.info ?? colors.cyan
  const mutedBorderColor = themeColors.border ?? themeColors.textDim ?? colors.gray
  const surfaceBg = themeColors.bg ?? undefined

  if (!focused) {
    return {
      borderColor: mutedBorderColor,
      backgroundColor: undefined,
      foregroundColor: undefined,
      gutterChar: ' ',
      showGutter: false,
      applyToStyle: (base) => (base ?? ansiStyle()).border('rounded').borderColor(mutedBorderColor),
    }
  }

  switch (variant) {
    case 'border':
      return {
        borderColor: accentColor,
        backgroundColor: undefined,
        foregroundColor: undefined,
        gutterChar: ' ',
        showGutter: false,
        applyToStyle: (base) => (base ?? ansiStyle()).border('rounded').borderColor(accentColor),
      }

    case 'gutter':
      return {
        borderColor: accentColor,
        backgroundColor: undefined,
        foregroundColor: undefined,
        gutterChar: '▸',
        showGutter: true,
        applyToStyle: (base) => (base ?? ansiStyle()).foreground(accentColor),
      }

    case 'pill':
      return {
        borderColor: accentColor,
        backgroundColor: accentColor,
        foregroundColor: surfaceBg ?? colors.black,
        gutterChar: ' ',
        showGutter: false,
        applyToStyle: (base) =>
          (base ?? ansiStyle()).background(accentColor).foreground(surfaceBg ?? colors.black).bold(true),
      }

    case 'underline':
      return {
        borderColor: accentColor,
        backgroundColor: undefined,
        foregroundColor: undefined,
        gutterChar: ' ',
        showGutter: false,
        applyToStyle: (base) => (base ?? ansiStyle()).underline(true).foreground(accentColor),
      }

    default:
      return {
        borderColor: accentColor,
        backgroundColor: undefined,
        foregroundColor: undefined,
        gutterChar: ' ',
        showGutter: false,
        applyToStyle: (base) => (base ?? ansiStyle()).border('rounded').borderColor(accentColor),
      }
  }
}

/**
 * Quick helper: returns the appropriate border color for a focusable element.
 * Use when you just need the color, not the full FocusRingResult.
 */
export function focusBorderColor(focused: boolean, themeColors: ThemeColors): unknown {
  if (focused) {
    return themeColors.primary ?? themeColors.info ?? colors.cyan
  }
  return themeColors.border ?? themeColors.textDim ?? colors.gray
}
