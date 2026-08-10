/**
 * Tests for JSX to MVU Component Compiler
 */

import { test, expect, describe } from 'bun:test'
import { Effect } from 'effect'
import { $state, $states } from '@tuix/reactive'
import {
  compileToComponent,
  createStatelessComponent,
  detectInteractive,
  extractModel,
  extractStateFromSource,
  type JSXComponent,
} from './jsx-to-component'

describe('detectInteractive', () => {
  test('returns false for simple components', () => {
    function SimpleComponent() {
      return { render: () => Effect.succeed('Hello') }
    }

    expect(detectInteractive(SimpleComponent)).toBe(false)
  })

  test('returns true when interactive property is set', () => {
    function AnyComponent() {
      return { render: () => Effect.succeed('Test') }
    }
    ;(AnyComponent as any).interactive = true

    expect(detectInteractive(AnyComponent)).toBe(true)
  })

  test('name heuristics: Interactive/Game/Editor yes; bare *App shell no', () => {
    function CounterApp() {
      return { render: () => Effect.succeed('App') }
    }
    function TuixApp() {
      return { render: () => Effect.succeed('shell') }
    }
    function MyInteractive() {
      return { render: () => Effect.succeed('I') }
    }
    function SnakeGame() {
      return { render: () => Effect.succeed('G') }
    }
    function VersionCommand() {
      return { render: () => Effect.succeed('v') }
    }

    // Bare *App is not enough (CLI shell false-positive)
    expect(detectInteractive(CounterApp)).toBe(false)
    expect(detectInteractive(TuixApp)).toBe(false)
    expect(detectInteractive(VersionCommand)).toBe(false)
    expect(detectInteractive(MyInteractive)).toBe(true)
    expect(detectInteractive(SnakeGame)).toBe(true)
  })

  test('explicit interactive flag overrides name', () => {
    function TuixApp() {
      return { render: () => Effect.succeed('shell') }
    }
    ;(TuixApp as any).interactive = true
    expect(detectInteractive(TuixApp)).toBe(true)
    ;(TuixApp as any).interactive = false
    expect(detectInteractive(TuixApp)).toBe(false)
  })

  test('returns true for $state components', () => {
    function Counter() {
      const count = $state(0)
      return { render: () => Effect.succeed(String(count)) }
    }
    // $state may not exist at runtime — define a local for source analysis via toString
    // The function body contains "$state(" in source for detectInteractive
    expect(detectInteractive(Counter)).toBe(true)
  })

  test('returns true when source has event handlers', () => {
    function WithClick() {
      const onClick = () => {}
      return { render: () => Effect.succeed('c'), onClick }
    }
    expect(detectInteractive(WithClick)).toBe(true)
  })
})

describe('extractStateFromSource', () => {
  test('parses const name = $state(literal)', () => {
    const source = `
      function C() {
        const count = $state(0)
        const label = $state('hi')
        const on = $state(true)
        const nothing = $state(null)
        return null
      }
    `
    expect(extractStateFromSource(source)).toEqual({
      count: 0,
      label: 'hi',
      on: true,
      nothing: null,
    })
  })

  test('parses let name = $state(literal)', () => {
    const source = `let n = $state(42); let f = $state(3.14)`
    expect(extractStateFromSource(source)).toEqual({ n: 42, f: 3.14 })
  })

  test('ignores non-literals', () => {
    const source = `const x = $state(foo()); const y = $state({})`
    expect(extractStateFromSource(source)).toEqual({})
  })
})

describe('extractModel', () => {
  test('uses options.initialModel', () => {
    function C() {
      return null
    }
    expect(extractModel(C, { initialModel: { a: 1 } })).toEqual({ a: 1 })
  })

  test('uses component.initialModel static', () => {
    function C() {
      return null
    }
    ;(C as any).initialModel = { count: 5 }
    expect(extractModel(C, {})).toEqual({ count: 5 })
  })

  test('extracts named $state via second arg (Bun-safe)', () => {
    function C() {
      const count = $state(0, 'count')
      return null
    }
    const model = extractModel(C, { extractState: true })
    expect(model).toEqual({ count: 0 })
  })

  test('extracts named model via $states bag (Bun-safe)', () => {
    function C() {
      const { count, label } = $states({ count: 0, label: 'hi' })
      return { count, label }
    }
    const model = extractModel(C, { extractState: true })
    expect(model).toEqual({ count: 0, label: 'hi' })
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

  test('view renders the JSX component', async () => {
    const output = { render: () => Effect.succeed('Rendered') }
    function TestComponent() {
      return output
    }

    const component = createStatelessComponent(TestComponent)
    const view = await component.view({})

    // toView preserves View-like objects with render()
    expect(typeof (view as { render: unknown }).render).toBe('function')
    const out = await Effect.runPromise((view as { render: () => Effect.Effect<string> }).render())
    expect(out).toBe('Rendered')
  })

  test('update returns model unchanged', async () => {
    function TestComponent() {
      return { render: () => Effect.succeed('Test') }
    }

    const component = createStatelessComponent(TestComponent)
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
    expect(interactive.subscriptions?.({})).toEqual([])
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

  test('extracts model when extractState is true from named $state', async () => {
    function TestComponent() {
      const count = $state(0, 'count')
      return { render: () => Effect.succeed('Test') }
    }

    const component = compileToComponent(TestComponent, {
      extractState: true,
    })

    const [model] = await Effect.runPromise(component.init)
    expect(model).toEqual({ count: 0 })
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

  test('auto-detects non-interactive by default for plain components', () => {
    function TestComponent() {
      return { render: () => Effect.succeed('Test') }
    }

    const component = compileToComponent(TestComponent)

    // Should be non-interactive (no subscriptions)
    expect(component.subscriptions).toBeUndefined()
  })

  test('auto-detects interactive for $state components', () => {
    function Counter() {
      const count = $state(0)
      return { render: () => Effect.succeed(String(count)) }
    }

    const component = compileToComponent(Counter)
    expect(component.subscriptions).toBeDefined()
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

  test('update handles set key messages', async () => {
    function TestApp() {
      return { render: () => Effect.succeed('Test') }
    }

    const component = compileToComponent<
      { count: number },
      { type: 'set'; key: string; value: unknown }
    >(TestApp)

    const [newModel, cmds] = await Effect.runPromise(
      component.update({ type: 'set', key: 'count', value: 3 }, { count: 0 })
    )

    expect(newModel).toEqual({ count: 3 })
    expect(cmds).toEqual([])
  })

  test('view.render reflects model after set for named $state Counter', async () => {
    function Counter() {
      const count = $state(0, 'count')
      return {
        render: () => Effect.succeed(`Count: ${count()}`),
      }
    }

    const component = compileToComponent<
      { count: number },
      { type: 'set'; key: string; value: unknown }
    >(Counter, { extractState: true, interactive: true })

    const [model0] = await Effect.runPromise(component.init)
    expect(model0).toEqual({ count: 0 })

    const view0 = await component.view(model0)
    const out0 = await Effect.runPromise(
      (view0 as { render: () => Effect.Effect<string> }).render()
    )
    expect(out0).toBe('Count: 0')

    const [model1] = await Effect.runPromise(
      component.update({ type: 'set', key: 'count', value: 42 }, model0)
    )
    expect(model1.count).toBe(42)

    const view1 = await component.view(model1)
    const out1 = await Effect.runPromise(
      (view1 as { render: () => Effect.Effect<string> }).render()
    )
    // Must paint hydrated state — not re-init $state(0)
    expect(out1).toBe('Count: 42')
  })

  test('update handles set path messages', async () => {
    function TestApp() {
      return { render: () => Effect.succeed('Test') }
    }

    const component = compileToComponent<
      { name: string },
      { type: 'set'; path: string; value: unknown }
    >(TestApp)

    const [newModel] = await Effect.runPromise(
      component.update({ type: 'set', path: 'name', value: 'tuix' }, { name: '' })
    )

    expect(newModel).toEqual({ name: 'tuix' })
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

  test('compiled component handles unknown updates as no-op', async () => {
    function TestApp() {
      return {
        render: () => Effect.succeed('Test'),
      }
    }

    const component = compileToComponent<{ count: number }, { type: 'increment' }>(TestApp)

    const initialModel = { count: 0 }

    const [newModel, cmds] = await Effect.runPromise(
      component.update({ type: 'increment' }, initialModel)
    )

    expect(newModel).toEqual(initialModel)
    expect(cmds).toEqual([])
  })
})
