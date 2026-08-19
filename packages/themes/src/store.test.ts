import { describe, expect, test } from 'bun:test'
import { getTheme, setGlobalTheme, resetGlobalTheme, themeColor } from './store'
import { vibesTheme } from './themes/vibes'
import { flatTheme } from './themes/flat'

describe('theme store', () => {
  test('getTheme returns the default vibes theme', () => {
    resetGlobalTheme()
    expect(getTheme().name).toBe(vibesTheme.name)
  })

  test('setGlobalTheme switches the active theme', () => {
    setGlobalTheme(flatTheme)
    expect(getTheme().name).toBe(flatTheme.name)
    resetGlobalTheme()
  })

  test('themeColor maps variants to the current theme tokens', () => {
    setGlobalTheme(flatTheme)
    expect(themeColor('primary')).toBe(flatTheme.colors.primary)
    expect(themeColor('success')).toBe(flatTheme.colors.success)
    expect(themeColor('dim')).toBe(flatTheme.colors.textDim ?? flatTheme.colors.secondary)
    expect(themeColor('default')).toBe(flatTheme.colors.fg)
    resetGlobalTheme()
  })

  test('themeColor falls back through dim → secondary when textDim is absent', () => {
    const noDim: typeof flatTheme = {
      ...flatTheme,
      colors: { ...flatTheme.colors, textDim: undefined },
    }
    setGlobalTheme(noDim)
    expect(themeColor('dim')).toBe(noDim.colors.secondary)
    resetGlobalTheme()
  })
})
