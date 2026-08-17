import { describe, expect, it } from 'bun:test'
import { createToastStore } from './ToastViewport'

describe('ToastStore', () => {
  it('pushes and exposes toasts oldest-first', () => {
    const store = createToastStore({ defaultDuration: 0 })
    store.push('info', 'one')
    store.push('success', 'two')
    expect(store.toasts().map(t => t.message)).toEqual(['one', 'two'])
    expect(store.toasts()[0]?.kind).toBe('info')
  })

  it('drops the oldest beyond maxVisible', () => {
    const store = createToastStore({ maxVisible: 2, defaultDuration: 0 })
    store.push('info', 'one')
    store.push('info', 'two')
    store.push('info', 'three')
    expect(store.toasts().map(t => t.message)).toEqual(['two', 'three'])
  })

  it('dismiss removes one toast', () => {
    const store = createToastStore({ defaultDuration: 0 })
    const id = store.push('info', 'keep')
    store.push('info', 'drop')
    store.dismiss(id)
    expect(store.toasts().map(t => t.message)).toEqual(['drop'])
  })

  it('clear empties the stack', () => {
    const store = createToastStore({ defaultDuration: 0 })
    store.success('a')
    store.warning('b')
    store.clear()
    expect(store.toasts()).toEqual([])
  })

  it('auto-dismisses after the duration', async () => {
    const store = createToastStore({ defaultDuration: 5 })
    store.push('info', 'gone soon')
    expect(store.toasts().length).toBe(1)
    await new Promise(resolve => setTimeout(resolve, 30))
    expect(store.toasts().length).toBe(0)
  })

  it('convenience helpers set the kind', () => {
    const store = createToastStore({ defaultDuration: 0 })
    store.success('ok')
    store.danger('bad')
    expect(store.toasts().map(t => t.kind)).toEqual(['success', 'danger'])
  })
})
