/**
 * Configuration Storage Implementation
 *
 * Manages application configuration files
 */

import { Effect, Ref } from 'effect'
import { StorageError } from '../../../types/errors/base'
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
    const store = this.configStore
    return Effect.gen(function* () {
      const map = yield* Ref.get(store)
      return (map.get(key) as T | null) ?? null
    })
  }

  /**
   * Set a configuration value by key
   */
  set<T = unknown>(key: string, value: T): Effect.Effect<void, StorageError> {
    const store = this.configStore
    return Effect.gen(function* () {
      const map = yield* Ref.get(store)
      map.set(key, value)
      yield* Ref.set(store, map)
    })
  }

  /**
   * Load configuration from a file
   */
  loadFromFile(path: string): Effect.Effect<void, StorageError> {
    const store = this.configStore
    return Effect.gen(function* () {
      const data = yield* Effect.tryPromise({
        try: () => fs.readFile(path, 'utf-8'),
        catch: error =>
          new StorageError({
            path,
            operation: 'read',
            cause: error,
            message: `Failed to load configuration from ${path}`,
          }),
      })
      const config = yield* Effect.try({
        try: () => JSON.parse(data) as Record<string, unknown>,
        catch: error =>
          new StorageError({
            path,
            operation: 'parse',
            cause: error,
            message: `Failed to parse configuration from ${path}`,
          }),
      })
      yield* Ref.set(store, new Map<string, unknown>(Object.entries(config)))
    })
  }

  /**
   * Save configuration to a file
   */
  saveToFile(path: string): Effect.Effect<void, StorageError> {
    const store = this.configStore
    return Effect.gen(function* () {
      const map = yield* Ref.get(store)
      const config = Object.fromEntries(map)
      yield* Effect.tryPromise({
        try: () => fs.writeFile(path, JSON.stringify(config, null, 2), 'utf-8'),
        catch: error =>
          new StorageError({
            path,
            operation: 'write',
            cause: error,
            message: `Failed to save configuration to ${path}`,
          }),
      })
    })
  }

  /**
   * Get all configuration keys
   */
  keys(): Effect.Effect<IterableIterator<string>, never> {
    const store = this.configStore
    return Effect.gen(function* () {
      const map = yield* Ref.get(store)
      return map.keys()
    })
  }

  /**
   * Check if a key exists
   */
  has(key: string): Effect.Effect<boolean, never> {
    const store = this.configStore
    return Effect.gen(function* () {
      const map = yield* Ref.get(store)
      return map.has(key)
    })
  }

  /**
   * Delete a configuration key
   */
  delete(key: string): Effect.Effect<void, StorageError> {
    const store = this.configStore
    return Effect.gen(function* () {
      const map = yield* Ref.get(store)
      map.delete(key)
      yield* Ref.set(store, map)
    })
  }

  /**
   * Clear all configuration
   */
  clear(): Effect.Effect<void, never> {
    return Ref.set(this.configStore, new Map())
  }

  /**
   * Load configuration from standard locations with schema validation
   */
  loadConfig<T>(
    appName: string,
    schema: z.ZodSchema<T>,
    defaults: T
  ): Effect.Effect<T, StorageError> {
    return Effect.gen(function* (_) {
      const configPath = yield* _(
        Effect.sync(() => {
          const homeDir = process.env.HOME || process.env.USERPROFILE || '~'
          return path.join(homeDir, '.config', appName, 'config.json')
        })
      )

      // Try to load from file
      const fileExists = yield* _(
        Effect.tryPromise({
          try: () =>
            fs
              .access(configPath)
              .then(() => true)
              .catch(() => false),
          catch: () =>
            new StorageError({
              path: configPath,
              operation: 'read',
              message: 'Failed to check config file',
            }),
        })
      )

      if (!fileExists) {
        return defaults
      }

      const data = yield* _(
        Effect.tryPromise({
          try: () => fs.readFile(configPath, 'utf-8'),
          catch: error =>
            new StorageError({
              path: configPath,
              operation: 'read',
              cause: error,
              message: `Failed to read config from ${configPath}`,
            }),
        })
      )

      const parsed = yield* _(
        Effect.try({
          try: () => JSON.parse(data),
          catch: error =>
            new StorageError({
              path: configPath,
              operation: 'parse',
              cause: error,
              message: 'Failed to parse config JSON',
            }),
        })
      )

      // Validate with schema
      const validated = yield* _(
        Effect.try({
          try: () => schema.parse(parsed),
          catch: error =>
            new StorageError({
              path: configPath,
              operation: 'validate',
              cause: error,
              message: 'Config validation failed',
            }),
        })
      )

      return validated
    })
  }

  /**
   * Save configuration to user config directory
   */
  saveConfig<T>(
    appName: string,
    config: T,
    schema: z.ZodSchema<T>
  ): Effect.Effect<void, StorageError> {
    return Effect.gen(function* (_) {
      // Validate first
      const validated = yield* _(
        Effect.try({
          try: () => schema.parse(config),
          catch: error =>
            new StorageError({
              path: appName,
              operation: 'validate',
              cause: error,
              message: 'Config validation failed before save',
            }),
        })
      )

      const configPath = yield* _(
        Effect.sync(() => {
          const homeDir = process.env.HOME || process.env.USERPROFILE || '~'
          return path.join(homeDir, '.config', appName, 'config.json')
        })
      )

      const configDir = path.dirname(configPath)

      // Ensure directory exists
      yield* _(
        Effect.tryPromise({
          try: () => fs.mkdir(configDir, { recursive: true }),
          catch: error =>
            new StorageError({
              path: configDir,
              operation: 'write',
              cause: error,
              message: 'Failed to create config directory',
            }),
        })
      )

      // Write config
      yield* _(
        Effect.tryPromise({
          try: () => fs.writeFile(configPath, JSON.stringify(validated, null, 2), 'utf-8'),
          catch: error =>
            new StorageError({
              path: configPath,
              operation: 'write',
              cause: error,
              message: 'Failed to write config file',
            }),
        })
      )
    })
  }

  /**
   * Get the path to the user config file
   */
  getConfigPath(appName: string): Effect.Effect<string, StorageError> {
    return Effect.sync(() => {
      const homeDir = process.env.HOME || process.env.USERPROFILE || '~'
      return path.join(homeDir, '.config', appName, 'config.json')
    })
  }

  /**
   * Watch configuration file for changes.
   *
   * Returns an Effect-of-Effect matching the `StorageService` contract:
   * each time the inner effect is re-run it stats the file and, if the
   * mtime moved, loads the fresh validated config; otherwise it returns
   * the last value seen. Consumers poll by re-running the inner effect.
   */
  watchConfig<T>(
    appName: string,
    schema: z.ZodSchema<T>
  ): Effect.Effect<Effect.Effect<T, StorageError>, StorageError> {
    const self = this
    return Effect.gen(function* () {
      const configPath = yield* self.getConfigPath(appName)
      let lastMtime: number | null = null
      let lastValue: T = yield* self.loadConfig(appName, schema, {} as T)
      let seeded = false

      const readMtime = (): Promise<number | null> =>
        fs
          .stat(configPath)
          .then(stat => stat.mtimeMs)
          .catch(() => null)

      return Effect.gen(function* () {
        if (!seeded) {
          seeded = true
          lastMtime = yield* Effect.promise(readMtime)
          return lastValue
        }
        const mtime = yield* Effect.promise(readMtime)
        if (mtime === null) return lastValue
        if (lastMtime !== null && mtime === lastMtime) return lastValue
        lastMtime = mtime
        lastValue = yield* self.loadConfig(appName, schema, lastValue)
        return lastValue
      })
    })
  }
}
