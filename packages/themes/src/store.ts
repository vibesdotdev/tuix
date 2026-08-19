/**
 * Global theme store — a reactive `$state<Theme>` accessible from any layer.
 *
 * The UI layer (`@tuix/ui`) and the JSX runtime (`@tuix/jsx`) both read this
 * store so `<text variant="primary">` and `useUITheme()` resolve through the
 * same reactive source. Components don't need to import `useUITheme` just to
 * get a color — the `<text>` intrinsic reads the theme directly.
 */

import { $state } from '@tuix/reactive'
import type { Theme } from './types'
import { vibesTheme } from './themes/vibes'

const globalTheme = $state<Theme>(vibesTheme, '__tuix_theme')

/** Read the current theme (reactive — re-renders on change). */
export function getTheme(): Theme {
  return globalTheme()
}

/** Replace the theme (reactive — consumers re-render). */
export function setGlobalTheme(theme: Theme): void {
  globalTheme.$set(theme)
}

/** Restore the default vibes theme. */
export function resetGlobalTheme(): void {
  globalTheme.$set(vibesTheme)
}

/** Map a semantic variant to the theme's color token. */
export function themeColor(
  variant:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'default'
    | 'dim'
    | 'bright'
    | 'faint'
): string {
  const t = globalTheme()
  const c = t.colors
  switch (variant) {
    case 'primary':
      return c.primary
    case 'secondary':
      return c.secondary
    case 'tertiary':
      return c.tertiary
    case 'success':
      return c.success
    case 'danger':
      return c.danger
    case 'warning':
      return c.warning
    case 'info':
      return c.info
    case 'dim':
      return c.textDim ?? c.secondary
    case 'bright':
      return c.textBright ?? c.fg
    case 'faint':
      return c.textFaint ?? c.textDim ?? c.secondary
    case 'default':
    default:
      return c.fg
  }
}
