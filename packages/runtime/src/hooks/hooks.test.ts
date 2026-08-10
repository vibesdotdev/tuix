import { test, expect, describe } from 'bun:test'
import { Effect } from 'effect'
import { composeHooks, createHooks, type RuntimeHooks } from './types'
import { applyOnMessageHook } from '../mvu/runtime/core'

describe('RuntimeHooks composition', () => {
  test('createHooks returns same object', () => {
    const hooks = createHooks({
      beforeInit: () => Effect.void,
    })
    expect(hooks.beforeInit).toBeDefined()
  })

  test('composeHooks runs afterUpdate in order', async () => {
    const order: number[] = []
    const a: RuntimeHooks = {
      afterUpdate: () =>
        Effect.sync(() => {
          order.push(1)
        }),
    }
    const b: RuntimeHooks = {
      afterUpdate: () =>
        Effect.sync(() => {
          order.push(2)
        }),
    }
    const c = composeHooks(a, b)
    await Effect.runPromise(c.afterUpdate!({}, {}, {}))
    expect(order).toEqual([1, 2])
  })

  test('onMessage can cancel via null', async () => {
    const composed = composeHooks(
      {
        onMessage: (msg: number) => Effect.succeed(msg > 0 ? msg : null),
      },
      {
        onMessage: (msg: number) => Effect.succeed(msg * 2),
      }
    )
    const kept = await Effect.runPromise(composed.onMessage!(3))
    expect(kept).toBe(6)
    const cancelled = await Effect.runPromise(composed.onMessage!(-1))
    expect(cancelled).toBeNull()
  })

  test('onError hook is composable', async () => {
    const contexts: string[] = []
    const hooks = composeHooks({
      onError: (_e, ctx) =>
        Effect.sync(() => {
          contexts.push(ctx)
        }),
    })
    await Effect.runPromise(hooks.onError!(new Error('x'), 'update'))
    await Effect.runPromise(hooks.onError!(new Error('y'), 'render'))
    expect(contexts).toEqual(['update', 'render'])
  })
})

describe('applyOnMessageHook', () => {
  test('passthrough without hooks', async () => {
    expect(await Effect.runPromise(applyOnMessageHook(undefined, 'x'))).toBe('x')
  })

  test('cancel chain short-circuits second hook', async () => {
    const log: string[] = []
    const hooks = composeHooks(
      {
        onMessage: (msg: string) =>
          Effect.sync(() => {
            log.push('a')
            return msg === 'skip' ? null : msg
          }),
      },
      {
        onMessage: (msg: string) =>
          Effect.sync(() => {
            log.push('b')
            return msg.toUpperCase()
          }),
      }
    )
    expect(await Effect.runPromise(applyOnMessageHook(hooks, 'skip'))).toBeNull()
    expect(log).toEqual(['a'])
    log.length = 0
    expect(await Effect.runPromise(applyOnMessageHook(hooks, 'ok'))).toBe('OK')
    expect(log).toEqual(['a', 'b'])
  })
})
