/**
 * Storage Config Adapter Tests
 */

import { test, expect, describe } from 'bun:test'
import { Effect, Layer } from 'effect'
import { StorageConfigAdapter, makeStorageConfig } from './adapter'
import { MemoryStorage, StorageService } from '@tuix/storage'

describe('StorageConfigAdapter', () => {
  test('get() retrieves value from storage', async () => {
    const storage = new MemoryStorage()
    const config = new StorageConfigAdapter(storage, 'config')

    // Set a value directly in storage
    await Effect.runPromise(storage.set('config.server.port', 3000))

    // Get via config adapter
    const port = await Effect.runPromise(config.get<number>('server.port'))

    expect(port).toBe(3000)
  })

  test('get() returns default value when key not found', async () => {
    const storage = new MemoryStorage()
    const config = new StorageConfigAdapter(storage, 'config')

    const port = await Effect.runPromise(config.get('server.port', 8080))

    expect(port).toBe(8080)
  })

  test('set() stores value in storage', async () => {
    const storage = new MemoryStorage()
    const config = new StorageConfigAdapter(storage, 'config')

    await Effect.runPromise(config.set('app.name', 'myapp'))

    const value = await Effect.runPromise(storage.get('config.app.name'))
    expect(value).toBe('myapp')
  })

  test('getAll() retrieves all config values', async () => {
    const storage = new MemoryStorage()
    const config = new StorageConfigAdapter(storage, 'config')

    await Effect.runPromise(config.set('server.port', 3000))
    await Effect.runPromise(config.set('server.host', 'localhost'))
    await Effect.runPromise(config.set('app.name', 'myapp'))

    const all = await Effect.runPromise(config.getAll())

    expect(all).toEqual({
      'server.port': 3000,
      'server.host': 'localhost',
      'app.name': 'myapp',
    })
  })

  test('has() checks if key exists', async () => {
    const storage = new MemoryStorage()
    const config = new StorageConfigAdapter(storage, 'config')

    await Effect.runPromise(config.set('server.port', 3000))

    const exists = await Effect.runPromise(config.has('server.port'))
    const notExists = await Effect.runPromise(config.has('server.host'))

    expect(exists).toBe(true)
    expect(notExists).toBe(false)
  })

  test('custom prefix works correctly', async () => {
    const storage = new MemoryStorage()
    const config = new StorageConfigAdapter(storage, 'myapp')

    await Effect.runPromise(config.set('port', 3000))

    const value = await Effect.runPromise(storage.get('myapp.port'))
    expect(value).toBe(3000)
  })
})

describe('makeStorageConfig', () => {
  test('creates config from Storage service', async () => {
    const storage = new MemoryStorage()
    const StorageLayer = Layer.succeed(StorageService, storage)

    const program = Effect.gen(function* (_) {
      const config = yield* _(makeStorageConfig('test'))
      yield* _(config.set('key', 'value'))
      const value = yield* _(config.get('key'))
      return value
    })

    const result = await Effect.runPromise(program.pipe(Effect.provide(StorageLayer)))

    expect(result).toBe('value')
  })
})
