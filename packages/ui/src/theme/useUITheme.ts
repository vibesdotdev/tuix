/**
 * @tuix/ui - Theme integration helper
 *
 * Provides easy access to theme colors and utilities for UI components.
 */

import type { Theme, ThemeDepth } from '@tuix/themes'
import { depthOf, vibesTheme } from '@tuix/themes'
import { $state } from '@tuix/reactive'
import { colors } from '@tuix/ansi'

/**
 * Variant types for theme-aware components
 */
export type ThemeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'secondary'

/**
 * UI theme utilities
 */
export interface UITheme {
  /**
   * Current theme
   */
  theme: Theme

  /**
   * Get color for a variant
   */
  getColor: (variant: ThemeVariant) => string

  /**
   * Get border style from theme
   */
  borderStyle: 'single' | 'double' | 'rounded' | 'heavy' | 'light'

  /**
   * Get spacing values
   */
  spacing: {
    padding: number
    margin: number
    gap: number
  }

  depth: ThemeDepth
}

/**
 * Global theme state - defaults to vibes theme
 */
const globalTheme = $state<Theme>(vibesTheme)

/**
 * Switch the theme every `useUITheme` consumer renders with.
 *
 * @example
 * ```tsx
 * import { setUITheme } from '@tuix/ui'
 * import { nordTheme } from '@tuix/themes'
 *
 * setUITheme(nordTheme)
 * ```
 */
export function setUITheme(theme: Theme): void {
  globalTheme.$set(theme)
}

/** Restore the default vibes theme. */
export function resetUITheme(): void {
  globalTheme.$set(vibesTheme)
}

/**
 * Hook for theme-aware UI components
 *
 * @example
 * ```tsx
 * function Panel({ variant = 'default' }) {
 *   const { getColor, borderStyle } = useUITheme()
 *   const borderColor = getColor(variant)
 *
 *   return (
 *     <box border={borderStyle} borderColor={borderColor}>
 *       {children}
 *     </box>
 *   )
 * }
 * ```
 */
export function useUITheme(): UITheme {
  const currentTheme = globalTheme()

  /**
   * Map variant to theme color
   */
  function getColor(variant: ThemeVariant): string {
    switch (variant) {
      case 'primary':
        return currentTheme.colors.primary
      case 'secondary':
        return currentTheme.colors.secondary ?? currentTheme.colors.primary
      case 'success':
        return currentTheme.colors.success
      case 'warning':
        return currentTheme.colors.warning
      case 'error':
        return currentTheme.colors.danger ?? colors.red
      case 'info':
        return currentTheme.colors.info
      case 'default':
      default:
        return currentTheme.colors.border ?? colors.gray
    }
  }

  return {
    theme: currentTheme,
    getColor,
    borderStyle: currentTheme.typography.borderStyle,
    spacing: currentTheme.spacing,
    depth: depthOf(currentTheme),
  }
}

/**
 * Get text color for a variant (for text elements)
 */
export function getTextColor(variant: ThemeVariant, theme: Theme): string {
  switch (variant) {
    case 'primary':
      return theme.colors.primary
    case 'secondary':
      return theme.colors.textDim ?? theme.colors.secondary ?? colors.gray
    case 'success':
      return theme.colors.success
    case 'warning':
      return theme.colors.warning
    case 'error':
      return theme.colors.danger ?? colors.red
    case 'info':
      return theme.colors.info
    case 'default':
    default:
      return theme.colors.textBright ?? theme.colors.fg ?? colors.white
  }
}

/**
 * Get background color for a variant
 */
export function getBackgroundColor(variant: ThemeVariant, theme: Theme): string {
  switch (variant) {
    case 'primary':
      return theme.colors.primary
    case 'success':
      return theme.colors.success
    case 'warning':
      return theme.colors.warning
    case 'error':
      return theme.colors.danger ?? colors.red
    case 'info':
      return theme.colors.info
    case 'default':
    default:
      return theme.colors.borderSubtle ?? theme.colors.bg ?? colors.black
  }
}
