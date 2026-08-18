/**
 * Focus ring, scoped key routing, overlay capture, and backdrop dispatch.
 */
import { describe, expect, it, beforeEach } from 'bun:test'
import {
  registerFocusable,
  unregisterFocusable,
  getFocusedId,
  setFocusedId,
  isFocused,
  cycleFocus,
  focusCount,
  dispatchFocusedKey,
  sweepFocusables,
  resetFocus,
  registerOverlayKeyHandler,
  registerBackdropHandler,
  hasOverlayKeyHandlers,
  dispatchBackdropClick,
} from './focus'
import { registerKeyHandler, emitKeyToHandlers, clearKeyHandlers } from './runes'

describe('focus registry', () => {
  beforeEach(() => {
    resetFocus()
    clearKeyHandlers()
  })

  it('registers focusables in first-seen order', () => {
    registerFocusable('a')
    registerFocusable('b')
    registerFocusable('a') // re-registration keeps position
    expect(focusCount()).toBe(2)
  })

  it('setFocusedId ignores unknown ids but accepts null', () => {
    registerFocusable('a')
    setFocusedId('nope')
    expect(getFocusedId()).toBeNull()
    setFocusedId('a')
    expect(getFocusedId()).toBe('a')
    setFocusedId(null)
    expect(getFocusedId()).toBeNull()
  })

  it('cycleFocus wraps through registration order', () => {
    registerFocusable('a')
    registerFocusable('b')
    registerFocusable('c')
    expect(cycleFocus(1)).toBe('a')
    expect(cycleFocus(1)).toBe('b')
    expect(cycleFocus(1)).toBe('c')
    expect(cycleFocus(1)).toBe('a')
    expect(cycleFocus(-1)).toBe('c')
  })

  it('cycleFocus with no focusables clears focus', () => {
    expect(cycleFocus(1)).toBeNull()
    expect(getFocusedId()).toBeNull()
  })

  it('sweep drops entries not re-registered and resets focus when focused entry goes', () => {
    registerFocusable('a')
    registerFocusable('b')
    setFocusedId('b')
    sweepFocusables() // both were seen this epoch — kept
    expect(focusCount()).toBe(2)
    expect(getFocusedId()).toBe('b')

    registerFocusable('a') // only a re-rendered
    sweepFocusables()
    expect(focusCount()).toBe(1)
    expect(getFocusedId()).toBeNull()
  })

  it('unregisterFocusable removes immediately', () => {
    registerFocusable('a')
    setFocusedId('a')
    unregisterFocusable('a')
    expect(focusCount()).toBe(0)
    expect(getFocusedId()).toBeNull()
  })

  it('isFocused tracks the focused id', () => {
    registerFocusable('a')
    setFocusedId('a')
    expect(isFocused('a')).toBe(true)
    expect(isFocused('b')).toBe(false)
  })
})

describe('scoped key routing', () => {
  beforeEach(() => {
    resetFocus()
    clearKeyHandlers()
  })

  it('focused handler receives keys and can consume them', () => {
    const seen: string[] = []
    registerFocusable('a', key => {
      seen.push(key)
      return true
    })
    setFocusedId('a')

    let globalSaw = false
    registerKeyHandler(() => {
      globalSaw = true
    })

    emitKeyToHandlers('x')
    expect(seen).toEqual(['x'])
    expect(globalSaw).toBe(false)
  })

  it('unconsumed keys fall through to global handlers', () => {
    const seen: string[] = []
    registerFocusable('a', key => {
      seen.push(key)
      return false
    })
    setFocusedId('a')

    let globalSaw = false
    registerKeyHandler(() => {
      globalSaw = true
    })

    emitKeyToHandlers('x')
    expect(seen).toEqual(['x'])
    expect(globalSaw).toBe(true)
  })

  it('tab cycles focus instead of broadcasting when focusables exist', () => {
    registerFocusable('a')
    registerFocusable('b')
    setFocusedId('a')

    let globalSaw = false
    registerKeyHandler(() => {
      globalSaw = true
    })

    emitKeyToHandlers('tab')
    expect(getFocusedId()).toBe('b')
    expect(globalSaw).toBe(false)

    emitKeyToHandlers('shift+tab')
    expect(getFocusedId()).toBe('a')
  })

  it('tab still reaches global handlers when nothing is focusable', () => {
    let got = ''
    registerKeyHandler(key => {
      got = key
    })
    emitKeyToHandlers('tab')
    expect(got).toBe('tab')
  })

  it('dispatchFocusedKey is a no-op with nothing focused', () => {
    registerFocusable('a', () => true)
    expect(dispatchFocusedKey('x')).toBe(false)
  })
})

describe('overlay capture + backdrop', () => {
  beforeEach(() => {
    resetFocus()
    clearKeyHandlers()
  })

  it('overlay handlers capture keys entirely while active', () => {
    let modalSaw = ''
    registerOverlayKeyHandler(key => {
      modalSaw = key
      return false
    })

    let globalSaw = false
    registerKeyHandler(() => {
      globalSaw = true
    })
    registerFocusable('a', () => true)
    setFocusedId('a')

    emitKeyToHandlers('x')
    expect(modalSaw).toBe('x')
    expect(globalSaw).toBe(false)
    expect(hasOverlayKeyHandlers()).toBe(true)
  })

  it('sweep removes overlay handlers that were not re-registered', () => {
    registerOverlayKeyHandler(() => false)
    sweepFocusables() // sweep of the frame that registered it — kept
    expect(hasOverlayKeyHandlers()).toBe(true)
    sweepFocusables() // next frame without re-registration — dropped
    expect(hasOverlayKeyHandlers()).toBe(false)
  })

  it('sweep keeps overlay handlers re-registered every frame', () => {
    registerOverlayKeyHandler(() => false)
    sweepFocusables()
    registerOverlayKeyHandler(() => false)
    sweepFocusables()
    expect(hasOverlayKeyHandlers()).toBe(true)
  })

  it('backdrop handlers fire on dispatch and report registration', () => {
    let closed = false
    registerBackdropHandler(() => {
      closed = true
    })
    expect(dispatchBackdropClick()).toBe(true)
    expect(closed).toBe(true)

    sweepFocusables() // registered this epoch — kept
    expect(dispatchBackdropClick()).toBe(true)
    sweepFocusables() // not re-registered — dropped
    expect(dispatchBackdropClick()).toBe(false)
  })
})
