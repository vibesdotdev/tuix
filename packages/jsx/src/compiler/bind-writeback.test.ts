/**
 * bind:value write-back: a named bound rune registers a focusable whose
 * scoped handler writes typed keys back through $set.
 */
import { test, expect, describe, beforeEach } from 'bun:test'
import { Effect } from 'effect'
import { jsx } from '../jsx-runtime'
import { toView } from './jsx-to-component'
import {
  $state,
  emitKeyToHandlers,
  registerKeyHandler,
  cycleFocus,
  isFocused,
  sweepFocusables,
  resetFocus,
  clearKeyHandlers,
} from '@tuix/reactive'

const render = async (el: unknown): Promise<string> => {
  const out = await Effect.runPromise(toView(el).render())
  return typeof out === 'string' ? out : (out as { content: string }).content
}

describe('bind:value write-back', () => {
  beforeEach(() => {
    resetFocus()
    clearKeyHandlers()
  })

  test('typing writes through the bound rune', async () => {
    const draft = $state('', 'draft')
    await render(jsx('input', { 'bind:value': draft, placeholder: 'type' }))

    // Nothing focused yet: keys go to global handlers only.
    emitKeyToHandlers('h')
    expect(draft()).toBe('')

    cycleFocus(1)
    expect(isFocused('bind:draft')).toBe(true)

    for (const ch of 'hello') emitKeyToHandlers(ch)
    expect(draft()).toBe('hello')

    emitKeyToHandlers('backspace')
    emitKeyToHandlers('backspace')
    expect(draft()).toBe('hel')
  })

  test('typing does not leak to global handlers while consumed', async () => {
    const draft = $state('', 'draft2')
    await render(jsx('input', { 'bind:value': draft }))

    const leaked: string[] = []
    registerKeyHandler(key => leaked.push(key))
    cycleFocus(1)
    emitKeyToHandlers('a')
    expect(leaked).toEqual([])
    expect(draft()).toBe('a')
  })

  test('space inserts a space character (not swallowed)', async () => {
    const draft = $state('', 'draft-space')
    await render(jsx('input', { 'bind:value': draft }))
    cycleFocus(1)
    emitKeyToHandlers('a')
    emitKeyToHandlers('space')
    emitKeyToHandlers('b')
    expect(draft()).toBe('a b')
  })

  test('enter fires onSubmit with the current value', async () => {
    const draft = $state('', 'draft3')
    let submitted = ''
    await render(jsx('input', { 'bind:value': draft, onSubmit: v => (submitted = v) }))
    cycleFocus(1)
    for (const ch of 'go') emitKeyToHandlers(ch)
    emitKeyToHandlers('enter')
    expect(submitted).toBe('go')
  })

  test('onChange fires for each edit', async () => {
    const draft = $state('', 'draft4')
    const changes: string[] = []
    await render(jsx('input', { 'bind:value': draft, onChange: v => changes.push(v) }))
    cycleFocus(1)
    emitKeyToHandlers('a')
    emitKeyToHandlers('b')
    expect(changes).toEqual(['a', 'ab'])
  })

  test('charLimit stops insertion but still consumes the key', async () => {
    const draft = $state('', 'draft5')
    await render(jsx('input', { 'bind:value': draft, charLimit: 2 }))
    cycleFocus(1)
    emitKeyToHandlers('a')
    emitKeyToHandlers('b')
    emitKeyToHandlers('c')
    expect(draft()).toBe('ab')
  })

  test('unnamed bound runes render display-only without crashing', async () => {
    const draft = $state('x')
    const content = await render(jsx('input', { 'bind:value': draft }))
    expect(content).toContain('x')
  })

  test('focused input renders the cursor form', async () => {
    const draft = $state('hi', 'draft6')
    await render(jsx('input', { 'bind:value': draft }))
    const unfocused = await render(jsx('input', { 'bind:value': draft }))
    expect(unfocused).toContain('[ hi ]')

    cycleFocus(1)
    const focused = await render(jsx('input', { 'bind:value': draft }))
    expect(focused).toContain('▌ hi ▐')
  })

  test('sweep drops focusables from widgets that stop rendering', async () => {
    const draft = $state('', 'draft7')
    await render(jsx('input', { 'bind:value': draft }))
    expect(cycleFocus(1)).toBe('bind:draft7')

    // End of the frame that rendered the input — kept.
    sweepFocusables()
    expect(cycleFocus(1)).toBe('bind:draft7')

    // Next frame renders without the input — dropped at its sweep.
    await render(jsx('text', { children: 'gone' }))
    sweepFocusables()
    expect(cycleFocus(1)).toBeNull()
  })
})
