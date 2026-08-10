/**
 * Storage Watch Tests
 */

import { test, expect, describe, beforeEach } from 'bun:test'
import { Effect } from 'effect'
import { MemoryStorage } from './memory'
import { FilesystemStorage } from './filesystem'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

describe('MemoryStorage Watch', () => {
  let storage: MemoryStorage

  beforeEach(() => {
    storage = new MemoryStorage()
  })

  test('notifies watchers when value changes', async () => {
    const updates: any[] = []

    // Set up watch
    const unsubscribe = await Effect.runPromise(
      storage.watch('test-key', value => {
        updates.push(value)
      })
    )

    // Set value
    await Effect.runPromise(storage.set('test-key', 'value1'))

    // Wait a tick for callback
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(updates).toHaveLength(1)
    expect(updates[0]).toBe('value1')

    // Update value
    await Effect.runPromise(storage.set('test-key', 'value2'))
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(updates).toHaveLength(2)
    expect(updates[1]).toBe('value2')

    unsubscribe()
  })

  test('notifies watchers on delete', async () => {
    const updates: any[] = []

    await Effect.runPromise(storage.set('test-key', 'initial'))

    const unsubscribe = await Effect.runPromise(
      storage.watch('test-key', value => {
        updates.push(value)
      })
    )

    await Effect.runPromise(storage.delete('test-key'))
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(updates).toHaveLength(1)
    expect(updates[0]).toBe(null)

    unsubscribe()
  })

  test('supports multiple watchers on same key', async () => {
    const updates1: any[] = []
    const updates2: any[] = []

    const unsubscribe1 = await Effect.runPromise(
      storage.watch('test-key', value => updates1.push(value))
    )

    const unsubscribe2 = await Effect.runPromise(
      storage.watch('test-key', value => updates2.push(value))
    )

    await Effect.runPromise(storage.set('test-key', 'shared'))
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(updates1).toHaveLength(1)
    expect(updates2).toHaveLength(1)
    expect(updates1[0]).toBe('shared')
    expect(updates2[0]).toBe('shared')

    unsubscribe1()
    unsubscribe2()
  })

  test('unsubscribe stops receiving updates', async () => {
    const updates: any[] = []

    const unsubscribe = await Effect.runPromise(
      storage.watch('test-key', value => updates.push(value))
    )

    await Effect.runPromise(storage.set('test-key', 'value1'))
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(updates).toHaveLength(1)

    // Unsubscribe
    unsubscribe()

    // Set again
    await Effect.runPromise(storage.set('test-key', 'value2'))
    await new Promise(resolve => setTimeout(resolve, 10))

    // Should not have received second update
    expect(updates).toHaveLength(1)
  })

  test('watchers are isolated by key', async () => {
    const updates1: any[] = []
    const updates2: any[] = []

    const unsubscribe1 = await Effect.runPromise(
      storage.watch('key1', value => updates1.push(value))
    )

    const unsubscribe2 = await Effect.runPromise(
      storage.watch('key2', value => updates2.push(value))
    )

    await Effect.runPromise(storage.set('key1', 'value1'))
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(updates1).toHaveLength(1)
    expect(updates2).toHaveLength(0)

    await Effect.runPromise(storage.set('key2', 'value2'))
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(updates1).toHaveLength(1)
    expect(updates2).toHaveLength(1)

    unsubscribe1()
    unsubscribe2()
  })

  test('notifies on expiration during cleanup', async () => {
    const updates: any[] = []

    await Effect.runPromise(storage.set('test-key', 'expiring', { ttl: 50 }))

    const unsubscribe = await Effect.runPromise(
      storage.watch('test-key', value => updates.push(value))
    )

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 100))

    // Trigger cleanup
    await Effect.runPromise(storage.cleanup())
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(updates).toHaveLength(1)
    expect(updates[0]).toBe(null)

    unsubscribe()
  })
})

describe('FilesystemStorage Watch', () => {
  let storage: FilesystemStorage
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'tuix-storage-test-'))
    storage = new FilesystemStorage(tempDir)
  })

  test('notifies watchers when value changes', async () => {
    const updates: any[] = []

    const unsubscribe = await Effect.runPromise(
      storage.watch('test-key', value => {
        updates.push(value)
      })
    )

    await Effect.runPromise(storage.set('test-key', 'value1'))
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(updates).toHaveLength(1)
    expect(updates[0]).toBe('value1')

    await Effect.runPromise(storage.set('test-key', 'value2'))
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(updates).toHaveLength(2)
    expect(updates[1]).toBe('value2')

    unsubscribe()
  })

  test('notifies watchers on delete', async () => {
    const updates: any[] = []

    await Effect.runPromise(storage.set('test-key', 'initial'))

    const unsubscribe = await Effect.runPromise(
      storage.watch('test-key', value => {
        updates.push(value)
      })
    )

    await Effect.runPromise(storage.delete('test-key'))
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(updates).toHaveLength(1)
    expect(updates[0]).toBe(null)

    unsubscribe()
  })

  test('supports multiple watchers on same key', async () => {
    const updates1: any[] = []
    const updates2: any[] = []

    const unsubscribe1 = await Effect.runPromise(
      storage.watch('test-key', value => updates1.push(value))
    )

    const unsubscribe2 = await Effect.runPromise(
      storage.watch('test-key', value => updates2.push(value))
    )

    await Effect.runPromise(storage.set('test-key', 'shared'))
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(updates1).toHaveLength(1)
    expect(updates2).toHaveLength(1)
    expect(updates1[0]).toBe('shared')
    expect(updates2[0]).toBe('shared')

    unsubscribe1()
    unsubscribe2()
  })
})

describe('Config Adapter Watch', () => {
  test('watch integration with config adapter', async () => {
    const { StorageConfigAdapter } = await import('../../config/src/storage/adapter')
    const storage = new MemoryStorage()
    const config = new StorageConfigAdapter(storage, 'test')

    const updates: any[] = []

    const unsubscribe = await Effect.runPromise(
      config.watch('setting', value => {
        updates.push(value)
      })
    )

    await Effect.runPromise(config.set('setting', 'value1'))
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(updates).toHaveLength(1)
    expect(updates[0]).toBe('value1')

    await Effect.runPromise(config.set('setting', 'value2'))
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(updates).toHaveLength(2)
    expect(updates[1]).toBe('value2')

    unsubscribe()
  })
})
