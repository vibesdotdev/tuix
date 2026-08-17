/**
 * TUIX CLI - Themes command
 *
 * Lists every built-in theme with color swatches and depth steps.
 */

/** @jsxImportSource @tuix/jsx */

import { StaticLayout, Text, Box, Divider } from '@tuix/ui'
import type { Theme } from '@tuix/themes'
import {
  darkTheme,
  lightTheme,
  nordTheme,
  draculaTheme,
  gruvboxTheme,
  vibesTheme,
} from '@tuix/themes'
import { useUITheme } from '@tuix/ui'

export const BUILT_IN_THEMES: Theme[] = [
  vibesTheme,
  darkTheme,
  lightTheme,
  nordTheme,
  draculaTheme,
  gruvboxTheme,
]

function Swatch({ hex, glyph = '██' }: { hex: string; glyph?: string }): JSX.Element {
  return <text fg={hex}>{glyph}</text>
}

function ThemeRow({ theme, active }: { theme: Theme; active: boolean }): JSX.Element {
  const { theme: uiTheme } = useUITheme()
  const mark = active ? '● ' : '  '
  return (
    <Box direction="vertical">
      <Box direction="horizontal">
        <Text color={uiTheme.colors.textDim}>{mark}</Text>
        <Text color={theme.colors.primary}>{theme.name}</Text>
        <Text> </Text>
        <Text color={uiTheme.colors.textDim}>{theme.description ?? ''}</Text>
      </Box>
      <Box direction="horizontal">
        <Text> </Text>
        <Swatch hex={theme.colors.primary} />
        <Swatch hex={theme.colors.secondary} />
        <Swatch hex={theme.colors.tertiary} />
        <Swatch hex={theme.colors.success} />
        <Swatch hex={theme.colors.warning} />
        <Swatch hex={theme.colors.danger} />
        <Swatch hex={theme.colors.info} />
        <Text> </Text>
        <Swatch hex={theme.depth.base} glyph="▁" />
        <Swatch hex={theme.depth.surface} glyph="▂" />
        <Swatch hex={theme.depth.overlay} glyph="▃" />
        <Swatch hex={theme.depth.inset} glyph="▄" />
        <Swatch hex={theme.depth.outset} glyph="▅" />
      </Box>
    </Box>
  )
}

export function ThemesCommand(): JSX.Element {
  const { theme: active } = useUITheme()

  return (
    <StaticLayout title="TUIX Themes" version="" widthPercent={0.92} minWidth={44}>
      <Box direction="vertical">
        <Text color={active.colors.textDim}>
          Six built-in themes. Swatches: brand + semantic colors, then depth stack base ▁ surface ▂
          overlay ▃ inset ▄ outset ▅.
        </Text>
        <Divider margin={1} />
        {BUILT_IN_THEMES.map(theme => (
          <ThemeRow key={theme.name} theme={theme} active={theme.name === active.name} />
        ))}
        <Divider margin={1} />
        <Text color={active.colors.textDim}>
          Switch at runtime with setUITheme() or ThemeProvider.
        </Text>
      </Box>
    </StaticLayout>
  )
}
