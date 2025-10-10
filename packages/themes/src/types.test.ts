/**
 * @tuix/themes - Type tests
 */

import { test, expect, describe } from 'bun:test'
import type { Theme, ThemeColors, ThemeConfig } from './types'
import { darkTheme, lightTheme, nordTheme, draculaTheme } from './themes'

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

  test('all themes have required color properties', () => {
    const themes = [darkTheme, lightTheme, nordTheme, draculaTheme]

    for (const theme of themes) {
      expect(theme.colors.primary).toBeDefined()
      expect(theme.colors.secondary).toBeDefined()
      expect(theme.colors.accent).toBeDefined()
      expect(theme.colors.background).toBeDefined()
      expect(theme.colors.text).toBeDefined()
      expect(theme.colors.success).toBeDefined()
      expect(theme.colors.warning).toBeDefined()
      expect(theme.colors.error).toBeDefined()
      expect(theme.colors.border).toBeDefined()
    }
  })

  test('all themes have typography settings', () => {
    const themes = [darkTheme, lightTheme, nordTheme, draculaTheme]

    for (const theme of themes) {
      expect(typeof theme.typography.bold).toBe('boolean')
      expect(typeof theme.typography.italic).toBe('boolean')
      expect(typeof theme.typography.underline).toBe('boolean')
      expect(theme.typography.borderStyle).toBeDefined()
    }
  })

  test('all themes have spacing settings', () => {
    const themes = [darkTheme, lightTheme, nordTheme, draculaTheme]

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
        accent: '#0000ff',
        muted: '#888888',
        background: '#000000',
        backgroundAlt: '#111111',
        success: '#00ff00',
        warning: '#ffff00',
        error: '#ff0000',
        info: '#0000ff',
        border: '#333333',
        selection: '#444444',
        highlight: '#555555',
        text: '#ffffff',
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
    }

    expect(customTheme.name).toBe('custom')
    expect(customTheme.colors.primary).toBe('#ff0000')
    expect(customTheme.typography.bold).toBe(true)
    expect(customTheme.spacing.padding).toBe(2)
  })
})
