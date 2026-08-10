import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { Effect } from 'effect'
import { getGlobalEventBus, resetGlobalEventBus } from '@tuix/core/events'
import { EventStreamOptimizer } from './streamOptimizer'

describe('Event Stream Optimization', () => {
  beforeEach(async () => {
    await Effect.runPromise(resetGlobalEventBus())
  })
  afterEach(async () => {
    await Effect.runPromise(resetGlobalEventBus())
  })

  it('configureBufferSize is callable', async () => {
    const optimizer = new EventStreamOptimizer(getGlobalEventBus())
    await Effect.runPromise(optimizer.configureBufferSize('test-channel', 3))
    expect(true).toBe(true)
  })

  it('configureRateLimit is callable', async () => {
    const optimizer = new EventStreamOptimizer(getGlobalEventBus())
    await Effect.runPromise(optimizer.configureRateLimit('test-channel', 10))
    expect(true).toBe(true)
  })
})
