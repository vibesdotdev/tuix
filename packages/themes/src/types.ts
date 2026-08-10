/**
 * @tuix/themes - Theme system types
 *
 * Defines the theme structure for TUIX applications.
 */

/**
 * Color palette for a theme
 *
 * Standard color system:
 * - primary, secondary, tertiary: Brand/UI colors
 * - bg, fg: Background and foreground (adapts to dark/light)
 * - success, danger, warning, info: Semantic colors
 */
export interface ThemeColors {
  // Brand colors
  primary: string
  secondary: string
  tertiary: string

  // Base colors (adaptive)
  bg: string // Background
  fg: string // Foreground (text)

  // Semantic colors
  success: string
  danger: string
  warning: string
  info: string

  // UI element colors (derived)
  border?: string
  borderSubtle?: string
  selection?: string
  highlight?: string

  // Text variations (derived)
  textDim?: string
  textBright?: string
}

/**
 * Typography settings for a theme
 */
export interface ThemeTypography {
  // Text styles
  bold: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean

  // Borders
  borderStyle: 'single' | 'double' | 'rounded' | 'heavy' | 'light'
}

/**
 * Spacing settings for a theme
 */
export interface ThemeSpacing {
  padding: number
  margin: number
  gap: number
}

/**
 * Complete theme definition
 */
export interface Theme {
  name: string
  description?: string
  colors: ThemeColors
  typography: ThemeTypography
  spacing: ThemeSpacing
}

/**
 * Theme configuration options
 */
export interface ThemeConfig {
  /**
   * Default theme to use
   */
  defaultTheme?: string

  /**
   * Custom themes to register
   */
  customThemes?: Record<string, Theme>

  /**
   * Allow theme switching at runtime
   */
  allowSwitching?: boolean
}

/**
 * Error type for theme operations
 */
export interface ThemeError {
  _tag: 'ThemeError'
  message: string
  cause?: unknown
}
