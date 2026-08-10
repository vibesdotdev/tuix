import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { Effect } from 'effect'
import { getGlobalEventBus, resetGlobalEventBus } from '@tuix/core/events'
import { WorkflowOrchestrator } from './orchestrator'
import { EventChoreographer } from './choreography'

describe('Workflow Orchestration', () => {
  beforeEach(async () => {
    await Effect.runPromise(resetGlobalEventBus())
  })
  afterEach(async () => {
    await Effect.runPromise(resetGlobalEventBus())
  })

  it('constructs without pre-registered choreographer', () => {
    const bus = getGlobalEventBus()
    const orch = new WorkflowOrchestrator(bus, new EventChoreographer(bus))
    expect(orch).toBeDefined()
  })

  it('exposes executeWorkflow', () => {
    const bus = getGlobalEventBus()
    const orch = new WorkflowOrchestrator(bus, new EventChoreographer(bus))
    expect(typeof orch.executeWorkflow).toBe('function')
  })

  it('cancels missing workflow with error', async () => {
    const bus = getGlobalEventBus()
    const orch = new WorkflowOrchestrator(bus, new EventChoreographer(bus))
    const either = await Effect.runPromise(orch.cancelWorkflow('missing').pipe(Effect.either))
    expect(either._tag).toBe('Left')
  })
})
