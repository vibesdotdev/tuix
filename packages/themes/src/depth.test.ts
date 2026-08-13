import { describe, expect, test } from 'bun:test'
import { darkTheme, lightTheme, nordTheme, draculaTheme, vibesTheme } from './themes'
import { depthOf } from './depth'

const shipped = [darkTheme, lightTheme, nordTheme, draculaTheme, vibesTheme]

describe('theme depth', () => {
  test('every shipped theme has a five-step stack', () => {
    for (const theme of shipped) {
      const depth = depthOf(theme)
      expect(depth.base).toMatch(/^#/)
      expect(depth.surface).toMatch(/^#/)
      expect(depth.overlay).toMatch(/^#/)
      expect(depth.inset).toMatch(/^#/)
      expect(depth.outset).toMatch(/^#/)
      const slots = [depth.base, depth.surface, depth.overlay, depth.inset, depth.outset]
      expect(new Set(slots).size).toBeGreaterThanOrEqual(3)
    }
  })
})
