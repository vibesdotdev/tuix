/**
 * In-memory storage implementation with TTL support
 */

import { Effect } from 'effect'
import type { Storage, StorageEntry, StorageOptions, StorageError } from './types.ts'

/**
 * In-memory storage implementation
 */
export class MemoryStorage implements Storage {
  private data = new Map<string, StorageEntry>()
  private watchers = new Map<string, Set<(value: unknown) => void>>()

  get<T = unknown>(key: string): Effect.Effect<T | null, StorageError> {
    return Effect.try({
      try: () => {
        const entry = this.data.get(key)
        if (!entry) {
          return null
        }

        // Check if expired
        if (entry.expiresAt && Date.now() >= entry.expiresAt) {
          this.data.delete(key)
          return null
        }

        return entry.value as T
      },
      catch: (error) => ({
        _tag: 'StorageError' as const,
        message: `Failed to get key "${key}"`,
        cause: error,
      }),
    })
  }

  set<T = unknown>(
    key: string,
    value: T,
    options?: StorageOptions
  ): Effect.Effect<void, StorageError> {
    return Effect.try({
      try: () => {
        const now = Date.now()
        const entry: StorageEntry<T> = {
          key,
          value,
          createdAt: this.data.get(key)?.createdAt ?? now,
          updatedAt: now,
          expiresAt: options?.ttl ? now + options.ttl : undefined,
        }
        this.data.set(key, entry)

        // Notify watchers
        this.notifyWatchers(key, value)
      },
      catch: (error) => ({
        _tag: 'StorageError' as const,
        message: `Failed to set key "${key}"`,
        cause: error,
      }),
    })
  }

  delete(key: string): Effect.Effect<boolean, StorageError> {
    return Effect.try({
      try: () => {
        const deleted = this.data.delete(key)
        if (deleted) {
          // Notify watchers of deletion
          this.notifyWatchers(key, null)
        }
        return deleted
      },
      catch: (error) => ({
        _tag: 'StorageError' as const,
        message: `Failed to delete key "${key}"`,
        cause: error,
      }),
    })
  }

  has(key: string): Effect.Effect<boolean, StorageError> {
    return Effect.try({
      try: () => {
        const entry = this.data.get(key)
        if (!entry) {
          return false
        }

        // Check if expired
        if (entry.expiresAt && Date.now() >= entry.expiresAt) {
          this.data.delete(key)
          return false
        }

        return true
      },
      catch: (error) => ({
        _tag: 'StorageError' as const,
        message: `Failed to check key "${key}"`,
        cause: error,
      }),
    })
  }

  keys(prefix?: string): Effect.Effect<string[], StorageError> {
    return Effect.try({
      try: () => {
        const now = Date.now()
        const keys: string[] = []

        for (const [key, entry] of this.data.entries()) {
          // Skip expired entries
          if (entry.expiresAt && now >= entry.expiresAt) {
            this.data.delete(key)
            continue
          }

          // Filter by prefix if provided
          if (!prefix || key.startsWith(prefix)) {
            keys.push(key)
          }
        }

        return keys
      },
      catch: (error) => ({
        _tag: 'StorageError' as const,
        message: `Failed to list keys`,
        cause: error,
      }),
    })
  }

  clear(prefix?: string): Effect.Effect<void, StorageError> {
    return Effect.try({
      try: () => {
        if (prefix) {
          // Clear only keys with prefix
          for (const key of this.data.keys()) {
            if (key.startsWith(prefix)) {
              this.data.delete(key)
            }
          }
        } else {
          // Clear all
          this.data.clear()
        }
      },
      catch: (error) => ({
        _tag: 'StorageError' as const,
        message: `Failed to clear storage`,
        cause: error,
      }),
    })
  }

  entries<T = unknown>(
    prefix?: string
  ): Effect.Effect<Array<StorageEntry<T>>, StorageError> {
    return Effect.try({
      try: () => {
        const now = Date.now()
        const entries: Array<StorageEntry<T>> = []

        for (const [key, entry] of this.data.entries()) {
          // Skip expired entries
          if (entry.expiresAt && now >= entry.expiresAt) {
            this.data.delete(key)
            continue
          }

          // Filter by prefix if provided
          if (!prefix || key.startsWith(prefix)) {
            entries.push(entry as StorageEntry<T>)
          }
        }

        return entries
      },
      catch: (error) => ({
        _tag: 'StorageError' as const,
        message: `Failed to list entries`,
        cause: error,
      }),
    })
  }

  cleanup(): Effect.Effect<number, StorageError> {
    return Effect.try({
      try: () => {
        const now = Date.now()
        let count = 0

        for (const [key, entry] of this.data.entries()) {
          if (entry.expiresAt && now >= entry.expiresAt) {
            this.data.delete(key)
            this.notifyWatchers(key, null)
            count++
          }
        }

        return count
      },
      catch: (error) => ({
        _tag: 'StorageError' as const,
        message: `Failed to cleanup expired entries`,
        cause: error,
      }),
    })
  }

  watch<T = unknown>(
    key: string,
    callback: (value: T | null) => void
  ): Effect.Effect<() => void, StorageError> {
    return Effect.try({
      try: () => {
        // Add callback to watchers
        if (!this.watchers.has(key)) {
          this.watchers.set(key, new Set())
        }
        this.watchers.get(key)!.add(callback as (value: unknown) => void)

        // Return unsubscribe function
        return () => {
          const callbacks = this.watchers.get(key)
          if (callbacks) {
            callbacks.delete(callback as (value: unknown) => void)
            if (callbacks.size === 0) {
              this.watchers.delete(key)
            }
          }
        }
      },
      catch: (error) => ({
        _tag: 'StorageError' as const,
        message: `Failed to watch key "${key}"`,
        cause: error,
      }),
    })
  }

  private notifyWatchers(key: string, value: unknown): void {
    const callbacks = this.watchers.get(key)
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(value)
        } catch (error) {
          // Ignore callback errors
          if (process.env.DEBUG) {
            console.error(`[Storage] Watcher callback error for key "${key}":`, error)
          }
        }
      }
    }
  }
}

/**
 * Create a new in-memory storage instance
 */
export const makeMemoryStorage = (): Storage => new MemoryStorage()
