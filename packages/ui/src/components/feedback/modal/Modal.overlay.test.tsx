/**
 * Modal overlay behavior: escape/enter capture and backdrop dismissal.
 */
import { describe, expect, it, beforeEach } from 'bun:test'
import { Effect } from 'effect'
import { Modal } from './Modal'
import { toView } from '@tuix/jsx'
import {
  emitKeyToHandlers,
  registerKeyHandler,
  dispatchBackdropClick,
  resetFocus,
  clearKeyHandlers,
  hasOverlayKeyHandlers,
} from '@tuix/reactive'

const render = async (el: unknown): Promise<string> => {
  const out = await Effect.runPromise(toView(el as never).render())
  return typeof out === 'string' ? out : (out as { content: string }).content
}

describe('Modal overlay wiring', () => {
  beforeEach(() => {
    resetFocus()
    clearKeyHandlers()
  })

  it('registers an overlay key handler while open', async () => {
    await render(<Modal open title="Confirm" />)
    expect(hasOverlayKeyHandlers()).toBe(true)
  })

  it('escape fires onClose and captures the key', async () => {
    let closed = 0
    await render(<Modal open title="Confirm" onClose={() => closed++} />)

    let leaked = false
    registerKeyHandler(() => {
      leaked = true
    })

    emitKeyToHandlers('escape')
    expect(closed).toBe(1)
    expect(leaked).toBe(false)
  })

  it('enter fires onConfirm', async () => {
    let confirmed = 0
    await render(<Modal open title="Confirm" onConfirm={() => confirmed++} />)
    emitKeyToHandlers('enter')
    expect(confirmed).toBe(1)
  })

  it('closeOnEscape=false ignores escape', async () => {
    let closed = 0
    await render(<Modal open title="X" closeOnEscape={false} onClose={() => closed++} />)
    emitKeyToHandlers('escape')
    expect(closed).toBe(0)
  })

  it('closeOnBackdrop dismisses via backdrop dispatch', async () => {
    let closed = 0
    await render(<Modal open title="X" closeOnBackdrop onClose={() => closed++} />)
    expect(dispatchBackdropClick()).toBe(true)
    expect(closed).toBe(1)
  })

  it('without closeOnBackdrop the backdrop dispatch does nothing', async () => {
    let closed = 0
    await render(<Modal open title="X" onClose={() => closed++} />)
    expect(dispatchBackdropClick()).toBe(false)
    expect(closed).toBe(0)
  })

  it('closed modal registers nothing', async () => {
    await render(<Modal open={false} title="X" />)
    expect(hasOverlayKeyHandlers()).toBe(false)
  })
})
