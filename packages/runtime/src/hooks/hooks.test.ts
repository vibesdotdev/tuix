/**
 * Tests for Runtime Hooks System
 */

import { test, expect, describe } from 'bun:test'
import { Effect } from 'effect'
import { createHooks, composeHooks, type RuntimeHooks } from './types'

describe('RuntimeHooks', () => {
  describe('createHooks', () => {
    test('creates hooks with type inference', () => {
      type Model = { count: number }
      type Msg = { type: 'increment' } | { type: 'decrement' }

      const hooks = createHooks<Model, Msg>({
        beforeUpdate: (msg, model) =>
          Effect.sync(() => {
            console.log('Before update:', msg, model)
          }),
        afterUpdate: (oldModel, newModel, msg) =>
          Effect.sync(() => {
            console.log('After update:', oldModel, newModel, msg)
          }),
      })

      expect(hooks.beforeUpdate).toBeDefined()
      expect(hooks.afterUpdate).toBeDefined()
    })
  })

  describe('composeHooks', () => {
    test('composes multiple hook sets', async () => {
      const callLog: string[] = []

      const hooks1: RuntimeHooks<any, any> = {
        beforeInit: () =>
          Effect.sync(() => {
            callLog.push('hooks1:beforeInit')
          }),
        beforeUpdate: (msg, model) =>
          Effect.sync(() => {
            callLog.push('hooks1:beforeUpdate')
          }),
      }

      const hooks2: RuntimeHooks<any, any> = {
        beforeInit: () =>
          Effect.sync(() => {
            callLog.push('hooks2:beforeInit')
          }),
        afterUpdate: (oldModel, newModel, msg) =>
          Effect.sync(() => {
            callLog.push('hooks2:afterUpdate')
          }),
      }

      const composed = composeHooks(hooks1, hooks2)

      // Test beforeInit calls both hooks
      if (composed.beforeInit) {
        await Effect.runPromise(composed.beforeInit())
        expect(callLog).toContain('hooks1:beforeInit')
        expect(callLog).toContain('hooks2:beforeInit')
      }

      callLog.length = 0

      // Test beforeUpdate only calls hooks1 (hooks2 doesn't have it)
      if (composed.beforeUpdate) {
        await Effect.runPromise(composed.beforeUpdate({ type: 'test' }, {}))
        expect(callLog).toContain('hooks1:beforeUpdate')
      }

      callLog.length = 0

      // Test afterUpdate only calls hooks2
      if (composed.afterUpdate) {
        await Effect.runPromise(composed.afterUpdate({}, {}, { type: 'test' }))
        expect(callLog).toContain('hooks2:afterUpdate')
      }
    })

    test('onMessage hooks can filter messages', async () => {
      const hooks1: RuntimeHooks<any, string> = {
        onMessage: msg =>
          Effect.sync(() => {
            // Filter out 'skip' messages
            return msg === 'skip' ? null : msg
          }),
      }

      const hooks2: RuntimeHooks<any, string> = {
        onMessage: msg =>
          Effect.sync(() => {
            // Transform 'transform' to 'transformed'
            return msg === 'transform' ? 'transformed' : msg
          }),
      }

      const composed = composeHooks(hooks1, hooks2)

      // Test filtering
      if (composed.onMessage) {
        const result1 = await Effect.runPromise(composed.onMessage('skip'))
        expect(result1).toBeNull()

        const result2 = await Effect.runPromise(composed.onMessage('keep'))
        expect(result2).toBe('keep')

        const result3 = await Effect.runPromise(composed.onMessage('transform'))
        expect(result3).toBe('transformed')
      }
    })

    test('composes empty hooks array', () => {
      const composed = composeHooks()
      expect(composed).toBeDefined()
      expect(Object.keys(composed).length).toBe(0)
    })

    test('handles single hook set', async () => {
      const callLog: string[] = []

      const hooks: RuntimeHooks<any, any> = {
        beforeInit: () =>
          Effect.sync(() => {
            callLog.push('init')
          }),
      }

      const composed = composeHooks(hooks)

      if (composed.beforeInit) {
        await Effect.runPromise(composed.beforeInit())
        expect(callLog).toEqual(['init'])
      }
    })

    test('runs hooks in order', async () => {
      const callLog: string[] = []

      const hooks1: RuntimeHooks<any, any> = {
        afterUpdate: (oldModel, newModel, msg) =>
          Effect.sync(() => {
            callLog.push('1')
          }),
      }

      const hooks2: RuntimeHooks<any, any> = {
        afterUpdate: (oldModel, newModel, msg) =>
          Effect.sync(() => {
            callLog.push('2')
          }),
      }

      const hooks3: RuntimeHooks<any, any> = {
        afterUpdate: (oldModel, newModel, msg) =>
          Effect.sync(() => {
            callLog.push('3')
          }),
      }

      const composed = composeHooks(hooks1, hooks2, hooks3)

      if (composed.afterUpdate) {
        await Effect.runPromise(composed.afterUpdate({}, {}, { type: 'test' }))
        expect(callLog).toEqual(['1', '2', '3'])
      }
    })
  })

  describe('Hook Types', () => {
    test('all hook signatures are compatible', () => {
      type Model = { value: number }
      type Msg = { type: 'set'; value: number }

      const hooks: RuntimeHooks<Model, Msg> = {
        beforeInit: () => Effect.void,
        afterInit: (model: Model) => Effect.void,
        beforeUpdate: (msg: Msg, model: Model) => Effect.void,
        afterUpdate: (oldModel: Model, newModel: Model, msg: Msg) => Effect.void,
        beforeRender: (model: Model) => Effect.void,
        afterRender: (view: any, model: Model) => Effect.void,
        onCommand: (cmd: Effect.Effect<Msg | null>) => Effect.void,
        onSubscription: (sub: Effect.Effect<Msg>) => Effect.void,
        onMessage: (msg: Msg) => Effect.succeed<Msg | null>(msg),
        onError: (error: unknown, context: string) => Effect.void,
        onShutdown: () => Effect.void,
      }

      expect(hooks).toBeDefined()
    })
  })
})
