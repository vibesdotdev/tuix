/**
 * @tuix/themes - Theme system for TUIX applications
 *
 * Provides a complete theming solution with pre-built themes,
 * runtime theme switching, and reactive theme updates.
 *
 * @example
 * ```tsx
 * import { ThemeProvider, useTheme } from '@tuix/themes'
 * import { darkTheme, nordTheme } from '@tuix/themes/themes'
 *
 * export default function App() {
 *   return (
 *     <ThemeProvider config={{ defaultTheme: 'nord' }}>
 *       <MyApp />
 *     </ThemeProvider>
 *   )
 * }
 *
 * function MyApp() {
 *   const { theme, setThemeByName, themeNames } = useTheme()
 *
 *   return (
 *     <box>
 *       <text color={theme().colors.primary}>
 *         Current: {theme().name}
 *       </text>
 *     </box>
 *   )
 * }
 * ```
 */

export type {
  Theme,
  ThemeColors,
  ThemeTypography,
  ThemeSpacing,
  ThemeDepth,
  ThemeConfig,
  ThemeError,
} from './types'
export { depthOf } from './depth'
export type { ThemeContext } from './context'
export type { UseThemeResult } from './useTheme'
export type { ThemeProviderProps } from './ThemeProvider'

export { ThemeContext, createThemeLayer, ThemeContextLive } from './context'
export { useTheme } from './useTheme'
export { ThemeProvider, withTheme } from './ThemeProvider'

// Export built-in themes
export { darkTheme } from './themes/dark'
export { lightTheme } from './themes/light'
export { nordTheme } from './themes/nord'
export { draculaTheme } from './themes/dracula'
export { gruvboxTheme } from './themes/gruvbox'
export { vibesTheme } from './themes/vibes'
export { flatTheme } from './themes/flat'
export { getTheme, setGlobalTheme, resetGlobalTheme, themeColor } from './store'

import { lightTheme as light } from './themes/light'
import { vibesTheme as vibes } from './themes/vibes'

/**
 * Pick the default theme variant for a detected terminal color scheme.
 * Light terminals get the light theme; dark and unknown keep the vibes
 * default (never guess light on failure — a dark app on a light terminal
 * is unreadable, while the reverse merely looks dim).
 */
export function themeForColorScheme(scheme: 'light' | 'dark' | 'unknown'): Theme {
  if (scheme === 'light') return light
  return vibes
}
