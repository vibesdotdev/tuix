import { describe, expect, it, beforeEach } from 'bun:test'
import { Effect, Ref } from 'effect'
import { z } from 'zod'
import { ConfigStorage } from './config'

async function run<A, E>(effect: Effect.Effect<A, E>): Promise<A> {
  return Effect.runPromise(effect)
}

describe('ConfigStorage', () => {
  let store: ConfigStorage
  let ref: Ref.Ref<Map<string, unknown>>

  beforeEach(() => {
    ref = Ref.unsafeMake(new Map<string, unknown>())
    store = new ConfigStorage(ref)
  })

  it('get returns null for missing keys', async () => {
    expect(await run(store.get('missing'))).toBeNull()
  })

  it('set then get round-trips a value', async () => {
    await run(store.set('theme', 'nord'))
    expect(await run(store.get<string>('theme'))).toBe('nord')
  })

  it('has reflects membership', async () => {
    expect(await run(store.has('port'))).toBe(false)
    await run(store.set('port', 8080))
    expect(await run(store.has('port'))).toBe(true)
  })

  it('delete removes exactly one key', async () => {
    await run(store.set('a', 1))
    await run(store.set('b', 2))
    await run(store.delete('a'))
    expect(await run(store.has('a'))).toBe(false)
    expect(await run(store.get<number>('b'))).toBe(2)
  })

  it('keys lists stored keys', async () => {
    await run(store.set('x', 1))
    await run(store.set('y', 2))
    const keys = await run(store.keys())
    expect(Array.from(keys).sort()).toEqual(['x', 'y'])
  })

  it('clear empties the store', async () => {
    await run(store.set('x', 1))
    await run(store.clear())
    expect(await run(store.has('x'))).toBe(false)
  })

  it('loadFromFile populates the store; saveToFile writes it back', async () => {
    const path = `/tmp/tuix-config-test-${Date.now()}.json`
    await Bun.write(path, JSON.stringify({ alpha: 1, beta: 'two' }))

    await run(store.loadFromFile(path))
    expect(await run(store.get<number>('alpha'))).toBe(1)
    expect(await run(store.get<string>('beta'))).toBe('two')

    await run(store.set('gamma', true))
    await run(store.saveToFile(path))

    const reloaded: Record<string, unknown> = await Bun.file(path).json()
    expect(reloaded.alpha).toBe(1)
    expect(reloaded.gamma).toBe(true)
  })

  it('loadFromFile fails with StorageError on bad JSON', async () => {
    const path = `/tmp/tuix-config-bad-${Date.now()}.json`
    await Bun.write(path, '{not json')
    const result = await Effect.runPromise(
      store.loadFromFile(path).pipe(Effect.match({ onFailure: e => e, onSuccess: () => null }))
    )
    expect(result).not.toBeNull()
    expect((result as { _tag?: string })._tag).toBe('StorageError')
  })

  it('watchConfig inner effect re-reads when the file changes', async () => {
    const schema = z.object({ v: z.number() })
    const appName = `tuix-watch-test-${Date.now()}`
    const dir = `${process.env.HOME}/.config/${appName}`
    const file = `${dir}/config.json`
    await Bun.write(file, JSON.stringify({ v: 1 }))

    try {
      const inner = await run(store.watchConfig(appName, schema))
      const first = await run(inner as Effect.Effect<{ v: number }, unknown>)
      expect(first.v).toBe(1)

      // Same mtime window: no change yet.
      const again = await run(inner as Effect.Effect<{ v: number }, unknown>)
      expect(again.v).toBe(1)

      // Bump mtime and value.
      await new Promise(resolve => setTimeout(resolve, 10))
      await Bun.write(file, JSON.stringify({ v: 2 }))
      await new Promise(resolve => setTimeout(resolve, 10))

      const third = await run(inner as Effect.Effect<{ v: number }, unknown>)
      expect(third.v).toBe(2)
    } finally {
      await Bun.$`rm -rf ${dir}`.quiet()
    }
  })
})
