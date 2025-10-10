/**
 * Tests for filesystem storage implementation
 */

import { test, expect, describe, beforeEach, afterEach } from 'bun:test'
import { Effect } from 'effect'
import { FilesystemStorage } from './filesystem.ts'

describe('FilesystemStorage', () => {
  const testDir = '/tmp/tuix-storage-test'
  let storage: FilesystemStorage

  beforeEach(() => {
    storage = new FilesystemStorage(testDir)
  })

  afterEach(async () => {
    // Clean up test directory
    await Effect.runPromise(storage.clear())
  })

  describe('basic operations', () => {
    test('get returns null for non-existent key', async () => {
      const result = await Effect.runPromise(storage.get('nonexistent'))
      expect(result).toBeNull()
    })

    test('set and get work correctly', async () => {
      await Effect.runPromise(storage.set('key1', 'value1'))
      const result = await Effect.runPromise(storage.get('key1'))
      expect(result).toBe('value1')
    })

    test('set overwrites existing value', async () => {
      await Effect.runPromise(storage.set('key1', 'value1'))
      await Effect.runPromise(storage.set('key1', 'value2'))
      const result = await Effect.runPromise(storage.get('key1'))
      expect(result).toBe('value2')
    })

    test('delete removes key', async () => {
      await Effect.runPromise(storage.set('key1', 'value1'))
      const deleted = await Effect.runPromise(storage.delete('key1'))
      expect(deleted).toBe(true)
      const result = await Effect.runPromise(storage.get('key1'))
      expect(result).toBeNull()
    })

    test('delete returns false for non-existent key', async () => {
      const deleted = await Effect.runPromise(storage.delete('nonexistent'))
      expect(deleted).toBe(false)
    })

    test('has returns true for existing key', async () => {
      await Effect.runPromise(storage.set('key1', 'value1'))
      const exists = await Effect.runPromise(storage.has('key1'))
      expect(exists).toBe(true)
    })

    test('has returns false for non-existent key', async () => {
      const exists = await Effect.runPromise(storage.has('nonexistent'))
      expect(exists).toBe(false)
    })
  })

  describe('TTL support', () => {
    test('expired entries return null', async () => {
      await Effect.runPromise(storage.set('key1', 'value1', { ttl: 50 }))

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100))

      const result = await Effect.runPromise(storage.get('key1'))
      expect(result).toBeNull()
    })

    test('non-expired entries return value', async () => {
      await Effect.runPromise(storage.set('key1', 'value1', { ttl: 1000 }))
      const result = await Effect.runPromise(storage.get('key1'))
      expect(result).toBe('value1')
    })

    test('cleanup removes expired entries', async () => {
      await Effect.runPromise(storage.set('key1', 'value1', { ttl: 50 }))
      await Effect.runPromise(storage.set('key2', 'value2'))

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100))

      const count = await Effect.runPromise(storage.cleanup())
      expect(count).toBe(1)

      const keys = await Effect.runPromise(storage.keys())
      expect(keys).toEqual(['key2'])
    })
  })

  describe('persistence', () => {
    test('data persists across instances', async () => {
      await Effect.runPromise(storage.set('key1', 'value1'))

      // Create new instance
      const newStorage = new FilesystemStorage(testDir)
      const result = await Effect.runPromise(newStorage.get('key1'))

      expect(result).toBe('value1')
    })

    test('handles special characters in keys', async () => {
      const specialKey = 'user:alice@example.com'
      await Effect.runPromise(storage.set(specialKey, 'data'))
      const result = await Effect.runPromise(storage.get(specialKey))
      expect(result).toBe('data')
    })
  })

  describe('listing operations', () => {
    test('keys returns all keys', async () => {
      await Effect.runPromise(storage.set('key1', 'value1'))
      await Effect.runPromise(storage.set('key2', 'value2'))
      await Effect.runPromise(storage.set('key3', 'value3'))

      const keys = await Effect.runPromise(storage.keys())
      expect(keys.sort()).toEqual(['key1', 'key2', 'key3'])
    })

    test('keys with prefix filters correctly', async () => {
      await Effect.runPromise(storage.set('user:1', 'alice'))
      await Effect.runPromise(storage.set('user:2', 'bob'))
      await Effect.runPromise(storage.set('config:theme', 'dark'))

      const keys = await Effect.runPromise(storage.keys('user:'))
      expect(keys.sort()).toEqual(['user:1', 'user:2'])
    })
  })

  describe('clear operations', () => {
    test('clear removes all keys', async () => {
      await Effect.runPromise(storage.set('key1', 'value1'))
      await Effect.runPromise(storage.set('key2', 'value2'))

      await Effect.runPromise(storage.clear())

      const keys = await Effect.runPromise(storage.keys())
      expect(keys).toEqual([])
    })

    test('clear with prefix removes only matching keys', async () => {
      await Effect.runPromise(storage.set('user:1', 'alice'))
      await Effect.runPromise(storage.set('user:2', 'bob'))
      await Effect.runPromise(storage.set('config:theme', 'dark'))

      await Effect.runPromise(storage.clear('user:'))

      const keys = await Effect.runPromise(storage.keys())
      expect(keys).toEqual(['config:theme'])
    })
  })
})
