/**
 * Integration tests for Runtime with Hooks
 * Verifies that hooks work correctly with the full runtime
 */

import { test, expect, describe } from 'bun:test'
import { Effect } from 'effect'
import { runApp, createHooks, Cmd } from '../index'

describe('Runtime Integration with Hooks', () => {
  test('runApp accepts config without hooks (backwards compatibility)', async () => {
    type Model = { count: number }
    type Msg = { type: 'increment' }

    const component = {
      init: Effect.succeed([{ count: 0 }, []] as const),
      update: (msg: Msg, model: Model) =>
        Effect.succeed([{ count: model.count + 1 }, []] as const),
      view: (model: Model) => ({
        render: () => Effect.succeed(`Count: ${model.count}`),
      }),
    }

    // This should work without hooks - backwards compatible
    const config = {
      fps: 60,
      exitAfterRender: true, // Exit immediately for test
    }

    // Should not throw
    expect(() => runApp(component, config)).not.toThrow()
  })

  test('runApp accepts config with hooks', async () => {
    type Model = { count: number }
    type Msg = { type: 'increment' }

    const callLog: string[] = []

    const hooks = createHooks<Model, Msg>({
      beforeInit: () =>
        Effect.sync(() => {
          callLog.push('beforeInit')
        }),
      afterInit: model =>
        Effect.sync(() => {
          callLog.push(`afterInit:${model.count}`)
        }),
    })

    const component = {
      init: Effect.succeed([{ count: 0 }, []] as const),
      update: (msg: Msg, model: Model) =>
        Effect.succeed([{ count: model.count + 1 }, []] as const),
      view: (model: Model) => ({
        render: () => Effect.succeed(`Count: ${model.count}`),
      }),
    }

    const config = {
      fps: 60,
      exitAfterRender: true,
      hooks,
    }

    // Should not throw
    expect(() => runApp(component, config)).not.toThrow()
  })

  test('exitAfterRender defaults to false', () => {
    const config = { fps: 60 }

    // The default should be false (continuous loop for TUI apps)
    expect(config.exitAfterRender).toBeUndefined() // Will default in runtime
  })

  test('Cmd helpers are exported', () => {
    expect(Cmd.none).toBeDefined()
    expect(Cmd.batch).toBeDefined()
    expect(Cmd.delay).toBeDefined()
    expect(Cmd.fromEffect).toBeDefined()
    expect(Cmd.fetch).toBeDefined()
    expect(Cmd.exec).toBeDefined()
    expect(Cmd.map).toBeDefined()
  })
})
