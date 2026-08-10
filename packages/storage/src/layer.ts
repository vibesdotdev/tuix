/**
 * Storage service layers for Effect runtime
 */

import { Effect, Layer } from 'effect'
import { StorageService } from './types.ts'
import { makeMemoryStorage } from './memory.ts'
import { makeFilesystemStorage } from './filesystem.ts'

/**
 * Live in-memory storage layer
 */
export const MemoryStorageLayer = Layer.succeed(StorageService, makeMemoryStorage())

/**
 * Live filesystem storage layer
 */
export const FilesystemStorageLayer = (basePath: string) =>
  Layer.succeed(StorageService, makeFilesystemStorage(basePath))

/**
 * Default storage layer (in-memory)
 */
export const DefaultStorageLayer = MemoryStorageLayer
