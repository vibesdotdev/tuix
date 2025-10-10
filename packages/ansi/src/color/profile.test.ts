/**
 * Color Profile Detection Tests
 */

import { describe, test, expect } from 'bun:test'
import { ColorProfile, detectColorProfile } from './profile'

describe('ColorProfile', () => {
  test('should have NoColor profile', () => {
    expect(ColorProfile.NoColor).toBe(0)
  })

  test('should have ANSI profile', () => {
    expect(ColorProfile.ANSI).toBe(1)
  })

  test('should have ANSI256 profile', () => {
    expect(ColorProfile.ANSI256).toBe(2)
  })

  test('should have TrueColor profile', () => {
    expect(ColorProfile.TrueColor).toBe(3)
  })

  test('should have profiles in ascending capability order', () => {
    expect(ColorProfile.NoColor).toBeLessThan(ColorProfile.ANSI)
    expect(ColorProfile.ANSI).toBeLessThan(ColorProfile.ANSI256)
    expect(ColorProfile.ANSI256).toBeLessThan(ColorProfile.TrueColor)
  })
})

describe('detectColorProfile', () => {
  test('should return a valid ColorProfile', () => {
    const profile = detectColorProfile()
    expect(profile).toBeGreaterThanOrEqual(ColorProfile.NoColor)
    expect(profile).toBeLessThanOrEqual(ColorProfile.TrueColor)
  })

  test('should return consistent results', () => {
    const first = detectColorProfile()
    const second = detectColorProfile()
    expect(first).toBe(second)
  })

  test('should return a number', () => {
    const profile = detectColorProfile()
    expect(typeof profile).toBe('number')
  })

  test('should detect some color support in Bun environment', () => {
    // Bun typically supports at least ANSI colors
    const profile = detectColorProfile()
    expect(profile).toBeGreaterThanOrEqual(ColorProfile.ANSI)
  })
})
