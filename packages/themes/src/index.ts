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

export type { Theme, ThemeColors, ThemeTypography, ThemeSpacing, ThemeConfig, ThemeError } from './types'
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
export { vibesTheme } from './themes/vibes'
