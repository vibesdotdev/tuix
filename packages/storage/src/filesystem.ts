/**
 * Filesystem-based storage implementation with TTL support
 */

import { Effect } from 'effect'
import type { Storage, StorageEntry, StorageOptions, StorageError } from './types.ts'

/**
 * Filesystem storage implementation using Bun.file
 */
export class FilesystemStorage implements Storage {
  private watchers = new Map<string, Set<(value: unknown) => void>>()

  constructor(private basePath: string) {}

  private getFilePath(key: string): string {
    // Encode key to be filesystem-safe
    const encoded = encodeURIComponent(key)
    return `${this.basePath}/${encoded}.json`
  }

  private async ensureDirectory(): Promise<void> {
    try {
      // Create directory if it doesn't exist
      await Bun.$`mkdir -p ${this.basePath}`.quiet()
    } catch {
      // Directory might already exist, that's ok
    }
  }

  get<T = unknown>(key: string): Effect.Effect<T | null, StorageError> {
    return Effect.tryPromise({
      try: async () => {
        const filePath = this.getFilePath(key)
        const file = Bun.file(filePath)

        if (!(await file.exists())) {
          return null
        }

        const entry = (await file.json()) as StorageEntry<T>

        // Check if expired
        if (entry.expiresAt && Date.now() >= entry.expiresAt) {
          await Bun.$`rm -f ${filePath}`.quiet()
          return null
        }

        return entry.value
      },
      catch: error => ({
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
    return Effect.tryPromise({
      try: async () => {
        await this.ensureDirectory()

        const filePath = this.getFilePath(key)
        const file = Bun.file(filePath)

        const now = Date.now()
        let createdAt = now

        // Preserve createdAt if entry already exists
        if (await file.exists()) {
          const existing = (await file.json()) as StorageEntry<T>
          createdAt = existing.createdAt
        }

        const entry: StorageEntry<T> = {
          key,
          value,
          createdAt,
          updatedAt: now,
          expiresAt: options?.ttl ? now + options.ttl : undefined,
        }

        await Bun.write(filePath, JSON.stringify(entry, null, 2))

        // Notify watchers
        this.notifyWatchers(key, value)
      },
      catch: error => ({
        _tag: 'StorageError' as const,
        message: `Failed to set key "${key}"`,
        cause: error,
      }),
    })
  }

  delete(key: string): Effect.Effect<boolean, StorageError> {
    return Effect.tryPromise({
      try: async () => {
        const filePath = this.getFilePath(key)
        const file = Bun.file(filePath)

        if (!(await file.exists())) {
          return false
        }

        await Bun.$`rm -f ${filePath}`.quiet()

        // Notify watchers of deletion
        this.notifyWatchers(key, null)

        return true
      },
      catch: error => ({
        _tag: 'StorageError' as const,
        message: `Failed to delete key "${key}"`,
        cause: error,
      }),
    })
  }

  has(key: string): Effect.Effect<boolean, StorageError> {
    return Effect.tryPromise({
      try: async () => {
        const filePath = this.getFilePath(key)
        const file = Bun.file(filePath)

        if (!(await file.exists())) {
          return false
        }

        const entry = (await file.json()) as StorageEntry

        // Check if expired
        if (entry.expiresAt && Date.now() >= entry.expiresAt) {
          await Bun.$`rm -f ${filePath}`.quiet()
          return false
        }

        return true
      },
      catch: error => ({
        _tag: 'StorageError' as const,
        message: `Failed to check key "${key}"`,
        cause: error,
      }),
    })
  }

  keys(prefix?: string): Effect.Effect<string[], StorageError> {
    return Effect.tryPromise({
      try: async () => {
        await this.ensureDirectory()

        const glob = new Bun.Glob('*.json')
        const keys: string[] = []
        const now = Date.now()

        for await (const fileName of glob.scan(this.basePath)) {
          const filePath = `${this.basePath}/${fileName}`
          const file = Bun.file(filePath)
          const entry = (await file.json()) as StorageEntry

          // Skip expired entries
          if (entry.expiresAt && now >= entry.expiresAt) {
            await Bun.$`rm -f ${filePath}`.quiet()
            continue
          }

          const key = decodeURIComponent(fileName.replace('.json', ''))

          // Filter by prefix if provided
          if (!prefix || key.startsWith(prefix)) {
            keys.push(key)
          }
        }

        return keys
      },
      catch: error => ({
        _tag: 'StorageError' as const,
        message: `Failed to list keys`,
        cause: error,
      }),
    })
  }

  clear(prefix?: string): Effect.Effect<void, StorageError> {
    return Effect.tryPromise({
      try: async () => {
        await this.ensureDirectory()

        const glob = new Bun.Glob('*.json')

        for await (const fileName of glob.scan(this.basePath)) {
          const key = decodeURIComponent(fileName.replace('.json', ''))

          // Filter by prefix if provided
          if (!prefix || key.startsWith(prefix)) {
            const filePath = `${this.basePath}/${fileName}`
            await Bun.$`rm -f ${filePath}`.quiet()
          }
        }
      },
      catch: error => ({
        _tag: 'StorageError' as const,
        message: `Failed to clear storage`,
        cause: error,
      }),
    })
  }

  entries<T = unknown>(prefix?: string): Effect.Effect<Array<StorageEntry<T>>, StorageError> {
    return Effect.tryPromise({
      try: async () => {
        await this.ensureDirectory()

        const glob = new Bun.Glob('*.json')
        const entries: Array<StorageEntry<T>> = []
        const now = Date.now()

        for await (const fileName of glob.scan(this.basePath)) {
          const filePath = `${this.basePath}/${fileName}`
          const file = Bun.file(filePath)
          const entry = (await file.json()) as StorageEntry<T>

          // Skip expired entries
          if (entry.expiresAt && now >= entry.expiresAt) {
            await Bun.$`rm -f ${filePath}`.quiet()
            continue
          }

          const key = decodeURIComponent(fileName.replace('.json', ''))

          // Filter by prefix if provided
          if (!prefix || key.startsWith(prefix)) {
            entries.push(entry)
          }
        }

        return entries
      },
      catch: error => ({
        _tag: 'StorageError' as const,
        message: `Failed to list entries`,
        cause: error,
      }),
    })
  }

  cleanup(): Effect.Effect<number, StorageError> {
    return Effect.tryPromise({
      try: async () => {
        await this.ensureDirectory()

        const glob = new Bun.Glob('*.json')
        const now = Date.now()
        let count = 0

        for await (const fileName of glob.scan(this.basePath)) {
          const filePath = `${this.basePath}/${fileName}`
          const file = Bun.file(filePath)
          const entry = (await file.json()) as StorageEntry

          if (entry.expiresAt && now >= entry.expiresAt) {
            await Bun.$`rm -f ${filePath}`.quiet()
            const key = decodeURIComponent(fileName.replace('.json', ''))
            this.notifyWatchers(key, null)
            count++
          }
        }

        return count
      },
      catch: error => ({
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
      catch: error => ({
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
 * Create a new filesystem storage instance
 */
export const makeFilesystemStorage = (basePath: string): Storage => new FilesystemStorage(basePath)
