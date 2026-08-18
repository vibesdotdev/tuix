/**
 * Debug Mode Enabler
 */

import { applyDebugPatchesAsync } from './patcher'
import { debug } from './store'
import { DEBUG_DEFAULTS } from '../constants'

let debugEnabled = false
let enabling: Promise<void> = Promise.resolve()

export function enableDebugMode() {
  if (debugEnabled) return
  debugEnabled = true

  debug.system('Debug mode enabled')

  // Apply all patches; the returned promise resolves once the async
  // module patches (JSX/runtime/logger) are in place.
  enabling = applyDebugPatchesAsync({
    patchScope: true,
    patchJSX: true,
    patchRender: true,
    patchLogger: DEBUG_DEFAULTS.CAPTURE_LOGGER,
  })
}

/**
 * Resolves when debug patches (including the async module patches) are
 * fully installed. Await this before starting the app when first-render
 * capture matters.
 */
export function whenDebugReady(): Promise<void> {
  return enabling
}

export function isDebugEnabled(): boolean {
  return debugEnabled || process.env.TUIX_DEBUG === 'true'
}
