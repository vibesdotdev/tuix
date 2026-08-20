import { test, expect, describe, beforeEach } from 'bun:test'
import { $state, $derived } from './runes'
import {
  memo,
  beginMemoFrame,
  endMemoFrame,
  resetMemoSlots,
  getMemoStats,
  isMemoActive,
} from './memo'

/** Run `fn` inside a fresh memo frame, resetting slot state between frames. */
function frame<T>(fn: () => T): T {
  beginMemoFrame()
  try {
    return fn()
  } finally {
    endMemoFrame()
  }
}

describe('memo', () => {
  beforeEach(() => {
    resetMemoSlots()
  })

  test('caches the result across frames while no dependency changes', () => {
    const count = $state(1)
    let calls = 0
    const run = () =>
      frame(() =>
        memo(() => {
          calls++
          return count() * 10
        })
      )

    expect(run()).toBe(10)
    expect(run()).toBe(10)
    // Second frame hit the cache — no re-execution.
    expect(calls).toBe(1)
  })

  test('re-executes when a tracked $state dependency changes', () => {
    const count = $state(1)
    let calls = 0
    const run = () =>
      frame(() =>
        memo(() => {
          calls++
          return count() * 10
        })
      )

    expect(run()).toBe(10)
    expect(calls).toBe(1)

    count.$set(2)
    expect(run()).toBe(20)
    expect(calls).toBe(2)

    // Stable again — cached.
    expect(run()).toBe(20)
    expect(calls).toBe(2)
  })

  test('cache hit skips execution even when the underlying value changed via $update', () => {
    const count = $state(5)
    let calls = 0
    const run = () =>
      frame(() =>
        memo(() => {
          calls++
          return count()
        })
      )

    expect(run()).toBe(5)
    // A change not delivered through $state (raw closure) isn't tracked, but
    // $update DOES fire listeners, so the cache must invalidate.
    count.$update(v => v + 1)
    expect(run()).toBe(6)
    expect(calls).toBe(2)
  })

  test('a dependency that fires marks the slot dirty once', () => {
    const a = $state(1)
    const b = $state(10)
    let calls = 0
    const run = () =>
      frame(() =>
        memo(() => {
          calls++
          return a() + b()
        })
      )

    expect(run()).toBe(11)
    expect(calls).toBe(1)

    // Touch only one dependency many times; still exactly one recompute per frame.
    a.$set(2)
    a.$set(3)
    expect(run()).toBe(13)
    expect(calls).toBe(2)
  })

  test('unrelated $state changes do not invalidate the memo', () => {
    const dep = $state(1)
    const unrelated = $state(99)
    let calls = 0
    const run = () =>
      frame(() =>
        memo(() => {
          calls++
          return dep()
        })
      )

    expect(run()).toBe(1)
    expect(calls).toBe(1)

    unrelated.$set(100)
    expect(run()).toBe(1)
    expect(calls).toBe(1)
  })

  test('tracks dependencies of $derived runes read inside the memo', () => {
    const count = $state(1)
    const doubled = $derived(() => count() * 2)
    let calls = 0
    const run = () =>
      frame(() =>
        memo(() => {
          calls++
          return doubled()
        })
      )

    expect(run()).toBe(2)
    expect(calls).toBe(1)

    count.$set(3)
    expect(run()).toBe(6)
    expect(calls).toBe(2)
  })

  test('reuses slots positionally across frames (component structure order)', () => {
    const count = $state(1)
    const other = $state(50)
    let firstCalls = 0
    let secondCalls = 0

    const run = () =>
      frame(() => {
        const a = memo(() => {
          firstCalls++
          return count()
        })
        const b = memo(() => {
          secondCalls++
          return other()
        })
        return [a, b] as const
      })

    const [a1, b1] = run()
    expect(a1).toBe(1)
    expect(b1).toBe(50)
    expect(firstCalls).toBe(1)
    expect(secondCalls).toBe(1)

    // No changes — both cached on their reused slots.
    const [a2, b2] = run()
    expect(a2).toBe(1)
    expect(b2).toBe(50)
    expect(firstCalls).toBe(1)
    expect(secondCalls).toBe(1)

    // Change the FIRST memo's dependency only.
    count.$set(2)
    const [a3, b3] = run()
    expect(a3).toBe(2)
    expect(b3).toBe(50)
    expect(firstCalls).toBe(2)
    expect(secondCalls).toBe(1)
  })

  test('trims and unsubscribes removed slots (component removed)', () => {
    const count = $state(1)
    let calls = 0

    // First frame registers two memo slots.
    beginMemoFrame()
    memo(() => {
      calls++
      return count()
    })
    memo(() => {
      calls++
      return count()
    })
    endMemoFrame()
    expect(calls).toBe(2)
    expect(getMemoStats().totalSlots).toBe(2)

    // Second frame drops the second memo entirely. The surviving first memo
    // reuses slot 0 (cached, count unchanged — no re-run), and endMemoFrame
    // trims the orphaned slot.
    beginMemoFrame()
    memo(() => {
      calls++
      return count()
    })
    endMemoFrame()
    expect(calls).toBe(2)
    expect(getMemoStats().totalSlots).toBe(1)

    // The trimmed slot's subscription was released: changing count now
    // re-runs only the single surviving memo exactly once.
    count.$set(5)
    beginMemoFrame()
    memo(() => {
      calls++
      return count()
    })
    endMemoFrame()
    expect(calls).toBe(3)
    expect(getMemoStats().totalSlots).toBe(1)
  })

  test('unsubscribes dependencies when a memo re-executes with new deps', () => {
    const a = $state(1)
    const b = $state(100)
    const trigger = $state(0)
    let calls = 0
    let useB = true
    const run = () =>
      frame(() =>
        memo(() => {
          calls++
          trigger() // tracked dep lets us force a re-execution on demand
          return useB ? b() : a()
        })
      )

    expect(run()).toBe(100)
    expect(calls).toBe(1)

    // Re-execute while switching the chosen dependency (a plain `useB` flip
    // fires no tracked dep — memo cannot observe it; force via trigger).
    useB = false
    trigger.$set(1)
    expect(run()).toBe(1)
    expect(calls).toBe(2)

    // b is no longer subscribed (its subscription was torn down on the
    // re-execute that switched deps) — changing it does not invalidate.
    b.$set(200)
    expect(run()).toBe(1)
    expect(calls).toBe(2)

    // a is now the active dependency.
    a.$set(2)
    expect(run()).toBe(2)
    expect(calls).toBe(3)
  })

  test('returns a fresh value and does not track when outside a memo frame', () => {
    const count = $state(1)
    let calls = 0
    const helper = () =>
      memo(() => {
        calls++
        return count()
      })

    // No beginMemoFrame — memo() delegates straight to fn().
    expect(helper()).toBe(1)
    expect(helper()).toBe(1)
    expect(calls).toBe(2)
  })

  test('resetMemoSlots releases all subscriptions and clears stats', () => {
    const count = $state(1)
    const run = () =>
      frame(() =>
        memo(() => {
          return count()
        })
      )

    run()
    expect(getMemoStats().totalSlots).toBe(1)
    resetMemoSlots()
    expect(getMemoStats().totalSlots).toBe(0)
    expect(isMemoActive()).toBe(false)
    // After reset the slot is gone — re-executes fresh.
    expect(run()).toBe(1)
  })

  test('getMemoStats reports dirty/clean slots correctly', () => {
    const count = $state(1)
    beginMemoFrame()
    memo(() => count())
    memo(() => count() * 2)
    endMemoFrame()
    expect(getMemoStats()).toEqual({ totalSlots: 2, dirtySlots: 0, cleanSlots: 2 })

    count.$set(9)
    // Both slots see the dirty flag (already initialized, but not re-run).
    const stats = getMemoStats()
    expect(stats.dirtySlots).toBe(2)
    expect(stats.cleanSlots).toBe(0)
  })
})
