/**
 * @tuix/themes - Context tests
 */

import { test, expect, describe } from 'bun:test'
import { Effect } from 'effect'
import { createThemeLayer, ThemeContext } from './context'
import { darkTheme, lightTheme, nordTheme } from './themes'
import type { Theme } from './types'

describe('@tuix/themes - Context', () => {
  test('creates theme context with dark theme by default', async () => {
    const layer = createThemeLayer()

    const program = ThemeContext.pipe(
      Effect.flatMap((ctx) => ctx.getCurrent())
    )

    const theme = await Effect.runPromise(program.pipe(Effect.provide(layer)))
    expect(theme.name).toBe('dark')
  })

  test('creates theme context with custom default theme', async () => {
    const layer = createThemeLayer(lightTheme)

    const program = ThemeContext.pipe(
      Effect.flatMap((ctx) => ctx.getCurrent())
    )

    const theme = await Effect.runPromise(program.pipe(Effect.provide(layer)))
    expect(theme.name).toBe('light')
  })

  test('can set current theme', async () => {
    const layer = createThemeLayer()

    const program = ThemeContext.pipe(
      Effect.flatMap((ctx) =>
        ctx.setTheme(nordTheme).pipe(
          Effect.flatMap(() => ctx.getCurrent())
        )
      )
    )

    const theme = await Effect.runPromise(program.pipe(Effect.provide(layer)))
    expect(theme.name).toBe('nord')
  })

  test('can get theme by name', async () => {
    const layer = createThemeLayer()

    const program = ThemeContext.pipe(
      Effect.flatMap((ctx) => ctx.getTheme('nord'))
    )

    const theme = await Effect.runPromise(program.pipe(Effect.provide(layer)))
    expect(theme.name).toBe('nord')
  })

  test('fails when getting non-existent theme', async () => {
    const layer = createThemeLayer()

    const program = ThemeContext.pipe(
      Effect.flatMap((ctx) => ctx.getTheme('nonexistent'))
    )

    const result = await Effect.runPromise(
      program.pipe(
        Effect.provide(layer),
        Effect.either
      )
    )

    expect(result._tag).toBe('Left')
  })

  test('can register custom theme', async () => {
    const layer = createThemeLayer()

    const customTheme: Theme = {
      name: 'custom',
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
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        borderStyle: 'single',
      },
      spacing: {
        padding: 1,
        margin: 1,
        gap: 1,
      },
    }

    const program = ThemeContext.pipe(
      Effect.flatMap((ctx) =>
        ctx.registerTheme(customTheme).pipe(
          Effect.flatMap(() => ctx.getTheme('custom'))
        )
      )
    )

    const theme = await Effect.runPromise(program.pipe(Effect.provide(layer)))
    expect(theme.name).toBe('custom')
    expect(theme.colors.primary).toBe('#ff0000')
  })

  test('can get all theme names', async () => {
    const layer = createThemeLayer()

    const program = ThemeContext.pipe(
      Effect.flatMap((ctx) => ctx.getThemeNames())
    )

    const names = await Effect.runPromise(program.pipe(Effect.provide(layer)))
    expect(names).toContain('dark')
    expect(names).toContain('light')
    expect(names).toContain('nord')
    expect(names).toContain('dracula')
  })

  test('can register themes via config', async () => {
    const customTheme: Theme = {
      name: 'custom',
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
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        borderStyle: 'single',
      },
      spacing: {
        padding: 1,
        margin: 1,
        gap: 1,
      },
    }

    const layer = createThemeLayer(undefined, { custom: customTheme })

    const program = ThemeContext.pipe(
      Effect.flatMap((ctx) => ctx.getTheme('custom'))
    )

    const theme = await Effect.runPromise(program.pipe(Effect.provide(layer)))
    expect(theme.name).toBe('custom')
  })
})
