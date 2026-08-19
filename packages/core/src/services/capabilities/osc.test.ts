import { describe, expect, test } from 'bun:test'

import {
  REQUEST_BG_COLOR,
  REQUEST_FG_COLOR,
  parseOscColorReport,
  luminance,
  colorSchemeFromBackground,
} from './osc'

describe('parseOscColorReport', () => {
  test('parses a 4-digit BEL-terminated background report', () => {
    const report = parseOscColorReport('\x1b]11;rgb:ffff/ffff/ffff\x07')
    expect(report).toEqual({ target: 'bg', rgb: { r: 255, g: 255, b: 255 } })
  })

  test('parses a 2-digit ST-terminated foreground report', () => {
    const report = parseOscColorReport('\x1b]10;rgb:00/00/00\x1b\\')
    expect(report).toEqual({ target: 'fg', rgb: { r: 0, g: 0, b: 0 } })
  })

  test('parses mid-gray scaled from 16-bit', () => {
    const report = parseOscColorReport('\x1b]11;rgb:8080/8080/8080\x07')
    expect(report?.rgb.r).toBeGreaterThan(120)
    expect(report?.rgb.r).toBeLessThan(136)
  })

  test('finds a report inside a noisy reply stream', () => {
    const stream = 'garbage\x1b[?2026;2$y\x1b]11;rgb:1a1a/1a1a/1a1a\x07tail'
    const report = parseOscColorReport(stream)
    expect(report?.target).toBe('bg')
  })

  test('returns null when no report present', () => {
    expect(parseOscColorReport('\x1b[?2026;2$y')).toBeNull()
    expect(parseOscColorReport('')).toBeNull()
  })
})

describe('scheme classification', () => {
  test('white background is light', () => {
    expect(colorSchemeFromBackground({ r: 255, g: 255, b: 255 })).toBe('light')
  })

  test('near-black background is dark', () => {
    expect(colorSchemeFromBackground({ r: 16, g: 16, b: 18 })).toBe('dark')
  })

  test('luminance is bounded 0..1', () => {
    expect(luminance({ r: 0, g: 0, b: 0 })).toBe(0)
    expect(luminance({ r: 255, g: 255, b: 255 })).toBe(1)
  })
})

describe('request sequences', () => {
  test('queries use the documented OSC form', () => {
    expect(REQUEST_FG_COLOR).toBe('\x1b]10;?\x07')
    expect(REQUEST_BG_COLOR).toBe('\x1b]11;?\x07')
  })
})
