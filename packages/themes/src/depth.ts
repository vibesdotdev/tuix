import type { Theme, ThemeDepth } from './types'

export function depthOf(theme: Theme): ThemeDepth {
  return theme.depth
}
