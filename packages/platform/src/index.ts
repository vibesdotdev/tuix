/**
 * @tuix/platform — Public facade for Live terminal I/O, input, render, storage.
 *
 * **Ownership (v1):** Does not implement Live I/O. Physical Live Layers and Tags
 * live under `@tuix/core` (`services/live`, service interfaces). This package
 * re-exports them so apps can `import { LiveServices } from '@tuix/platform'`.
 * Provide test fakes via the same Tags when not using LiveServices.
 *
 * @module platform
 */

export const PLATFORM_VERSION = '1.0.0-rc.3'

// Relative re-exports keep monorepo resolution reliable; package exports also map.
export {
  TerminalServiceLive,
  InputServiceLive,
  RendererServiceLive,
  StorageServiceLive,
  LiveServices,
} from '../../core/src/services/live/index.ts'

export { TerminalService } from '../../core/src/services/terminal.ts'
export { InputService } from '../../core/src/services/input.ts'
export { RendererService } from '../../core/src/services/renderer.ts'
export { StorageService } from '../../core/src/services/storage.ts'

export {
  detectCapabilities,
  detectColorLevel,
  detectGraphicsFromEnv,
  selectGraphicsProtocol,
  parseCursorPositionReport,
  accumulateCpr,
  REQUEST_CURSOR_POSITION,
  REQUEST_PRIMARY_DA,
  parsePrimaryDA,
  accumulatePrimaryDA,
  probeFromEnv,
  mergeProbeResults,
} from '../../core/src/services/capabilities/index.ts'

export {
  encodeGraphics,
  decodeGraphics,
  encodeSixel,
  decodeSixel,
  encodeKittyImage,
  decodeKittyImage,
  encodeITermImage,
  decodeITermImage,
} from '../../core/src/services/graphics/index.ts'

/** Write image via Live TerminalService (encode + write or cell fallback). */
export async function writeGraphicsLive(image: {
  data: Uint8Array | Buffer | number[]
  width: number
  height: number
  channels?: 1 | 3 | 4
  format?: 'rgb' | 'rgba' | 'png' | 'gray'
  name?: string
}): Promise<{ protocol: 'kitty' | 'iterm2' | 'sixel' | 'none'; fallback: boolean }> {
  const { Effect } = await import('effect')
  const { TerminalService } = await import('../../core/src/services/terminal.ts')
  const { LiveServices } = await import('../../core/src/services/live/index.ts')
  return Effect.runPromise(
    Effect.gen(function* () {
      const term = yield* TerminalService
      return yield* term.writeGraphics(image)
    }).pipe(Effect.provide(LiveServices))
  )
}
