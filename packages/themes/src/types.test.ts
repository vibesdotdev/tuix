/**
 * @tuix/themes - Type tests
 */

import { test, expect, describe } from 'bun:test'
import type { Theme } from './types'
import { darkTheme, lightTheme, nordTheme, draculaTheme, gruvboxTheme, vibesTheme } from './themes'

describe('@tuix/themes - Types', () => {
  test('darkTheme has all required fields', () => {
    expect(darkTheme.name).toBe('dark')
    expect(darkTheme.colors).toBeDefined()
    expect(darkTheme.typography).toBeDefined()
    expect(darkTheme.spacing).toBeDefined()
  })

  test('lightTheme has all required fields', () => {
    expect(lightTheme.name).toBe('light')
    expect(lightTheme.colors).toBeDefined()
    expect(lightTheme.typography).toBeDefined()
    expect(lightTheme.spacing).toBeDefined()
  })

  test('nordTheme has all required fields', () => {
    expect(nordTheme.name).toBe('nord')
    expect(nordTheme.colors).toBeDefined()
    expect(nordTheme.typography).toBeDefined()
    expect(nordTheme.spacing).toBeDefined()
  })

  test('draculaTheme has all required fields', () => {
    expect(draculaTheme.name).toBe('dracula')
    expect(draculaTheme.colors).toBeDefined()
    expect(draculaTheme.typography).toBeDefined()
    expect(draculaTheme.spacing).toBeDefined()
  })

  test('gruvboxTheme has all required fields', () => {
    expect(gruvboxTheme.name).toBe('gruvbox')
    expect(gruvboxTheme.colors).toBeDefined()
    expect(gruvboxTheme.typography).toBeDefined()
    expect(gruvboxTheme.spacing).toBeDefined()
  })

  test('vibesTheme has all required fields', () => {
    expect(vibesTheme.name).toBe('vibes')
    expect(vibesTheme.colors).toBeDefined()
    expect(vibesTheme.typography).toBeDefined()
    expect(vibesTheme.spacing).toBeDefined()
  })

  test('all themes conform to the unified color schema', () => {
    const themes = [darkTheme, lightTheme, nordTheme, draculaTheme, gruvboxTheme, vibesTheme]

    for (const theme of themes) {
      const c = theme.colors as Record<string, string | undefined>
      expect(c.primary).toBeDefined()
      expect(c.secondary).toBeDefined()
      expect(c.tertiary).toBeDefined()
      expect(c.bg).toBeDefined()
      expect(c.fg).toBeDefined()
      expect(c.success).toBeDefined()
      expect(c.danger).toBeDefined()
      expect(c.warning).toBeDefined()
      expect(c.info).toBeDefined()
      expect(c.border).toBeDefined()
      expect(c.textDim).toBeDefined()
    }
  })

  test('all themes have a full depth stack', () => {
    const themes = [darkTheme, lightTheme, nordTheme, draculaTheme, gruvboxTheme, vibesTheme]

    for (const theme of themes) {
      expect(theme.depth.base).toMatch(/^#/)
      expect(theme.depth.surface).toMatch(/^#/)
      expect(theme.depth.overlay).toMatch(/^#/)
      expect(theme.depth.inset).toMatch(/^#/)
      expect(theme.depth.outset).toMatch(/^#/)
    }
  })

  test('all themes have typography settings', () => {
    const themes = [darkTheme, lightTheme, nordTheme, draculaTheme, gruvboxTheme, vibesTheme]

    for (const theme of themes) {
      expect(typeof theme.typography.bold).toBe('boolean')
      expect(typeof theme.typography.italic).toBe('boolean')
      expect(typeof theme.typography.underline).toBe('boolean')
      expect(theme.typography.borderStyle).toBeDefined()
    }
  })

  test('all themes have spacing settings', () => {
    const themes = [darkTheme, lightTheme, nordTheme, draculaTheme, gruvboxTheme, vibesTheme]

    for (const theme of themes) {
      expect(typeof theme.spacing.padding).toBe('number')
      expect(typeof theme.spacing.margin).toBe('number')
      expect(typeof theme.spacing.gap).toBe('number')
    }
  })

  test('can create custom theme', () => {
    const customTheme: Theme = {
      name: 'custom',
      description: 'Custom theme',
      colors: {
        primary: '#ff0000',
        secondary: '#00ff00',
        tertiary: '#0000ff',
        bg: '#000000',
        fg: '#ffffff',
        success: '#00ff00',
        danger: '#ff0000',
        warning: '#ffff00',
        info: '#0000ff',
        border: '#333333',
        borderSubtle: '#222222',
        selection: '#444444',
        highlight: '#555555',
        textDim: '#888888',
        textBright: '#ffffff',
      },
      typography: {
        bold: true,
        italic: false,
        underline: false,
        strikethrough: false,
        borderStyle: 'double',
      },
      spacing: {
        padding: 2,
        margin: 2,
        gap: 2,
      },
      depth: {
        base: '#000000',
        surface: '#111111',
        overlay: '#222222',
        inset: '#080808',
        outset: '#333333',
      },
    }

    expect(customTheme.name).toBe('custom')
    expect(customTheme.colors.primary).toBe('#ff0000')
    expect(customTheme.typography.bold).toBe(true)
    expect(customTheme.spacing.padding).toBe(2)
  })
})
