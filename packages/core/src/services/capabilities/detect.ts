/**
 * Probe-backed terminal capability detection.
 * Pure decision logic over env + optional probe results — unit-testable without a TTY.
 */

import type { TerminalCapabilities } from '../../types/schemas'

export interface CapabilityEnv {
  readonly TERM?: string
  readonly TERM_PROGRAM?: string
  readonly COLORTERM?: string
  readonly NO_COLOR?: string
  readonly FORCE_COLOR?: string
  readonly COLOR_TERM?: string
  readonly WT_SESSION?: string
  readonly KITTY_WINDOW_ID?: string
  readonly ITERM_SESSION_ID?: string
  readonly TERM_FEATURES?: string
  readonly COLUMNS?: string
  readonly LINES?: string
}

export interface CapabilityProbeResult {
  /** DA / XTVERSION style responses or feature query answers */
  readonly sixel?: boolean
  readonly kitty?: boolean
  readonly iterm2?: boolean
  readonly mouse?: boolean
  readonly truecolor?: boolean
  readonly unicode?: boolean
}

export interface DetectCapabilitiesInput {
  readonly env: CapabilityEnv
  readonly platform?: string
  readonly columns?: number
  readonly rows?: number
  readonly isTTY?: boolean
  readonly probe?: CapabilityProbeResult
}

/**
 * Detect color level from environment (no probe required).
 */
export function detectColorLevel(env: CapabilityEnv): TerminalCapabilities['colors'] {
  if (env.NO_COLOR != null && env.NO_COLOR !== '') return 'none'
  if (env.FORCE_COLOR === '0') return 'none'
  if (env.COLORTERM === 'truecolor' || env.COLORTERM === '24bit') return 'truecolor'
  if (env.FORCE_COLOR === '3' || env.TERM?.includes('truecolor')) return 'truecolor'
  if (env.TERM?.includes('256color') || env.FORCE_COLOR === '2') return '256'
  if (env.TERM && env.TERM !== 'dumb') return 'basic'
  if (env.FORCE_COLOR === '1') return 'basic'
  return 'none'
}

/**
 * Env heuristics for graphics protocols when no probe result is available.
 * Prefer probe results when present.
 */
export function detectGraphicsFromEnv(env: CapabilityEnv): {
  sixel: boolean
  kitty: boolean
  iterm2: boolean
} {
  const term = env.TERM ?? ''
  const termProgram = env.TERM_PROGRAM ?? ''
  const features = (env.TERM_FEATURES ?? '').toLowerCase()

  const kitty =
    term === 'xterm-kitty' ||
    env.KITTY_WINDOW_ID != null ||
    termProgram.toLowerCase().includes('kitty') ||
    features.includes('kitty')

  const iterm2 =
    termProgram === 'iTerm.app' || env.ITERM_SESSION_ID != null || features.includes('iterm')

  // Sixel: common terminals that support it (not hard-coded false).
  // Weilin/mlterm/xterm with sixel, WezTerm, foot, Windows Terminal recent, etc.
  const sixelFromTerm =
    features.includes('sixel') ||
    /mlterm|yaft|xterm-sixel|foot|wezterm/i.test(term) ||
    termProgram === 'WezTerm' ||
    env.WT_SESSION != null ||
    /sixel/i.test(term)

  // Avoid claiming sixel on kitty (prefers own protocol) unless features say so
  const sixel = sixelFromTerm && !kitty

  return { sixel, kitty, iterm2 }
}

/**
 * Build TerminalCapabilities from env + optional live probe answers.
 * Probe answers override env heuristics for sixel/kitty/iterm2/mouse/color.
 */
export function detectCapabilities(input: DetectCapabilitiesInput): TerminalCapabilities {
  const env = input.env
  const graphics = detectGraphicsFromEnv(env)
  const probe = input.probe ?? {}

  let colors = detectColorLevel(env)
  if (probe.truecolor === true) colors = 'truecolor'
  if (probe.truecolor === false && colors === 'truecolor') colors = '256'

  const mouse =
    probe.mouse !== undefined ? probe.mouse : input.isTTY !== false && env.TERM !== 'dumb'

  const unicode =
    probe.unicode !== undefined
      ? probe.unicode
      : (input.platform ?? process.platform) !== 'win32' || env.WT_SESSION != null

  return {
    colors,
    unicode,
    mouse,
    clipboard: false,
    sixel: probe.sixel !== undefined ? probe.sixel : graphics.sixel,
    kitty: probe.kitty !== undefined ? probe.kitty : graphics.kitty,
    iterm2: probe.iterm2 !== undefined ? probe.iterm2 : graphics.iterm2,
    windowTitle: env.TERM !== 'dumb',
    columns: input.columns ?? (Number(env.COLUMNS) || 80),
    rows: input.rows ?? (Number(env.LINES) || 24),
    alternateScreen: true,
    cursorShapes: true,
  }
}

/**
 * Choose graphics protocol for image output given capabilities.
 * Prefer kitty > iterm2 > sixel > none (cell fallback).
 */
export type GraphicsProtocol = 'kitty' | 'iterm2' | 'sixel' | 'none'

export function selectGraphicsProtocol(caps: TerminalCapabilities): GraphicsProtocol {
  if (caps.kitty) return 'kitty'
  if (caps.iterm2) return 'iterm2'
  if (caps.sixel) return 'sixel'
  return 'none'
}
