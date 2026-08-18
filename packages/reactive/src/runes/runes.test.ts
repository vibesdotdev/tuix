import { test, expect, describe } from 'bun:test'
import { $state, $derived, $bindable, isBindableRune } from './runes'
import { untrack, tick, initComponent } from './jsx-lifecycle'

describe('tick', () => {
  test('resolves after pending updates flush (real promise, not an Effect)', async () => {
    let resolved = false
    const p = tick().then(() => {
      resolved = true
    })
    expect(resolved).toBe(false)
    await p
    expect(resolved).toBe(true)
  })

  test('coalesces concurrent tick() calls into one flush', async () => {
    initComponent()
    await Promise.all([tick(), tick(), tick()])
  })
})

describe('$state', () => {
  test('get/set/update', () => {
    const n = $state(1)
    expect(n()).toBe(1)
    n.$set(2)
    expect(n()).toBe(2)
    n.$update(x => x + 1)
    expect(n()).toBe(3)
  })
})

describe('$derived', () => {
  test('recomputes when dependency changes', () => {
    const count = $state(1)
    const doubled = $derived(() => count() * 2)
    expect(doubled()).toBe(2)
    count.$set(5)
    expect(doubled()).toBe(10)
  })

  test('caches until dependency invalidates', () => {
    let calls = 0
    const a = $state(1)
    const d = $derived(() => {
      calls++
      return a()
    })
    expect(d()).toBe(1)
    expect(d()).toBe(1)
    expect(calls).toBe(1)
    a.$set(2)
    expect(d()).toBe(2)
    expect(calls).toBe(2)
  })

  test('nested derivations recompute when the inner dependency changes', () => {
    const inner = $state(2)
    const mid = $derived(() => inner() * 10)
    const outer = $derived(() => mid() + 2)
    expect(outer()).toBe(22)
    inner.$set(10)
    expect(mid()).toBe(100)
    expect(outer()).toBe(102)
  })

  test('derived runes are subscribable', () => {
    const count = $state(1)
    const doubled = $derived(() => count() * 2)
    const seen: number[] = []
    const stop = doubled.$subscribe(v => seen.push(v))
    expect(seen).toEqual([2])
    count.$set(3)
    expect(seen).toEqual([2, 6])
    stop()
    count.$set(4)
    expect(seen).toEqual([2, 6])
  })
})

describe('untrack', () => {
  test('reads inside untrack do not become derived deps', () => {
    const a = $state(1)
    const b = $state(10)
    let calls = 0
    const d = $derived(() => {
      calls++
      const ignored = untrack(() => b())
      return a() + ignored
    })
    expect(d()).toBe(11)
    expect(calls).toBe(1)
    b.$set(20)
    // b change should not invalidate
    expect(d()).toBe(11)
    expect(calls).toBe(1)
    a.$set(2)
    expect(d()).toBe(22)
    expect(calls).toBe(2)
  })
})

describe('$bindable', () => {
  test('exported and works', () => {
    const b = $bindable('x')
    expect(isBindableRune(b)).toBe(true)
    expect(b()).toBe('x')
    b.$set('y')
    expect(b()).toBe('y')
  })
})
