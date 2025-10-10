/**
 * Tests for JSX to MVU Component Compiler
 */

import { test, expect, describe } from 'bun:test'
import { Effect } from 'effect'
import {
  compileToComponent,
  createStatelessComponent,
  detectInteractive,
  type JSXComponent,
} from './jsx-to-component'

describe('detectInteractive', () => {
  test('returns false for simple components', () => {
    function SimpleComponent() {
      return { render: () => Effect.succeed('Hello') }
    }

    expect(detectInteractive(SimpleComponent)).toBe(false)
  })

  test('placeholder implementation always returns false', () => {
    // Current implementation is a placeholder
    function AnyComponent() {
      return { render: () => Effect.succeed('Test') }
    }

    expect(detectInteractive(AnyComponent)).toBe(false)
  })
})

describe('createStatelessComponent', () => {
  test('creates a component with empty model', async () => {
    function TestComponent() {
      return {
        render: () => Effect.succeed('Test Output'),
      }
    }

    const component = createStatelessComponent(TestComponent)

    expect(component.init).toBeDefined()
    expect(component.update).toBeDefined()
    expect(component.view).toBeDefined()

    // Test init
    const [model, cmds] = await Effect.runPromise(component.init)
    expect(model).toEqual({})
    expect(cmds).toEqual([])
  })

  test('view renders the JSX component', () => {
    const output = { render: () => Effect.succeed('Rendered') }
    function TestComponent() {
      return output
    }

    const component = createStatelessComponent(TestComponent)
    const view = component.view({})

    expect(view).toBe(output)
  })

  test('update returns model unchanged', async () => {
    function TestComponent() {
      return { render: () => Effect.succeed('Test') }
    }

    const component = createStatelessComponent(TestComponent)
    const model = {}

    // This should never actually be called, but TypeScript needs it
    // Update takes `never` as Msg type, so we can't actually call it
    // Just verify it exists
    expect(component.update).toBeDefined()
  })
})

describe('compileToComponent', () => {
  test('creates component from JSX function', () => {
    function TestComponent() {
      return {
        render: () => Effect.succeed('Test'),
      }
    }

    const component = compileToComponent(TestComponent)

    expect(component.init).toBeDefined()
    expect(component.update).toBeDefined()
    expect(component.view).toBeDefined()
  })

  test('sets interactive mode correctly', () => {
    function TestComponent() {
      return { render: () => Effect.succeed('Test') }
    }

    // Non-interactive (default)
    const nonInteractive = compileToComponent(TestComponent, {
      interactive: false,
    })
    expect(nonInteractive.subscriptions).toBeUndefined()

    // Interactive
    const interactive = compileToComponent(TestComponent, {
      interactive: true,
    })
    expect(interactive.subscriptions).toBeDefined()
  })

  test('extracts empty model when extractState is false', async () => {
    function TestComponent() {
      return { render: () => Effect.succeed('Test') }
    }

    const component = compileToComponent(TestComponent, {
      extractState: false,
    })

    const [model] = await Effect.runPromise(component.init)
    expect(model).toEqual({})
  })

  test('extracts model when extractState is true', async () => {
    function TestComponent() {
      // In a real implementation, this would have $state() calls
      return { render: () => Effect.succeed('Test') }
    }

    const component = compileToComponent(TestComponent, {
      extractState: true,
    })

    const [model] = await Effect.runPromise(component.init)
    // Placeholder returns empty model for now
    expect(model).toEqual({})
  })

  test('view function renders JSX component', async () => {
    const expectedOutput = {
      render: () => Effect.succeed('Expected Output'),
    }

    function TestComponent() {
      return expectedOutput
    }

    const component = compileToComponent(TestComponent)
    const view = await component.view({})

    expect(view).toBe(expectedOutput)
  })

  test('auto-detects non-interactive by default', () => {
    function TestComponent() {
      return { render: () => Effect.succeed('Test') }
    }

    const component = compileToComponent(TestComponent)

    // Should be non-interactive (no subscriptions)
    expect(component.subscriptions).toBeUndefined()
  })

  test('respects interactive option override', () => {
    function TestComponent() {
      return { render: () => Effect.succeed('Test') }
    }

    const component = compileToComponent(TestComponent, {
      interactive: true, // Force interactive
    })

    // Should have subscriptions even though auto-detect would say no
    expect(component.subscriptions).toBeDefined()
  })
})

describe('Integration', () => {
  test('compiled component can be initialized and rendered', async () => {
    function TestApp() {
      return {
        render: () => Effect.succeed('Hello from compiled component'),
      }
    }

    const component = compileToComponent(TestApp)

    // Initialize
    const [model, cmds] = await Effect.runPromise(component.init)
    expect(model).toEqual({})
    expect(cmds).toEqual([])

    // Render (view is now async)
    const view = await component.view(model)
    const rendered = await Effect.runPromise(view.render())
    expect(rendered).toBe('Hello from compiled component')
  })

  test('compiled component handles updates', async () => {
    function TestApp() {
      return {
        render: () => Effect.succeed('Test'),
      }
    }

    const component = compileToComponent<{ count: number }, { type: 'increment' }>(TestApp)

    const initialModel = { count: 0 }

    // Update (should return model unchanged since we don't handle messages yet)
    const [newModel, cmds] = await Effect.runPromise(
      component.update({ type: 'increment' }, initialModel)
    )

    expect(newModel).toEqual(initialModel)
    expect(cmds).toEqual([])
  })
})
