/**
 * @tuix/themes - ThemeProvider component
 *
 * JSX component for providing theme context to the application.
 *
 * Note: Effect Layers cannot be provided from a JSX component; apps that
 * want a specific theme should build the layer themselves via
 * `createThemeLayer(theme, customThemes)` and provide it to their runtime.
 */

import type { Theme, ThemeConfig } from './types'
import { useTheme } from './useTheme'

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
    const { theme } = useTheme()
    return <Component {...props} theme={theme()} />
  }
}
