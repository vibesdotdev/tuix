import { describe, expect, it } from 'bun:test'
import { Effect } from 'effect'
import { EventBus, generateId, type BaseEvent } from '@tuix/core/events'
import { ComponentCoordinator, type CoordinationPattern } from './component-coordinator'

const testEvent = (): BaseEvent => ({
  type: 'coord-test',
  timestamp: new Date(),
  source: 'coordination-test',
  id: generateId(),
})

describe('ComponentCoordinator', () => {
  it('stopCoordination removes event handlers instead of leaking them', async () => {
    let handled = 0
    const pattern: CoordinationPattern = {
      id: 'test-pattern',
      name: 'Test Pattern',
      eventTypes: ['coord-test'],
      initialize: () => Effect.void,
      handleEvent: () =>
        Effect.sync(() => {
          handled += 1
        }),
      isEventRelevant: () => true,
      cleanup: () => Effect.void,
    }

    const bus = new EventBus()
    const coordinator = new ComponentCoordinator(bus)

    await Effect.runPromise(coordinator.registerPattern(pattern))
    await Effect.runPromise(coordinator.startCoordination('c1', 'test-pattern', ['a']))

    await Effect.runPromise(bus.publish('coord-test', testEvent()))
    expect(handled).toBe(1)

    await Effect.runPromise(coordinator.stopCoordination('c1'))

    // After stop, the unsubscribe effects must have run: no more handling.
    await Effect.runPromise(bus.publish('coord-test', testEvent()))
    expect(handled).toBe(1)

    const active = await Effect.runPromise(coordinator.getActiveCoordinations())
    expect(active).toHaveLength(0)
  })
})
