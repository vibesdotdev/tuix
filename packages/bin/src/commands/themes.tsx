/**
 * TUIX CLI - Themes command
 *
 * Interactive gallery: ↑/↓ (or j/k) previews every built-in theme live
 * through setUITheme; the whole screen repaints in the selected palette.
 * A static variant renders when stdout is not a TTY.
 */

/** @jsxImportSource @tuix/jsx */

import { $state, registerKeyHandler } from '@tuix/reactive'
import { StaticLayout, Text, Box, Divider, StatusBar, setUITheme, useUITheme } from '@tuix/ui'
import type { Theme } from '@tuix/themes'
import {
  darkTheme,
  lightTheme,
  nordTheme,
  draculaTheme,
  gruvboxTheme,
  vibesTheme,
} from '@tuix/themes'

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

let keyCleanup: (() => void) | null = null

function ThemesInteractive() {
  const { theme: live } = useUITheme()
  const index = $state(0, 'theme-index')
  const notice = $state('', 'theme-notice')

  if (keyCleanup) keyCleanup()
  keyCleanup = registerKeyHandler(key => {
    const k = key.toLowerCase()
    if (k === 'up' || k === 'k') {
      const next = (index() - 1 + BUILT_IN_THEMES.length) % BUILT_IN_THEMES.length
      index.$set(next)
      setUITheme(BUILT_IN_THEMES[next]!)
      notice.$set('')
      return
    }
    if (k === 'down' || k === 'j') {
      const next = (index() + 1) % BUILT_IN_THEMES.length
      index.$set(next)
      setUITheme(BUILT_IN_THEMES[next]!)
      notice.$set('')
      return
    }
    if (k === 'r') {
      setUITheme(vibesTheme)
      index.$set(0)
      notice.$set('reset to vibes')
      return
    }
    if (k === 'enter') {
      const theme = BUILT_IN_THEMES[index()]!
      notice.$set(`setUITheme(${exportName(theme.name)})`)
    }
  })

  const cols = Math.max(60, process.stdout.columns ?? 80)
  const rows = Math.max(18, process.stdout.rows ?? 24)

  return (
    <flex direction="column" width={cols} height={rows}>
      <text fg={live.colors.textBright}>{`tuix themes   —   ${live.name}`}</text>
      <Text color={live.colors.textDim}>
        Swatches: brand + semantic colors, then depth stack base ▁ surface ▂ overlay ▃ inset ▄
        outset ▅.
      </Text>
      {BUILT_IN_THEMES.map((theme, i) => {
        const active = i === index()
        const cursor = active ? '> ' : '  '
        const mark = theme.name === live.name ? ' ●' : ''
        return (
          <Box direction="vertical" key={theme.name}>
            <Box direction="horizontal">
              <Text color={live.colors.textDim}>{cursor}</Text>
              <Text color={active ? theme.colors.primary : live.colors.fg}>
                {`${theme.name}${mark}`}
              </Text>
              <Text> </Text>
              <Text color={live.colors.textDim}>{theme.description ?? ''}</Text>
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
      })}
      {notice() ? <Text color={live.colors.success}>{notice()}</Text> : null}
      <StatusBar
        width={cols}
        facts={[{ slot: 'theme', value: live.name, tone: 'default' }]}
        hints={[
          { keys: '↑/↓', label: 'preview' },
          { keys: 'enter', label: 'snippet' },
          { keys: 'r', label: 'reset' },
        ]}
      />
    </flex>
  )
}

function exportName(name: string): string {
  const map: Record<string, string> = {
    vibes: 'vibesTheme',
    dark: 'darkTheme',
    light: 'lightTheme',
    nord: 'nordTheme',
    dracula: 'draculaTheme',
    gruvbox: 'gruvboxTheme',
  }
  return map[name] ?? `${name}Theme`
}

function ThemesStatic() {
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
          <Box direction="vertical" key={theme.name}>
            <Box direction="horizontal">
              <Text color={active.colors.textDim}>{theme.name === active.name ? '● ' : '  '}</Text>
              <Text color={theme.colors.primary}>{theme.name}</Text>
              <Text> </Text>
              <Text color={active.colors.textDim}>{theme.description ?? ''}</Text>
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
        ))}
        <Divider margin={1} />
        <Text color={active.colors.textDim}>
          Run in a TTY for the interactive preview (up/down repaints the live theme).
        </Text>
      </Box>
    </StaticLayout>
  )
}

export function ThemesCommand(): JSX.Element {
  return <ThemesStatic />
}

export function ThemesPreviewCommand(): JSX.Element {
  return <ThemesInteractive />
}
ThemesPreviewCommand.interactive = true
