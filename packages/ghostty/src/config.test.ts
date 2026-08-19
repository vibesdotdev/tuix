import { describe, expect, test } from 'bun:test'

import {
  buildGhosttyConfig,
  buildShellWrapper,
  themeToGhosttyColorLines,
  DEFAULT_CHROMA,
} from './config'
import { parseWindowsJson, findWindowByTitlePrefix } from './windows'
import { resolveGhosttyBin } from './locate'

describe('buildGhosttyConfig', () => {
  test('emits the deterministic capture config', () => {
    const text = buildGhosttyConfig({ title: 'tuix-shot-abc' })
    expect(text).toContain('title = tuix-shot-abc')
    expect(text).toContain(`background = ${DEFAULT_CHROMA}`)
    expect(text).toContain('window-save-state = never')
    expect(text).toContain('macos-titlebar-style = hidden')
    expect(text).toContain('quit-after-last-window-closed = true')
    expect(text).toContain('shell-integration = none')
  })

  test('extra lines append verbatim after the base config', () => {
    const text = buildGhosttyConfig({ title: 't', extra: ['palette = 1=#ff0000'] })
    const extraAt = text.indexOf('palette = 1=#ff0000')
    expect(extraAt).toBeGreaterThan(text.indexOf('shell-integration = none'))
  })

  test('custom chroma and font settings are honored', () => {
    const text = buildGhosttyConfig({
      title: 't',
      chroma: '#00ff00',
      fontFamily: 'Berkeley Mono',
      fontSize: 16,
      padding: 20,
    })
    expect(text).toContain('background = #00ff00')
    expect(text).toContain('font-family = Berkeley Mono')
    expect(text).toContain('font-size = 16')
    expect(text).toContain('window-padding-x = 20')
  })
})

describe('themeToGhosttyColorLines', () => {
  test('maps palette, cursor, and selection colors', () => {
    const lines = themeToGhosttyColorLines({
      foreground: '#a6a6ad',
      cursor: '#a78bfa',
      selectionBackground: '#26262c',
      selectionForeground: '#fdf5ce',
      palette: { 0: '#151517', 5: '#a78bfa', 16: '#ignored' },
    })
    expect(lines).toContain('foreground = #a6a6ad')
    expect(lines).toContain('palette = 0=#151517')
    expect(lines).toContain('palette = 5=#a78bfa')
    expect(lines).not.toContain('palette = 16=')
    expect(lines).toContain('cursor-color = #a78bfa')
    expect(lines).toContain('selection-background = #26262c')
  })
})

describe('buildShellWrapper', () => {
  test('pins the PTY grid with stty before exec', () => {
    const wrapped = buildShellWrapper(['bun', 'src/index.ts', 'kit'], 100, 30)
    expect(wrapped[0]).toBe('/bin/sh')
    expect(wrapped[1]).toBe('-c')
    expect(wrapped[2]).toContain('stty cols 100 rows 30')
    expect(wrapped[2]).toContain("exec 'bun' 'src/index.ts' 'kit'")
  })

  test('escapes single quotes in arguments', () => {
    const wrapped = buildShellWrapper(["it's"], 10, 4)
    expect(wrapped[2]).toContain(`exec 'it'\\''s'`)
  })

  test('omits stty when no grid requested', () => {
    expect(buildShellWrapper(['top'])[2]).not.toContain('stty')
  })
})

describe('parseWindowsJson', () => {
  test('parses the Swift lister output shape', () => {
    const ws = parseWindowsJson(
      '[{"id":148816,"title":"tuix-v4","pid":70811,"x":38,"y":44,"w":3364,"h":1345}]'
    )
    expect(ws).toHaveLength(1)
    expect(ws[0]).toMatchObject({ id: 148816, title: 'tuix-v4', w: 3364, h: 1345 })
  })

  test('empty and non-JSON output yield no windows', () => {
    expect(parseWindowsJson('')).toEqual([])
    expect(parseWindowsJson('error: something')).toEqual([])
  })

  test('findWindowByTitlePrefix matches our forced titles only', () => {
    const ws = parseWindowsJson(
      '[{"id":1,"title":"user session","pid":1,"x":0,"y":0,"w":1,"h":1},' +
        '{"id":2,"title":"tuix-shot-xyz","pid":2,"x":0,"y":0,"w":1,"h":1}]'
    )
    expect(findWindowByTitlePrefix(ws, 'tuix-shot')?.id).toBe(2)
    expect(findWindowByTitlePrefix(ws, 'nope')).toBeNull()
  })
})

describe('resolveGhosttyBin', () => {
  test('env override wins and is validated', () => {
    expect(
      resolveGhosttyBin(
        { TUIX_GHOSTTY_BIN: '/custom/ghostty' },
        () => true,
        () => ''
      )
    ).toMatchObject({ bin: '/custom/ghostty', source: 'env' })
    expect(() =>
      resolveGhosttyBin(
        { TUIX_GHOSTTY_BIN: '/missing' },
        () => false,
        () => ''
      )
    ).toThrow(/missing binary/)
  })

  test('falls back to the macOS app bundle', () => {
    const hit = resolveGhosttyBin(
      {},
      p => p.includes('Applications'),
      () => ''
    )
    expect(hit.source).toBe('app-bundle')
  })

  test('throws a recovery hint when ghostty is absent', () => {
    expect(() =>
      resolveGhosttyBin(
        {},
        () => false,
        () => {
          throw new Error('no which')
        }
      )
    ).toThrow(/TUIX_GHOSTTY_BIN/)
  })
})
