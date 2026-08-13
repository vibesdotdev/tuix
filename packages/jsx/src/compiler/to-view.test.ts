import { test, expect, describe } from 'bun:test'
import { Effect } from 'effect'
import { jsx, jsxs, Fragment } from '../jsx-runtime'
import { compileToComponent, toView } from './jsx-to-component'

describe('JSX → View pipeline', () => {
  test('toView converts text intrinsic to renderable View', async () => {
    const el = jsx('text', { children: 'Hello TUIX' })
    const view = toView(el)
    expect(typeof view.render).toBe('function')
    const out = await Effect.runPromise(view.render())
    const content = typeof out === 'string' ? out : (out as { content: string }).content
    expect(content).toContain('Hello TUIX')
    expect(content).not.toContain('[object Object]')
  })

  test('toView converts Fragment of commands-like trees without object Object', async () => {
    const el = jsxs(Fragment, {
      children: [
        jsx('text', { children: 'Available commands:' }),
        jsx('text', { children: '  version — show version' }),
      ],
    })
    const view = toView(el)
    const out = await Effect.runPromise(view.render())
    const content = typeof out === 'string' ? out : (out as { content: string }).content
    expect(content).toContain('Available commands:')
    expect(content).toContain('version')
    expect(content).not.toContain('[object Object]')
  })

  test('compileToComponent view returns View with render()', async () => {
    function App() {
      return jsx('text', { children: 'Compiled path' })
    }
    const c = compileToComponent(App, { interactive: false })
    const [model] = await Effect.runPromise(c.init)
    const view = await c.view(model)
    expect(typeof (view as { render?: unknown }).render).toBe('function')
    const out = await Effect.runPromise((view as { render: () => Effect.Effect<unknown> }).render())
    const content = typeof out === 'string' ? out : (out as { content: string }).content
    expect(content).toContain('Compiled path')
  })

  test('input bind:value unwraps runes', async () => {
    const { $state } = await import('@tuix/reactive')
    const name = $state('Ada')
    const view = toView(jsx('input', { 'bind:value': name, placeholder: 'Name' }))
    const out = await Effect.runPromise(view.render())
    const content = typeof out === 'string' ? out : (out as { content: string }).content
    expect(content).toContain('Ada')
    expect(content).not.toContain('function')
  })

  test('hstack gap inserts space between children', async () => {
    const el = jsxs('hstack', {
      gap: 2,
      children: [jsx('text', { children: 'A' }), jsx('text', { children: 'B' })],
    })
    const out = await Effect.runPromise(toView(el).render())
    const content = typeof out === 'string' ? out : (out as { content: string }).content
    expect(content).toContain('A  B')
  })

  test('button and checkbox intrinsics render cells', async () => {
    const btn = toView(jsx('button', { label: 'Save', focused: true }))
    const chk = toView(jsx('checkbox', { checked: true, label: 'Agree' }))
    const b = await Effect.runPromise(btn.render())
    const c = await Effect.runPromise(chk.render())
    const bt = typeof b === 'string' ? b : (b as { content: string }).content
    const ct = typeof c === 'string' ? c : (c as { content: string }).content
    expect(bt).toContain('Save')
    expect(ct).toContain('[x]')
  })
})
