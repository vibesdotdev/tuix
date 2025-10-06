/**
 * Live service layers for the tuix runtime.
 *
 * Provides ready-to-use Effect Layers that implement the core runtime services
 * (terminal, input, renderer, storage) and a convenience bundle that merges
 * them into a single layer for application bootstrap.
 */

import { Layer } from 'effect'
import { TerminalServiceLive } from './terminal'
import { InputServiceLive } from './input'
import { RendererServiceLive } from './renderer'
import { StorageServiceLive } from './storage'

/**
 * Convenience layer that wires up all default service implementations.
 * Most entry points should call `Effect.provide(_, LiveServices)`.
 */
export const LiveServices = Layer.mergeAll(
  TerminalServiceLive,
  InputServiceLive,
  RendererServiceLive,
  StorageServiceLive
)

export { TerminalServiceLive } from './terminal'
export { InputServiceLive } from './input'
export { RendererServiceLive } from './renderer'
export { StorageServiceLive } from './storage'

