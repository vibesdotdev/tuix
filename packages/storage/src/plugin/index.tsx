/**
 * Storage Plugin for TUIX
 *
 * Provides storage context to JSX components
 */

import { Effect, Context } from 'effect'
import { StorageService, type Storage } from '../types.ts'

/**
 * Storage context for JSX components
 */
export interface StorageContext {
  /**
   * Get a value from storage
   */
  get<T = unknown>(key: string): Promise<T | null>

  /**
   * Set a value in storage
   */
  set<T = unknown>(key: string, value: T, ttl?: number): Promise<void>

  /**
   * Delete a value from storage
   */
  delete(key: string): Promise<boolean>

  /**
   * Check if a key exists
   */
  has(key: string): Promise<boolean>

  /**
   * List all keys with optional prefix
   */
  keys(prefix?: string): Promise<string[]>

  /**
   * Clear all keys with optional prefix
   */
  clear(prefix?: string): Promise<void>
}

/**
 * Create storage context from storage service
 */
export const createStorageContext = (storage: Storage): StorageContext => ({
  get: <T = unknown>(key: string) =>
    Effect.runPromise(storage.get<T>(key)),

  set: <T = unknown>(key: string, value: T, ttl?: number) =>
    Effect.runPromise(storage.set(key, value, ttl ? { ttl } : undefined)),

  delete: (key: string) =>
    Effect.runPromise(storage.delete(key)),

  has: (key: string) =>
    Effect.runPromise(storage.has(key)),

  keys: (prefix?: string) =>
    Effect.runPromise(storage.keys(prefix)),

  clear: (prefix?: string) =>
    Effect.runPromise(storage.clear(prefix)),
})

/**
 * Storage plugin component
 *
 * Usage:
 * ```tsx
 * <Storage>
 *   <MyCommand />
 * </Storage>
 * ```
 *
 * Then in MyCommand:
 * ```tsx
 * const { storage } = useContext()
 * await storage.set('key', 'value')
 * ```
 */
export function Storage({ children }: { children?: any }) {
  // TODO: This will be properly implemented when we have runtime hooks
  // For now, this is a placeholder that shows the intended API
  return children
}

/**
 * Hook to access storage from context
 *
 * TODO: Implement when runtime hooks are available
 */
export function useStorage(): StorageContext {
  throw new Error('useStorage not yet implemented - waiting for runtime hooks')
}
