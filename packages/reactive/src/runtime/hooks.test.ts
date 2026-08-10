/**
 * Tests for Reactive Runtime Hooks Integration
 */

import { test, expect, describe, beforeEach } from 'bun:test'
import { Effect } from 'effect'
import {
  ReactiveContext,
  createReactiveHooks,
  createDefaultReactiveHooks,
  getGlobalReactiveContext,
  $runtimeEffect,
} from './hooks'

describe('ReactiveContext', () => {
  let context: ReactiveContext<{ count: number }, any>

  beforeEach(() => {
    context = new ReactiveContext()
  })

  describe('initFromModel', () => {
    test('initializes reactive state from model', () => {
      context.initFromModel({ count: 0 })
      const state = context.getState()
      expect(state).toEqual({ count: 0 })
    })
  })

  describe('getState', () => {
    test('returns null before initialization', () => {
      expect(context.getState()).toBeNull()
    })

    test('returns current state after initialization', () => {
      context.initFromModel({ count: 5 })
      expect(context.getState()).toEqual({ count: 5 })
    })
  })

  describe('syncFromModel', () => {
    test('updates reactive state from model', () => {
      context.initFromModel({ count: 0 })
      context.syncFromModel({ count: 10 })
      expect(context.getState()).toEqual({ count: 10 })
    })

    test('does nothing if not initialized', () => {
      // Should not throw
      context.syncFromModel({ count: 5 })
      expect(context.getState()).toBeNull()
    })
  })

  describe('registerEffect and runEffects', () => {
    test('runs registered effects', () => {
      const callLog: string[] = []

      context.registerEffect(() => {
        callLog.push('effect1')
      })

      context.registerEffect(() => {
        callLog.push('effect2')
      })

      context.runEffects()

      expect(callLog).toEqual(['effect1', 'effect2'])
    })

    test('collects cleanup functions', () => {
      const callLog: string[] = []

      context.registerEffect(() => {
        callLog.push('effect1')
        return () => callLog.push('cleanup1')
      })

      context.registerEffect(() => {
        callLog.push('effect2')
        return () => callLog.push('cleanup2')
      })

      context.runEffects()
      expect(callLog).toEqual(['effect1', 'effect2'])

      callLog.length = 0
      context.runEffects()
      // Previous cleanups should run, then new effects
      expect(callLog).toEqual(['cleanup1', 'cleanup2'])
    })

    test('clears pending effects after running', () => {
      const callLog: string[] = []

      context.registerEffect(() => {
        callLog.push('effect')
      })

      context.runEffects()
      expect(callLog).toEqual(['effect'])

      callLog.length = 0
      context.runEffects()
      // Should not run again
      expect(callLog).toEqual([])
    })
  })

  describe('cleanup', () => {
    test('runs all cleanup functions', () => {
      const callLog: string[] = []

      context.registerEffect(() => {
        return () => callLog.push('cleanup1')
      })

      context.registerEffect(() => {
        return () => callLog.push('cleanup2')
      })

      context.runEffects()
      context.cleanup()

      expect(callLog).toEqual(['cleanup1', 'cleanup2'])
    })

    test('clears pending effects', () => {
      const callLog: string[] = []

      context.registerEffect(() => {
        callLog.push('effect')
      })

      context.cleanup()
      context.runEffects()

      // Should not run
      expect(callLog).toEqual([])
    })
  })
})

describe('createReactiveHooks', () => {
  test('creates hooks with custom context', async () => {
    const context = new ReactiveContext<{ value: string }, any>()
    const hooks = createReactiveHooks(context)

    expect(hooks.afterInit).toBeDefined()
    expect(hooks.afterUpdate).toBeDefined()
    expect(hooks.onShutdown).toBeDefined()
  })

  test('afterInit hook initializes context', async () => {
    const context = new ReactiveContext<{ count: number }, any>()
    const hooks = createReactiveHooks(context)

    if (hooks.afterInit) {
      await Effect.runPromise(hooks.afterInit({ count: 42 }))
    }

    expect(context.getState()).toEqual({ count: 42 })
  })

  test('afterUpdate hook syncs state and runs effects', async () => {
    const context = new ReactiveContext<{ count: number }, any>()
    const hooks = createReactiveHooks(context)
    const callLog: string[] = []

    // Initialize
    if (hooks.afterInit) {
      await Effect.runPromise(hooks.afterInit({ count: 0 }))
    }

    // Register an effect
    context.registerEffect(() => {
      callLog.push('effect ran')
    })

    // Update
    if (hooks.afterUpdate) {
      await Effect.runPromise(hooks.afterUpdate({ count: 0 }, { count: 1 }, { type: 'increment' }))
    }

    expect(context.getState()).toEqual({ count: 1 })
    expect(callLog).toEqual(['effect ran'])
  })

  test('onShutdown hook cleans up effects', async () => {
    const context = new ReactiveContext<any, any>()
    const hooks = createReactiveHooks(context)
    const callLog: string[] = []

    context.registerEffect(() => {
      return () => callLog.push('cleanup')
    })

    context.runEffects()

    if (hooks.onShutdown) {
      await Effect.runPromise(hooks.onShutdown())
    }

    expect(callLog).toEqual(['cleanup'])
  })
})

describe('createDefaultReactiveHooks', () => {
  test('creates hooks using global context', () => {
    const hooks = createDefaultReactiveHooks()

    expect(hooks.afterInit).toBeDefined()
    expect(hooks.afterUpdate).toBeDefined()
    expect(hooks.onShutdown).toBeDefined()
  })

  test('uses same global context across calls', async () => {
    const hooks1 = createDefaultReactiveHooks<{ value: number }, any>()
    const hooks2 = createDefaultReactiveHooks<{ value: number }, any>()

    // Initialize with hooks1
    if (hooks1.afterInit) {
      await Effect.runPromise(hooks1.afterInit({ value: 100 }))
    }

    // Check that hooks2 sees the same state via global context
    const globalContext = getGlobalReactiveContext<{ value: number }, any>()
    expect(globalContext.getState()).toEqual({ value: 100 })
  })
})

describe('getGlobalReactiveContext', () => {
  test('returns same instance across calls', () => {
    const ctx1 = getGlobalReactiveContext()
    const ctx2 = getGlobalReactiveContext()

    expect(ctx1).toBe(ctx2)
  })
})

describe('$runtimeEffect', () => {
  test('registers effect with global context', () => {
    const callLog: string[] = []
    const context = getGlobalReactiveContext()

    $runtimeEffect(() => {
      callLog.push('runtime effect')
    })

    context.runEffects()

    expect(callLog).toEqual(['runtime effect'])
  })

  test('supports cleanup functions', () => {
    const callLog: string[] = []
    const context = getGlobalReactiveContext()

    $runtimeEffect(() => {
      callLog.push('effect')
      return () => callLog.push('cleanup')
    })

    context.runEffects()
    expect(callLog).toEqual(['effect'])

    callLog.length = 0
    context.runEffects()
    expect(callLog).toEqual(['cleanup'])
  })
})

describe('Integration', () => {
  test('model changes sync to reactive state', async () => {
    type Model = { count: number; text: string }
    type Msg = { type: 'increment' } | { type: 'setText'; text: string }

    const context = new ReactiveContext<Model, Msg>()
    const hooks = createReactiveHooks(context)

    const initialModel: Model = { count: 0, text: 'hello' }

    // Initialize
    if (hooks.afterInit) {
      await Effect.runPromise(hooks.afterInit(initialModel))
    }

    expect(context.getState()).toEqual(initialModel)

    // Update count
    const newModel1: Model = { count: 1, text: 'hello' }
    if (hooks.afterUpdate) {
      await Effect.runPromise(hooks.afterUpdate(initialModel, newModel1, { type: 'increment' }))
    }

    expect(context.getState()).toEqual(newModel1)

    // Update text
    const newModel2: Model = { count: 1, text: 'world' }
    if (hooks.afterUpdate) {
      await Effect.runPromise(
        hooks.afterUpdate(newModel1, newModel2, { type: 'setText', text: 'world' })
      )
    }

    expect(context.getState()).toEqual(newModel2)
  })

  test('effects run after each update', async () => {
    type Model = { count: number }
    const context = new ReactiveContext<Model, any>()
    const hooks = createReactiveHooks(context)
    const effectLog: number[] = []

    // Initialize
    if (hooks.afterInit) {
      await Effect.runPromise(hooks.afterInit({ count: 0 }))
    }

    // Update multiple times, registering effect before each update
    for (let i = 1; i <= 3; i++) {
      // Register effect that logs count
      context.registerEffect(() => {
        const state = context.getState()
        if (state) {
          effectLog.push(state.count)
        }
      })

      if (hooks.afterUpdate) {
        await Effect.runPromise(
          hooks.afterUpdate({ count: i - 1 }, { count: i }, { type: 'increment' })
        )
      }
    }

    expect(effectLog).toEqual([1, 2, 3])
  })
})
