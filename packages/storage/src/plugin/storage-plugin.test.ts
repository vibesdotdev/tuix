import { test, expect, describe, beforeEach } from 'bun:test'
import {
  useStorage,
  provideStorage,
  createStorageContext,
  __resetStoragePluginForTests,
} from './index.tsx'
import { MemoryStorage } from '../memory.ts'
import { Effect } from 'effect'

describe('useStorage', () => {
  beforeEach(() => {
    __resetStoragePluginForTests()
  })

  test('works with default memory backend without wrapper', async () => {
    const storage = useStorage()
    await storage.set('k', { n: 1 })
    expect(await storage.get('k')).toEqual({ n: 1 })
    expect(await storage.has('k')).toBe(true)
    expect(await storage.keys()).toContain('k')
    await storage.delete('k')
    expect(await storage.get('k')).toBeNull()
  })

  test('provideStorage overrides default for scope', async () => {
    const mem = new MemoryStorage()
    const release = provideStorage(mem)
    const storage = useStorage()
    await storage.set('scoped', 'yes')
    const direct = await Effect.runPromise(mem.get('scoped'))
    expect(direct).toBe('yes')
    release()
  })

  test('createStorageContext mirrors Storage API', async () => {
    const ctx = createStorageContext(new MemoryStorage())
    await ctx.set('a', 1)
    expect(await ctx.get('a')).toBe(1)
    await ctx.clear()
    expect(await ctx.keys()).toEqual([])
  })
})
