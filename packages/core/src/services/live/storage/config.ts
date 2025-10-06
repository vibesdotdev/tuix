/**
 * Configuration Storage Implementation
 *
 * Manages application configuration files
 */

import { Effect, Ref, Stream } from 'effect'
import { StorageError } from '../../../types/errors'
import { StorageUtils } from '../../storage'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { z } from 'zod'

/**
 * Configuration storage operations
 */
export class ConfigStorage {
  constructor(private configStore: Ref.Ref<Map<string, unknown>>) {}

  /**
   * Get a configuration value by key
   */
  get<T = unknown>(key: string): Effect.Effect<T | null, StorageError> {
    return Effect.sync(() => {
      const map = Ref.get(this.configStore)
      return map.get(key) as T | null
    })
  }

  /**
   * Set a configuration value by key
   */
  set<T = unknown>(key: string, value: T): Effect.Effect<void, StorageError> {
    return Effect.sync(() => {
      const map = Ref.get(this.configStore)
      map.set(key, value)
      Ref.set(this.configStore, map)
    })
  }

  /**
   * Load configuration from a file
   */
  loadFromFile(path: string): Effect.Effect<void, StorageError> {
    return Effect.tryPromise({
      try: async () => {
        const data = await fs.readFile(path, 'utf-8')
        const config = JSON.parse(data)
        const map = new Map<string, unknown>(Object.entries(config))
        Ref.set(this.configStore, map)
      },
      catch: (error) => new StorageError({
        path,
        operation: 'read',
        cause: error,
        message: `Failed to load configuration from ${path}`
      })
    })
  }

  /**
   * Save configuration to a file
   */
  saveToFile(path: string): Effect.Effect<void, StorageError> {
    return Effect.tryPromise({
      try: async () => {
        const map = Ref.get(this.configStore)
        const config = Object.fromEntries(map)
        await fs.writeFile(path, JSON.stringify(config, null, 2), 'utf-8')
      },
      catch: (error) => new StorageError({
        path,
        operation: 'write',
        cause: error,
        message: `Failed to save configuration to ${path}`
      })
    })
  }

  /**
   * Get all configuration keys
   */
  keys(): Effect.Effect<IterableIterator<string>, never> {
    return Effect.sync(() => Ref.get(this.configStore).keys())
  }

  /**
   * Check if a key exists
   */
  has(key: string): Effect.Effect<boolean, never> {
    return Effect.sync(() => Ref.get(this.configStore).has(key))
  }

  /**
   * Delete a configuration key
   */
  delete(key: string): Effect.Effect<void, StorageError> {
    return Effect.sync(() => {
      const map = Ref.get(this.configStore)
      map.delete(key)
      Ref.set(this.configStore, map)
    })
  }

  /**
   * Clear all configuration
   */
  clear(): Effect.Effect<void, never> {
    return Effect.sync(() => {
      Ref.set(this.configStore, new Map())
    })
  }
}
```

Now let me also fix the cache.ts file:

<tool_call>
<function=edit_file>
<parameter=path>
tuix/packages/core/src/services/live/storage/cache.ts
</parameter>
<parameter=mode>
edit
</parameter>
<parameter=display_description>
Fix cache storage error import to use proper package path
</parameter>
</function>
</tool_call>
