/**
 * Storage Type Definitions
 */

import { Effect, Context } from 'effect'

/**
 * Storage entry with optional TTL
 */
export interface StorageEntry<T = unknown> {
  key: string
  value: T
  expiresAt?: number // Unix timestamp in milliseconds
  createdAt: number
  updatedAt: number
}

/**
 * Storage options
 */
export interface StorageOptions {
  ttl?: number // Time-to-live in milliseconds
}

/**
 * Storage service interface
 */
export interface Storage {
  /**
   * Get a value by key
   */
  get<T = unknown>(key: string): Effect.Effect<T | null, StorageError>

  /**
   * Set a value by key
   */
  set<T = unknown>(
    key: string,
    value: T,
    options?: StorageOptions
  ): Effect.Effect<void, StorageError>

  /**
   * Delete a value by key
   */
  delete(key: string): Effect.Effect<boolean, StorageError>

  /**
   * Check if a key exists
   */
  has(key: string): Effect.Effect<boolean, StorageError>

  /**
   * List all keys (optionally with prefix)
   */
  keys(prefix?: string): Effect.Effect<string[], StorageError>

  /**
   * Clear all keys (optionally with prefix)
   */
  clear(prefix?: string): Effect.Effect<void, StorageError>

  /**
   * Get all entries (optionally with prefix)
   */
  entries<T = unknown>(
    prefix?: string
  ): Effect.Effect<Array<StorageEntry<T>>, StorageError>

  /**
   * Remove expired entries
   */
  cleanup(): Effect.Effect<number, StorageError>

  /**
   * Watch for changes to a key
   * Returns an unsubscribe function
   */
  watch<T = unknown>(
    key: string,
    callback: (value: T | null) => void
  ): Effect.Effect<() => void, StorageError>
}

/**
 * Storage error types
 */
export class StorageError {
  readonly _tag = 'StorageError'
  constructor(
    readonly message: string,
    readonly cause?: unknown
  ) {}
}

/**
 * Storage service tag for Effect Context
 */
export class StorageService extends Context.Tag('Storage')<
  StorageService,
  Storage
>() {}
