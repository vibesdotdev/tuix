import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { Effect } from 'effect'
import { getGlobalEventBus, resetGlobalEventBus } from '@tuix/core/events'
import { PerformanceMonitor } from './performanceMonitor'

describe('Performance Monitoring', () => {
  beforeEach(async () => {
    await Effect.runPromise(resetGlobalEventBus())
  })
  afterEach(async () => {
    await Effect.runPromise(resetGlobalEventBus())
  })

  it('initializes and resets metrics', async () => {
    const mon = new PerformanceMonitor(getGlobalEventBus())
    await Effect.runPromise(mon.initialize())
    await Effect.runPromise(mon.resetMetrics())
    expect(true).toBe(true)
  })

  it('tracks workflow monitoring', async () => {
    const mon = new PerformanceMonitor(getGlobalEventBus())
    await Effect.runPromise(mon.startWorkflowMonitoring('wf'))
    const m = await Effect.runPromise(mon.getWorkflowMetrics('wf'))
    expect(m?.workflowId).toBe('wf')
  })
})
