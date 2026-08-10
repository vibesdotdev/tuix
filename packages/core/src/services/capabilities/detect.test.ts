import { test, expect, describe } from 'bun:test'
import {
  detectCapabilities,
  detectColorLevel,
  detectGraphicsFromEnv,
  selectGraphicsProtocol,
} from './detect'
import { parseCursorPositionReport, accumulateCpr } from './cpr'
import {
  parsePrimaryDA,
  accumulatePrimaryDA,
  probeFromEnv,
  mergeProbeResults,
  REQUEST_PRIMARY_DA,
} from './da'

describe('detectColorLevel', () => {
  test('truecolor from COLORTERM', () => {
    expect(detectColorLevel({ COLORTERM: 'truecolor' })).toBe('truecolor')
  })
  test('NO_COLOR wins', () => {
    expect(detectColorLevel({ NO_COLOR: '1', COLORTERM: 'truecolor' })).toBe('none')
  })
  test('256color from TERM', () => {
    expect(detectColorLevel({ TERM: 'xterm-256color' })).toBe('256')
  })
})

describe('detectGraphicsFromEnv', () => {
  test('kitty from TERM', () => {
    expect(detectGraphicsFromEnv({ TERM: 'xterm-kitty' }).kitty).toBe(true)
  })
  test('iterm from TERM_PROGRAM', () => {
    expect(detectGraphicsFromEnv({ TERM_PROGRAM: 'iTerm.app' }).iterm2).toBe(true)
  })
  test('sixel from WezTerm not hard-coded false', () => {
    expect(detectGraphicsFromEnv({ TERM_PROGRAM: 'WezTerm' }).sixel).toBe(true)
  })
  test('sixel from TERM_FEATURES', () => {
    expect(detectGraphicsFromEnv({ TERM_FEATURES: 'sixel' }).sixel).toBe(true)
  })
  test('plain xterm does not claim sixel', () => {
    expect(detectGraphicsFromEnv({ TERM: 'xterm' }).sixel).toBe(false)
  })
})

describe('detectCapabilities', () => {
  test('probe overrides env for sixel', () => {
    const caps = detectCapabilities({
      env: { TERM: 'xterm' },
      probe: { sixel: true },
    })
    expect(caps.sixel).toBe(true)
  })
  test('probe can deny mouse', () => {
    const caps = detectCapabilities({
      env: { TERM: 'xterm-256color' },
      isTTY: true,
      probe: { mouse: false },
    })
    expect(caps.mouse).toBe(false)
  })
  test('columns from input', () => {
    const caps = detectCapabilities({
      env: {},
      columns: 120,
      rows: 40,
    })
    expect(caps.columns).toBe(120)
    expect(caps.rows).toBe(40)
  })
})

describe('selectGraphicsProtocol', () => {
  test('prefer kitty over sixel', () => {
    expect(
      selectGraphicsProtocol({
        colors: 'truecolor',
        unicode: true,
        mouse: true,
        clipboard: false,
        sixel: true,
        kitty: true,
        iterm2: false,
        windowTitle: true,
        columns: 80,
        rows: 24,
      })
    ).toBe('kitty')
  })
  test('none when no graphics', () => {
    expect(
      selectGraphicsProtocol({
        colors: 'basic',
        unicode: true,
        mouse: true,
        clipboard: false,
        sixel: false,
        kitty: false,
        iterm2: false,
        windowTitle: true,
        columns: 80,
        rows: 24,
      })
    ).toBe('none')
  })
})

describe('CPR parse', () => {
  test('parses ESC[row;colR', () => {
    expect(parseCursorPositionReport('\x1b[12;34R')).toEqual({ x: 34, y: 12 })
  })
  test('returns null for garbage', () => {
    expect(parseCursorPositionReport('hello')).toBeNull()
  })
  test('accumulate across chunks', () => {
    expect(accumulateCpr(['\x1b[', '5;10', 'R'])).toEqual({ x: 10, y: 5 })
  })
})

describe('DA probe protocol (pure, no TTY)', () => {
  test('REQUEST_PRIMARY_DA is CSI c', () => {
    expect(REQUEST_PRIMARY_DA).toBe('\x1b[c')
  })

  test('parsePrimaryDA extracts sixel param 4', () => {
    const r = parsePrimaryDA('\x1b[?64;1;2;4;6;9;15;18;21;22c')
    expect(r).not.toBeNull()
    expect(r!.sixel).toBe(true)
    expect(r!.truecolor).toBe(true)
  })

  test('parsePrimaryDA without sixel param', () => {
    const r = parsePrimaryDA('\x1b[?1;2c')
    expect(r).not.toBeNull()
    expect(r!.sixel).toBeUndefined()
  })

  test('accumulatePrimaryDA across chunks', () => {
    const r = accumulatePrimaryDA(['\x1b[?', '64;4', 'c'])
    expect(r?.sixel).toBe(true)
  })

  test('probeFromEnv TUIX_PROBE overrides', () => {
    expect(probeFromEnv({ TUIX_PROBE_SIXEL: '1', TUIX_PROBE_KITTY: '0' })).toEqual({
      sixel: true,
      kitty: false,
    })
  })

  test('mergeProbeResults: env overrides DA', () => {
    const da = parsePrimaryDA('\x1b[?64;4c')!
    const env = probeFromEnv({ TUIX_PROBE_SIXEL: '0' })
    const merged = mergeProbeResults(da, env)
    expect(merged.sixel).toBe(false)
  })

  test('detectCapabilities uses merged probe (env override path)', () => {
    const probe = mergeProbeResults(
      parsePrimaryDA('\x1b[?64;4c') ?? undefined,
      probeFromEnv({ TUIX_PROBE_SIXEL: '0', TUIX_PROBE_KITTY: '1' })
    )
    const caps = detectCapabilities({
      env: { TERM: 'xterm' },
      probe,
    })
    expect(caps.sixel).toBe(false)
    expect(caps.kitty).toBe(true)
  })
})
