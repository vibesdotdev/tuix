import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { Effect } from 'effect'
import { getGlobalEventBus, resetGlobalEventBus } from '@tuix/core/events'
import { EventChoreographer } from './choreography'

describe('EventChoreographer', () => {
  beforeEach(async () => {
    await Effect.runPromise(resetGlobalEventBus())
  })
  afterEach(async () => {
    await Effect.runPromise(resetGlobalEventBus())
  })

  it('constructs with event bus', () => {
    const bus = getGlobalEventBus()
    const c = new EventChoreographer(bus)
    expect(c).toBeDefined()
  })

  it('initialize succeeds', async () => {
    const bus = getGlobalEventBus()
    const c = new EventChoreographer(bus)
    await Effect.runPromise(c.initialize())
    expect(true).toBe(true)
  })
})
