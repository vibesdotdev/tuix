/**
 * Async View Tests
 *
 * Tests that the runtime properly handles async view functions
 */

import { test, expect, describe } from 'bun:test'
import { Effect } from 'effect'
import type { Component } from '@tuix/core/types'

describe('Async View Support', () => {
  test('view function can be async', async () => {
    // Simple async component
    const component: Component<{ value: string }, never> = {
      init: Effect.succeed([{ value: 'test' }, []] as const),

      update: (model, msg) => Effect.succeed([model, []] as const),

      // Async view function
      view: async model => {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 10))

        return {
          render: () => Effect.succeed(`Value: ${model.value}`),
        }
      },
    }

    // Type check passes - view can return Promise<View>
    expect(component.view).toBeDefined()

    // Call the async view
    const view = await component.view({ value: 'async test' })
    const rendered = await Effect.runPromise(view.render())

    expect(rendered).toBe('Value: async test')
  })

  test('view function can be synchronous', async () => {
    // Synchronous component (backwards compatible)
    const component: Component<{ count: number }, never> = {
      init: Effect.succeed([{ count: 0 }, []] as const),

      update: (model, msg) => Effect.succeed([model, []] as const),

      // Synchronous view function
      view: model => ({
        render: () => Effect.succeed(`Count: ${model.count}`),
      }),
    }

    // Type check passes - view can return View directly
    expect(component.view).toBeDefined()

    // Call the sync view
    const view = component.view({ count: 42 })
    const rendered = await Effect.runPromise(view.render())

    expect(rendered).toBe('Count: 42')
  })
})
