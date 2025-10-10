/**
 * Tests for in-memory storage implementation
 */

import { test, expect, describe, beforeEach } from 'bun:test'
import { Effect } from 'effect'
import { MemoryStorage } from './memory.ts'

describe('MemoryStorage', () => {
  let storage: MemoryStorage

  beforeEach(() => {
    storage = new MemoryStorage()
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

    test('has returns false for expired entries', async () => {
      await Effect.runPromise(storage.set('key1', 'value1', { ttl: 50 }))

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100))

      const exists = await Effect.runPromise(storage.has('key1'))
      expect(exists).toBe(false)
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

    test('entries returns all entries', async () => {
      await Effect.runPromise(storage.set('key1', 'value1'))
      await Effect.runPromise(storage.set('key2', 'value2'))

      const entries = await Effect.runPromise(storage.entries())
      expect(entries.length).toBe(2)
      expect(entries.map(e => e.key).sort()).toEqual(['key1', 'key2'])
    })

    test('entries with prefix filters correctly', async () => {
      await Effect.runPromise(storage.set('user:1', 'alice'))
      await Effect.runPromise(storage.set('user:2', 'bob'))
      await Effect.runPromise(storage.set('config:theme', 'dark'))

      const entries = await Effect.runPromise(storage.entries('user:'))
      expect(entries.length).toBe(2)
      expect(entries.map(e => e.key).sort()).toEqual(['user:1', 'user:2'])
    })

    test('keys excludes expired entries', async () => {
      await Effect.runPromise(storage.set('key1', 'value1', { ttl: 50 }))
      await Effect.runPromise(storage.set('key2', 'value2'))

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100))

      const keys = await Effect.runPromise(storage.keys())
      expect(keys).toEqual(['key2'])
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

  describe('data types', () => {
    test('stores and retrieves strings', async () => {
      await Effect.runPromise(storage.set('key', 'value'))
      const result = await Effect.runPromise(storage.get<string>('key'))
      expect(result).toBe('value')
    })

    test('stores and retrieves numbers', async () => {
      await Effect.runPromise(storage.set('key', 42))
      const result = await Effect.runPromise(storage.get<number>('key'))
      expect(result).toBe(42)
    })

    test('stores and retrieves objects', async () => {
      const obj = { name: 'Alice', age: 30 }
      await Effect.runPromise(storage.set('key', obj))
      const result = await Effect.runPromise(storage.get<typeof obj>('key'))
      expect(result).toEqual(obj)
    })

    test('stores and retrieves arrays', async () => {
      const arr = [1, 2, 3, 4, 5]
      await Effect.runPromise(storage.set('key', arr))
      const result = await Effect.runPromise(storage.get<number[]>('key'))
      expect(result).toEqual(arr)
    })
  })
})
