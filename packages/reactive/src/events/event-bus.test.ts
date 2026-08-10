/**
 * EventBus lives in @tuix/core/events — re-export surface test.
 */
import { test, expect, describe, beforeEach, afterEach } from 'bun:test'
import { Effect } from 'effect'
import { EventBus, type BaseEvent } from '@tuix/core/events'

type Unsubscribe = () => Effect.Effect<void>

describe('EventBus (via core)', () => {
  let eventBus: EventBus

  beforeEach(() => {
    eventBus = new EventBus()
  })

  afterEach(async () => {
    await Effect.runPromise(eventBus.shutdown())
  })

  test('should publish and subscribe to events', async () => {
    let receivedEvent: BaseEvent | null = null

    const unsubscribe = (await Effect.runPromise(
      eventBus.subscribe('test-channel', (event: BaseEvent) => {
        receivedEvent = event
        return Effect.void
      })
    )) as Unsubscribe

    const event: BaseEvent = {
      type: 'test',
      timestamp: Date.now(),
      source: 'test',
    }

    await Effect.runPromise(eventBus.publish('test-channel', event))
    expect(receivedEvent).toBeDefined()
    expect(receivedEvent?.type).toBe('test')
    await Effect.runPromise(unsubscribe())
  })
})
