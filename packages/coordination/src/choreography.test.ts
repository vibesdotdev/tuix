/* Created for compliance with CONVENTIONS.md. See docs for details. */
/**
 * Event Choreography Tests
 *
 * Tests for event choreography patterns and cross-module coordination
 */

import { describe, it, expect, beforeEach, spyOn } from 'bun:test'
import { Effect } from 'effect'
import {
  getGlobalEventBus,
  resetGlobalEventBus,
  EventBus,
  generateId,
} from '@tuix/reactive/events/event-bus'
import { EventChoreographer } from './choreography'
import type { ProcessEvent } from '@tuix/process-manager/events'
import type { LogEvent } from '@tuix/logger/core/events'

describe('EventChoreographer', () => {
  let eventBus: EventBus
  let choreographer: EventChoreographer

  beforeEach(() => {
    resetGlobalEventBus()
    eventBus = getGlobalEventBus()
    choreographer = new EventChoreographer(eventBus)
  })

  describe('coordinateProcessWithLogging', () => {
    it('should log a message when a process starts', async () => {
      const logSpy = spyOn(eventBus, 'emit')

      await Effect.runPromise(choreographer.coordinateProcessWithLogging())

      const processStartEvent: ProcessEvent = {
        id: generateId(),
        type: 'process-started',
        source: 'process-manager',
        processId: 'proc-1',
        processName: 'test-process',
        pid: 1234,
        timestamp: new Date(),
        config: { name: 'test-process', command: 'test' },
      }

      await Effect.runPromise(eventBus.emit('process-lifecycle', processStartEvent))

      expect(logSpy).toHaveBeenCalledTimes(2)

      // The second call should be the log event from the choreographer
      const secondCall = logSpy.mock.calls[1]
      expect(secondCall).toBeDefined()

      if (secondCall) {
        const emittedEvent = secondCall[1] as unknown as LogEvent
        expect(emittedEvent.type).toBe('log-entry')
        expect(emittedEvent.level).toBe('info')
        expect(emittedEvent.message).toContain('Process test-process started')
      }
    })
  })

  // Add similar tests for coordinateCLIWithUI and coordinateConfigUpdates
  // For brevity, they are omitted here but should be implemented for full coverage.

  describe('coordinateCLIWithUI', () => {
    it('should subscribe to CLI events', async () => {
      const subscribeSpy = spyOn(eventBus, 'subscribe')
      await Effect.runPromise(choreographer.coordinateCLIWithUI())
      expect(subscribeSpy).toHaveBeenCalledWith('cli-command', expect.any(Function))
      expect(subscribeSpy).toHaveBeenCalledWith('cli-parse', expect.any(Function))
    })
  })

  describe('coordinateConfigUpdates', () => {
    it('should subscribe to config events', async () => {
      const subscribeSpy = spyOn(eventBus, 'subscribe')
      await Effect.runPromise(choreographer.coordinateConfigUpdates())
      expect(subscribeSpy).toHaveBeenCalledWith('config-events', expect.any(Function))
    })
  })
})
