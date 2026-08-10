/**
 * MVU Runtime Tests — against the real Runtime API
 */

import { describe, it, expect } from 'bun:test'
import { Effect } from 'effect'
import { createRuntime, runApp } from './runtime'
import { Runtime } from './runtime/core'
import { applyOnMessageHook } from './runtime/core'
import { createHooks } from '../hooks'

describe('MVU Runtime', () => {
  describe('Basic Runtime Operations', () => {
    it('should create runtime with config', async () => {
      const runtime = await Effect.runPromise(createRuntime({ fps: 30 }))
      expect(runtime).toBeInstanceOf(Runtime)
    })

    it('should initialize runtime state via createRuntime', async () => {
      const runtime = await Effect.runPromise(createRuntime({}))
      expect(runtime).toBeDefined()
    })
  })

  describe('Update Cycles', () => {
    it('should export runApp factory', () => {
      expect(typeof runApp).toBe('function')
    })

    it('should apply onMessage hooks for cancel', async () => {
      const hooks = createHooks({
        onMessage: (msg: number) => Effect.succeed(msg > 0 ? msg : null),
      })
      const kept = await Effect.runPromise(applyOnMessageHook(hooks, 2))
      expect(kept).toBe(2)
      const cancelled = await Effect.runPromise(applyOnMessageHook(hooks, -1))
      expect(cancelled).toBeNull()
    })

    it('should passthrough without hooks', async () => {
      const msg = await Effect.runPromise(applyOnMessageHook(undefined, 'x'))
      expect(msg).toBe('x')
    })
  })

  describe('View Rendering', () => {
    it('runApp accepts component shape', () => {
      const component = {
        init: Effect.succeed([{ n: 0 }, []] as const),
        update: (_m: unknown, model: { n: number }) => Effect.succeed([model, []] as const),
        view: () => ({ render: () => Effect.succeed('ok') }),
      }
      expect(() => runApp(component, { exitAfterRender: true })).not.toThrow()
    })
  })

  describe('Subscription Management', () => {
    it('createRuntime works with empty config', async () => {
      const r = await Effect.runPromise(createRuntime())
      expect(r).toBeDefined()
    })
  })

  describe('Async Operations', () => {
    it('createRuntime is async-capable via Effect', async () => {
      const r = await Effect.runPromise(
        Effect.gen(function* () {
          return yield* createRuntime({ fps: 10 })
        })
      )
      expect(r).toBeInstanceOf(Runtime)
    })
  })

  describe('Error Handling', () => {
    it('hooks onError is composable with createHooks', async () => {
      const seen: string[] = []
      const hooks = createHooks({
        onError: (_e, ctx) =>
          Effect.sync(() => {
            seen.push(ctx)
          }),
      })
      await Effect.runPromise(hooks.onError!(new Error('x'), 'update'))
      expect(seen).toEqual(['update'])
    })
  })

  describe('Lifecycle Management', () => {
    it('runApp returns Effect', () => {
      const component = {
        init: Effect.succeed([{}, []] as const),
        update: (_m: never, model: {}) => Effect.succeed([model, []] as const),
        view: () => ({ render: () => Effect.succeed('') }),
      }
      const program = runApp(component, { exitAfterRender: true })
      expect(program).toBeDefined()
    })
  })

  describe('Performance', () => {
    it('should create many runtimes efficiently', async () => {
      const start = Date.now()
      for (let i = 0; i < 20; i++) {
        await Effect.runPromise(createRuntime({ fps: 60 }))
      }
      expect(Date.now() - start).toBeLessThan(5000)
    })
  })
})
