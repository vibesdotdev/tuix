import { describe, expect, test } from 'bun:test'

import { flatTheme, themeForColorScheme, vibesTheme, lightTheme } from './index'

describe('flat theme', () => {
  test('registers with the flat name and full palette', () => {
    expect(flatTheme.name).toBe('flat')
    expect(flatTheme.colors.bg).toBeTruthy()
    expect(flatTheme.colors.primary).toBeTruthy()
  })

  test('borders match the surface so boxes render invisibly', () => {
    expect(flatTheme.colors.border).toBe(flatTheme.colors.bg)
    expect(flatTheme.colors.borderSubtle).toBe(flatTheme.colors.bg)
  })

  test('four-level text hierarchy is strictly ordered by contrast vs bg', () => {
    const { textBright, fg, textDim, textFaint } = flatTheme.colors
    const lum = (hex: string) => {
      const v = hex.replace('#', '')
      const r = Number.parseInt(v.slice(0, 2), 16)
      const g = Number.parseInt(v.slice(2, 4), 16)
      const b = Number.parseInt(v.slice(4, 6), 16)
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255
    }
    expect(lum(textBright!)).toBeGreaterThan(lum(fg))
    expect(lum(fg)).toBeGreaterThan(lum(textDim))
    expect(lum(textDim)).toBeGreaterThan(lum(textFaint!))
  })

  test('flat depth keeps base and surface identical', () => {
    expect(flatTheme.depth.base).toBe(flatTheme.depth.surface)
  })
})

describe('themeForColorScheme', () => {
  test('light scheme selects the light theme', () => {
    expect(themeForColorScheme('light')).toBe(lightTheme)
  })

  test('dark scheme keeps the vibes default', () => {
    expect(themeForColorScheme('dark')).toBe(vibesTheme)
  })

  test('unknown never guesses light', () => {
    expect(themeForColorScheme('unknown')).toBe(vibesTheme)
  })
})
