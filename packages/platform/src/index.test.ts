import { test, expect, describe } from 'bun:test'
import {
  PLATFORM_VERSION,
  LiveServices,
  TerminalServiceLive,
  detectCapabilities,
  encodeGraphics,
  selectGraphicsProtocol,
  parseCursorPositionReport,
} from './index'

describe('@tuix/platform public surface', () => {
  test('exports version', () => {
    expect(PLATFORM_VERSION).toMatch(/^\d+\.\d+\.\d+/)
  })

  test('exports DA/probe pure helpers', async () => {
    const { parsePrimaryDA, probeFromEnv, mergeProbeResults, REQUEST_PRIMARY_DA } = await import(
      './index.ts'
    )
    expect(REQUEST_PRIMARY_DA).toBe('\x1b[c')
    expect(parsePrimaryDA('\x1b[?64;4c')?.sixel).toBe(true)
    expect(probeFromEnv({ TUIX_PROBE_KITTY: '1' }).kitty).toBe(true)
    expect(mergeProbeResults({ sixel: true }, { sixel: false }).sixel).toBe(false)
  })

  test('exports LiveServices layer (not version-only stub)', () => {
    expect(LiveServices).toBeDefined()
    expect(TerminalServiceLive).toBeDefined()
  })

  test('detectCapabilities is probe-backed (sixel not hard false for WezTerm)', () => {
    const caps = detectCapabilities({
      env: { TERM_PROGRAM: 'WezTerm', TERM: 'xterm-256color' },
      columns: 80,
      rows: 24,
    })
    expect(caps.sixel).toBe(true)
    expect(selectGraphicsProtocol(caps)).toBe('sixel')
  })

  test('encodeGraphics fallback when no protocol', () => {
    const r = encodeGraphics(
      {
        colors: 'basic',
        unicode: true,
        mouse: false,
        clipboard: false,
        sixel: false,
        kitty: false,
        iterm2: false,
        windowTitle: true,
        columns: 80,
        rows: 24,
      },
      { data: Uint8Array.from([0]), width: 1, height: 1, channels: 1, format: 'gray' }
    )
    expect(r.fallback).toBe(true)
  })

  test('CPR parse exported', () => {
    expect(parseCursorPositionReport('\x1b[2;3R')).toEqual({ x: 3, y: 2 })
  })
})
