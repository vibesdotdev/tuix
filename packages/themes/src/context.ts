/**
 * @tuix/themes - Theme context
 *
 * Reactive theme state management using Effect Context.
 */

import { Context, Effect, Layer } from 'effect'
import type { Theme, ThemeError } from './types'
import { darkTheme } from './themes/dark'
import { lightTheme } from './themes/light'
import { nordTheme } from './themes/nord'
import { draculaTheme } from './themes/dracula'
import { gruvboxTheme } from './themes/gruvbox'
import { vibesTheme } from './themes/vibes'
import { flatTheme } from './themes/flat'

/**
 * Theme context service
 */
export interface ThemeContext {
  /**
   * Get the current theme
   */
  getCurrent(): Effect.Effect<Theme, ThemeError>

  /**
   * Set the current theme
   */
  setTheme(theme: Theme): Effect.Effect<void, ThemeError>

  /**
   * Get a registered theme by name
   */
  getTheme(name: string): Effect.Effect<Theme, ThemeError>

  /**
   * Register a custom theme
   */
  registerTheme(theme: Theme): Effect.Effect<void, ThemeError>

  /**
   * Get all registered theme names
   */
  getThemeNames(): Effect.Effect<string[], ThemeError>
}

/**
 * Theme context tag
 */
export const ThemeContext = Context.GenericTag<ThemeContext>('@tuix/themes/ThemeContext')

/**
 * Theme context implementation
 */
class ThemeContextImpl implements ThemeContext {
  private currentTheme: Theme = darkTheme
  private themes: Map<string, Theme> = new Map()

  constructor(defaultTheme?: Theme, customThemes?: Record<string, Theme>) {
    // Register built-in themes
    this.themes.set('dark', darkTheme)
    this.themes.set('light', lightTheme)
    this.themes.set('nord', nordTheme)
    this.themes.set('dracula', draculaTheme)
    this.themes.set('gruvbox', gruvboxTheme)
    this.themes.set('vibes', vibesTheme)
    this.themes.set('flat', flatTheme)

    // Register custom themes
    if (customThemes) {
      Object.entries(customThemes).forEach(([name, theme]) => {
        this.themes.set(name, theme)
      })
    }

    // Set default theme
    if (defaultTheme) {
      this.currentTheme = defaultTheme
    }
  }

  getCurrent(): Effect.Effect<Theme, ThemeError> {
    return Effect.succeed(this.currentTheme)
  }

  setTheme(theme: Theme): Effect.Effect<void, ThemeError> {
    return Effect.try({
      try: () => {
        this.currentTheme = theme
      },
      catch: error => ({
        _tag: 'ThemeError' as const,
        message: 'Failed to set theme',
        cause: error,
      }),
    })
  }

  getTheme(name: string): Effect.Effect<Theme, ThemeError> {
    return Effect.try({
      try: () => {
        const theme = this.themes.get(name)
        if (!theme) {
          throw new Error(`Theme not found: ${name}`)
        }
        return theme
      },
      catch: error => ({
        _tag: 'ThemeError' as const,
        message: `Theme not found: ${name}`,
        cause: error,
      }),
    })
  }

  registerTheme(theme: Theme): Effect.Effect<void, ThemeError> {
    return Effect.try({
      try: () => {
        this.themes.set(theme.name, theme)
      },
      catch: error => ({
        _tag: 'ThemeError' as const,
        message: `Failed to register theme: ${theme.name}`,
        cause: error,
      }),
    })
  }

  getThemeNames(): Effect.Effect<string[], ThemeError> {
    return Effect.succeed(Array.from(this.themes.keys()))
  }
}

/**
 * Create a theme context layer
 */
export function createThemeLayer(
  defaultTheme?: Theme,
  customThemes?: Record<string, Theme>
): Layer.Layer<ThemeContext> {
  return Layer.succeed(ThemeContext, new ThemeContextImpl(defaultTheme, customThemes))
}

/**
 * Live theme context layer (uses dark theme by default)
 */
export const ThemeContextLive = createThemeLayer()
