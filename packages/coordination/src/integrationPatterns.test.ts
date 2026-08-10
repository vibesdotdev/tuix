import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { Effect } from 'effect'
import { getGlobalEventBus, resetGlobalEventBus } from '@tuix/core/events'
import { IntegrationPatterns } from './integrationPatterns'

describe('Integration Patterns', () => {
  beforeEach(async () => {
    await Effect.runPromise(resetGlobalEventBus())
  })
  afterEach(async () => {
    await Effect.runPromise(resetGlobalEventBus())
  })

  it('creates process monitoring pattern', async () => {
    const patterns = new IntegrationPatterns(getGlobalEventBus())
    const handle = await Effect.runPromise(patterns.createProcessMonitoringPattern())
    expect(handle.id).toBe('process-monitoring')
    expect(handle.active).toBe(true)
  })

  it('creates interactive CLI pattern', async () => {
    const patterns = new IntegrationPatterns(getGlobalEventBus())
    const handle = await Effect.runPromise(patterns.createInteractiveCLIPattern())
    expect(handle.pattern).toBe('interactive-cli')
  })
})
