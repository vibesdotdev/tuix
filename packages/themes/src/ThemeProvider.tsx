/**
 * @tuix/themes - ThemeProvider component
 *
 * JSX component for providing theme context to the application.
 */

import { Effect, Layer } from 'effect'
import type { Theme, ThemeConfig } from './types'
import { createThemeLayer, ThemeContext } from './context'
import { darkTheme } from './themes/dark'
import { lightTheme } from './themes/light'
import { nordTheme } from './themes/nord'
import { draculaTheme } from './themes/dracula'
import { gruvboxTheme } from './themes/gruvbox'
import { vibesTheme } from './themes/vibes'

/**
 * ThemeProvider props
 */
export interface ThemeProviderProps {
  /**
   * Theme configuration
   */
  config?: ThemeConfig

  /**
   * Children components
   */
  children?: JSX.Element | JSX.Element[]
}

/**
 * ThemeProvider component
 *
 * Provides theme context to child components.
 *
 * @example
 * ```tsx
 * import { ThemeProvider } from '@tuix/themes'
 * import { darkTheme } from '@tuix/themes/themes'
 *
 * export default function App() {
 *   return (
 *     <ThemeProvider config={{
 *       defaultTheme: 'dark',
 *       allowSwitching: true
 *     }}>
 *       <MyApp />
 *     </ThemeProvider>
 *   )
 * }
 * ```
 */
export function ThemeProvider(props: ThemeProviderProps): JSX.Element {
  const config = props.config || {}

  // Get default theme
  let defaultTheme: Theme | undefined
  if (config.defaultTheme) {
    const builtInThemes: Record<string, Theme> = {
      dark: darkTheme,
      light: lightTheme,
      nord: nordTheme,
      dracula: draculaTheme,
      gruvbox: gruvboxTheme,
      vibes: vibesTheme,
    }
    defaultTheme = builtInThemes[config.defaultTheme]
  }

  // Create theme layer with config
  const themeLayer = createThemeLayer(defaultTheme, config.customThemes)

  // Apply theme layer to children
  // Note: In a real implementation, this would use Effect's Layer.provide
  // For now, we just render the children since layer providing happens at the app level
  return <>{props.children}</>
}

/**
 * Helper to create a theme-aware component
 *
 * @example
 * ```tsx
 * import { withTheme } from '@tuix/themes'
 *
 * const MyComponent = withTheme((props) => {
 *   const { theme } = props
 *   return <text color={theme.colors.primary}>Hello</text>
 * })
 * ```
 */
export function withTheme<P extends object>(
  Component: (props: P & { theme: Theme }) => JSX.Element
): (props: P) => JSX.Element {
  return (props: P) => {
    // Get current theme from context
    const theme = $state<Theme | null>(null)

    Effect.runPromise(
      ThemeContext.pipe(
        Effect.flatMap(ctx => ctx.getCurrent()),
        Effect.tap(t => Effect.sync(() => theme.$set(t))),
        Effect.catchAll(() => Effect.void)
      )
    ).catch(() => {})

    if (!theme()) {
      return <></>
    }

    return <Component {...props} theme={theme()!} />
  }
}
