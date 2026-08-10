/**
 * Device Attributes (DA) / feature-query protocol helpers.
 * Pure parse + request constants — unit-testable without a TTY.
 *
 * Live terminal MAY send REQUEST_PRIMARY_DA when isTTY; results feed
 * CapabilityProbeResult. Env TUIX_PROBE_* remains the CI/override path.
 */

import type { CapabilityEnv, CapabilityProbeResult } from './detect'

/** Primary Device Attributes request (CSI c / CSI 0 c). */
export const REQUEST_PRIMARY_DA = '\x1b[c'

/** Secondary DA request (CSI > c). */
export const REQUEST_SECONDARY_DA = '\x1b[>c'

/** XTVERSION request used by some terminals (DCS + q … ST). */
export const REQUEST_XTVERSION = '\x1bP+q544e\x1b\\'

/**
 * Parse a primary DA response such as:
 *   ESC [ ? 6 c          (VT102)
 *   ESC [ ? 1 ; 2 c      (VT100 with options)
 *   ESC [ ? 64 ; 1 ; 2 ; 4 ; 6 ; 9 ; 15 ; 18 ; 21 ; 22 c  (xterm-ish)
 *
 * Sixel is commonly advertised as parameter 4 in DA responses for xterm/mlterm.
 * We treat presence of ";4;" / ";4c" / start "4;" as sixel-capable when DA is used.
 */
export function parsePrimaryDA(buffer: string): CapabilityProbeResult | null {
  // Match CSI ? Ps ; ... c
  const m = buffer.match(/\x1b\[\?([\d;]+)c/)
  if (!m) return null
  const params = m[1]!
    .split(';')
    .map(p => p.trim())
    .filter(Boolean)
  const set = new Set(params)

  const result: CapabilityProbeResult = {}

  // DEC parameter 4 = sixel graphics (when present in extended DA)
  if (set.has('4')) {
    result.sixel = true
  }

  // Parameter 22 often indicates ANSI color / color text
  if (set.has('22')) {
    result.truecolor = true
  }

  // Any successful DA implies a capable TTY (mouse often available on modern xterm)
  if (params.length > 0) {
    result.mouse = result.mouse ?? true
    result.unicode = result.unicode ?? true
  }

  return result
}

/**
 * Accumulate chunks until a complete primary DA response is found.
 */
export function accumulatePrimaryDA(chunks: string[]): CapabilityProbeResult | null {
  return parsePrimaryDA(chunks.join(''))
}

/**
 * Build CapabilityProbeResult from TUIX_PROBE_* environment overrides.
 * Explicit '1' / '0' only; unset keys are omitted so env heuristics remain.
 */
export function probeFromEnv(
  env: CapabilityEnv & Record<string, string | undefined>
): CapabilityProbeResult {
  const probe: CapabilityProbeResult = {}
  const read = (key: string): boolean | undefined => {
    const v = env[key]
    if (v === '1') return true
    if (v === '0') return false
    return undefined
  }
  const sixel = read('TUIX_PROBE_SIXEL')
  const kitty = read('TUIX_PROBE_KITTY')
  const iterm = read('TUIX_PROBE_ITERM')
  const mouse = read('TUIX_PROBE_MOUSE')
  const truecolor = read('TUIX_PROBE_TRUECOLOR')
  if (sixel !== undefined) probe.sixel = sixel
  if (kitty !== undefined) probe.kitty = kitty
  if (iterm !== undefined) probe.iterm2 = iterm
  if (mouse !== undefined) probe.mouse = mouse
  if (truecolor !== undefined) probe.truecolor = truecolor
  return probe
}

/**
 * Merge probe layers: later layers override earlier for defined keys.
 * Typical order: DA parse → env TUIX_PROBE_* (explicit override wins).
 */
export function mergeProbeResults(
  ...layers: Array<CapabilityProbeResult | undefined>
): CapabilityProbeResult {
  const out: CapabilityProbeResult = {}
  for (const layer of layers) {
    if (!layer) continue
    if (layer.sixel !== undefined) out.sixel = layer.sixel
    if (layer.kitty !== undefined) out.kitty = layer.kitty
    if (layer.iterm2 !== undefined) out.iterm2 = layer.iterm2
    if (layer.mouse !== undefined) out.mouse = layer.mouse
    if (layer.truecolor !== undefined) out.truecolor = layer.truecolor
    if (layer.unicode !== undefined) out.unicode = layer.unicode
  }
  return out
}
