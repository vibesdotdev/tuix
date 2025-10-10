/**
 * Storage Adapter for Config
 *
 * Adapts @tuix/storage to provide configuration management
 */

import { Effect, Context } from 'effect'
import { StorageService, StorageError } from '@tuix/storage'
import type { Config, ConfigError } from '../types'

// Type alias for convenience
type Storage = typeof StorageService.Type

/**
 * Config implementation backed by Storage
 */
export class StorageConfigAdapter implements Config {
  constructor(
    private storage: Storage,
    private prefix: string = 'config'
  ) {}

  get<T>(key: string, defaultValue?: T): Effect.Effect<T, ConfigError> {
    const storageKey = `${this.prefix}.${key}`

    return this.storage.get<T>(storageKey).pipe(
      Effect.map(value => value ?? defaultValue),
      Effect.catchAll(error => {
        if (defaultValue !== undefined) {
          return Effect.succeed(defaultValue)
        }
        return Effect.fail({
          _tag: 'ConfigError' as const,
          message: `Config key not found: ${key}`,
          cause: error,
        })
      })
    ) as Effect.Effect<T, ConfigError>
  }

  getAll(): Effect.Effect<Record<string, any>, ConfigError> {
    return this.storage.keys(`${this.prefix}.`).pipe(
      Effect.flatMap(keys =>
        Effect.all(
          keys.map(key =>
            this.storage.get(key).pipe(
              Effect.map(value => [key.replace(`${this.prefix}.`, ''), value] as const)
            )
          )
        )
      ),
      Effect.map(entries => Object.fromEntries(entries)),
      Effect.catchAll(error =>
        Effect.fail({
          _tag: 'ConfigError' as const,
          message: 'Failed to get all config values',
          cause: error,
        })
      )
    )
  }

  set(key: string, value: any): Effect.Effect<void, ConfigError> {
    const storageKey = `${this.prefix}.${key}`

    return this.storage.set(storageKey, value).pipe(
      Effect.catchAll(error =>
        Effect.fail({
          _tag: 'ConfigError' as const,
          message: `Failed to set config key: ${key}`,
          cause: error,
        })
      )
    )
  }

  has(key: string): Effect.Effect<boolean> {
    const storageKey = `${this.prefix}.${key}`
    return this.storage.has(storageKey)
  }

  watch(
    key: string,
    callback: (value: any) => void
  ): Effect.Effect<() => void, ConfigError> {
    const storageKey = `${this.prefix}.${key}`

    return this.storage.watch(storageKey, callback).pipe(
      Effect.catchAll(error =>
        Effect.fail({
          _tag: 'ConfigError' as const,
          message: `Failed to watch config key: ${key}`,
          cause: error,
        })
      )
    ) as Effect.Effect<() => void, ConfigError>
  }

  reload(): Effect.Effect<void, ConfigError> {
    // Storage handles persistence automatically
    return Effect.succeed(undefined)
  }
}

/**
 * Create a Config service backed by Storage
 */
export const makeStorageConfig = (prefix = 'config') =>
  Effect.gen(function* (_) {
    const storage = yield* _(StorageService)
    return new StorageConfigAdapter(storage, prefix)
  })

/**
 * Config Layer backed by Storage
 */
export const StorageConfigLayer = (prefix = 'config') =>
  Effect.succeed(Config, makeStorageConfig(prefix)).pipe(
    Effect.flatMap(config => config),
    Effect.toLayer(Config)
  )
