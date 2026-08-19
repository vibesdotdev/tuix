/**
 * Locate the Ghostty binary for automation.
 */

import { execSync, type ExecSyncOverride } from './exec'

export interface GhosttyLocation {
  bin: string
  source: 'env' | 'app-bundle' | 'path'
}

const APP_BUNDLE_BIN = '/Applications/Ghostty.app/Contents/MacOS/ghostty'

/**
 * Resolve the Ghostty CLI binary.
 *
 * Order: TUIX_GHOSTTY_BIN env override → the macOS app bundle path →
 * a `ghostty` found on PATH. Throws with a recovery hint when absent.
 */
export function resolveGhosttyBin(
  env: Record<string, string | undefined> = process.env,
  exists: (p: string) => boolean = defaultExists,
  exec: ExecSyncOverride = defaultExec
): GhosttyLocation {
  const fromEnv = env.TUIX_GHOSTTY_BIN
  if (fromEnv && fromEnv.trim()) {
    if (!exists(fromEnv)) {
      throw new Error(`TUIX_GHOSTTY_BIN points at a missing binary: ${fromEnv}`)
    }
    return { bin: fromEnv, source: 'env' }
  }
  if (exists(APP_BUNDLE_BIN)) {
    return { bin: APP_BUNDLE_BIN, source: 'app-bundle' }
  }
  try {
    const which = exec('which ghostty').trim()
    if (which && exists(which)) {
      return { bin: which, source: 'path' }
    }
  } catch {
    // which not found / ghostty not on PATH — fall through to the error
  }
  throw new Error(
    'Ghostty binary not found. Install Ghostty (https://ghostty.org), or set ' +
      'TUIX_GHOSTTY_BIN to the ghostty CLI path.'
  )
}

import { existsSync } from 'node:fs'
import { execSync as defaultExecSync } from 'node:child_process'

const defaultExists = existsSync
const defaultExec = (cmd: string): string => defaultExecSync(cmd, { encoding: 'utf8' }) as string
