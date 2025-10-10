/**
 * @tuix/themes - useTheme hook
 *
 * Reactive hook for accessing and updating themes.
 */

import { $state, $derived } from '@tuix/reactive'
import { Effect } from 'effect'
import type { Theme } from './types'
import { ThemeContext } from './context'

/**
 * Theme hook result
 */
export interface UseThemeResult {
  /**
   * Current theme (reactive)
   */
  theme: () => Theme

  /**
   * Set the current theme
   */
  setTheme: (theme: Theme) => void

  /**
   * Set the current theme by name
   */
  setThemeByName: (name: string) => void

  /**
   * Get all available theme names
   */
  themeNames: () => string[]
}

/**
 * Hook for accessing and updating themes
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, setTheme, themeNames } = useTheme()
 *
 *   return (
 *     <box>
 *       <text color={theme().colors.primary}>
 *         Current theme: {theme().name}
 *       </text>
 *       <text color={theme().colors.text}>
 *         Available: {themeNames().join(', ')}
 *       </text>
 *     </box>
 *   )
 * }
 * ```
 */
export function useTheme(): UseThemeResult {
  const currentTheme = $state<Theme | null>(null)
  const availableThemes = $state<string[]>([])

  // Load current theme
  Effect.runPromise(
    ThemeContext.pipe(
      Effect.flatMap((ctx) => ctx.getCurrent()),
      Effect.tap((theme) => Effect.sync(() => currentTheme.$set(theme))),
      Effect.catchAll(() => Effect.void)
    )
  ).catch(() => {})

  // Load available theme names
  Effect.runPromise(
    ThemeContext.pipe(
      Effect.flatMap((ctx) => ctx.getThemeNames()),
      Effect.tap((names) => Effect.sync(() => availableThemes.$set(names))),
      Effect.catchAll(() => Effect.void)
    )
  ).catch(() => {})

  const theme = $derived(() => currentTheme() || { name: 'dark', colors: {}, typography: {}, spacing: {} } as Theme)
  const themeNames = $derived(() => availableThemes())

  function setTheme(newTheme: Theme) {
    Effect.runPromise(
      ThemeContext.pipe(
        Effect.flatMap((ctx) => ctx.setTheme(newTheme)),
        Effect.tap(() => Effect.sync(() => currentTheme.$set(newTheme))),
        Effect.catchAll(() => Effect.void)
      )
    ).catch(() => {})
  }

  function setThemeByName(name: string) {
    Effect.runPromise(
      ThemeContext.pipe(
        Effect.flatMap((ctx) => ctx.getTheme(name)),
        Effect.flatMap((theme) =>
          ThemeContext.pipe(
            Effect.flatMap((ctx) => ctx.setTheme(theme)),
            Effect.map(() => theme)
          )
        ),
        Effect.tap((theme) => Effect.sync(() => currentTheme.$set(theme))),
        Effect.catchAll(() => Effect.void)
      )
    ).catch(() => {})
  }

  return {
    theme,
    setTheme,
    setThemeByName,
    themeNames,
  }
}
