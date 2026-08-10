/**
 * Storage Plugin for TUIX
 *
 * Provides storage context to JSX components via useStorage().
 */

import { Effect } from 'effect'
import { MemoryStorage } from '../memory.ts'
import type { Storage } from '../types.ts'

/**
 * Storage context for JSX components
 */
export interface StorageContext {
  get<T = unknown>(key: string): Promise<T | null>
  set<T = unknown>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<boolean>
  has(key: string): Promise<boolean>
  keys(prefix?: string): Promise<string[]>
  clear(prefix?: string): Promise<void>
}

/**
 * Create storage context from a Storage implementation
 */
export const createStorageContext = (storage: Storage): StorageContext => ({
  get: <T = unknown>(key: string) => Effect.runPromise(storage.get<T>(key)),
  set: <T = unknown>(key: string, value: T, ttl?: number) =>
    Effect.runPromise(storage.set(key, value, ttl ? { ttl } : undefined)),
  delete: (key: string) => Effect.runPromise(storage.delete(key)),
  has: (key: string) => Effect.runPromise(storage.has(key)),
  keys: (prefix?: string) => Effect.runPromise(storage.keys(prefix)),
  clear: (prefix?: string) => Effect.runPromise(storage.clear(prefix)),
})

/** Stack of active storage contexts (innermost wins). */
const storageStack: StorageContext[] = []

/** Default memory-backed context for apps that skip <Storage> wrapper. */
let defaultContext: StorageContext | null = null

function getDefaultContext(): StorageContext {
  if (!defaultContext) {
    defaultContext = createStorageContext(new MemoryStorage())
  }
  return defaultContext
}

/**
 * Provide a Storage implementation for child components (and useStorage).
 */
export function provideStorage(storage: Storage): () => void {
  const ctx = createStorageContext(storage)
  storageStack.push(ctx)
  return () => {
    const i = storageStack.lastIndexOf(ctx)
    if (i >= 0) storageStack.splice(i, 1)
  }
}

/**
 * Storage plugin component — installs MemoryStorage for the subtree.
 *
 * @example
 * ```tsx
 * <Storage>
 *   <MyCommand />
 * </Storage>
 * ```
 */
export function Storage(props: {
  children?: unknown
  /** Optional custom backend; defaults to in-memory */
  backend?: Storage
}): unknown {
  const backend = props.backend ?? new MemoryStorage()
  const release = provideStorage(backend)
  try {
    return props.children
  } finally {
    // Keep context available for the render lifecycle of children;
    // release is deferred — for JSX one-shot, push stays until replaced.
    // Call release when a new Storage mounts or app tears down.
    void release
  }
}

/**
 * Access storage from JSX components.
 * Uses the nearest provideStorage/Storage backend, or a process-wide memory default.
 */
export function useStorage(): StorageContext {
  if (storageStack.length > 0) {
    return storageStack[storageStack.length - 1]!
  }
  return getDefaultContext()
}

/** Test helper: reset stack and default. */
export function __resetStoragePluginForTests(): void {
  storageStack.length = 0
  defaultContext = null
}
