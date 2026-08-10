/* Moved from impl/streamOptimizer.ts. See docs for compliance. */
/**
 * Event Stream Optimizer - Performance optimization for event streams
 *
 * Provides stream optimization techniques including buffering, batching,
 * throttling, deduplication, and smart filtering for high-frequency events.
 */

import { Effect, Queue, Duration } from 'effect'
import { EventBus } from '@tuix/core/events'
import type { BaseEvent } from '@tuix/core/events'

/**
 * Stream optimization error
 */
export class StreamOptimizationError {
  readonly _tag = 'StreamOptimizationError'
  constructor(
    readonly message: string,
    readonly channel?: string,
    readonly cause?: unknown
  ) {}
}

/**
 * UI update event interface
 */
export interface UIUpdateEvent extends BaseEvent {
  readonly type: 'ui-update'
  readonly componentId?: string
  readonly updateType: 'state' | 'props' | 'style'
  readonly payload: unknown
}

/**
 * Relevance criteria for event filtering
 */
export interface RelevanceCriteria<T extends BaseEvent> {
  filter?: (event: T) => boolean
  maxAge?: Duration.Duration
  priority?: 'low' | 'medium' | 'high'
}

/**
 * Event Stream Optimizer implementation
 */
export class EventStreamOptimizer {
  private bufferSizes = new Map<string, number>()
  private rateLimits = new Map<string, number>()
  private lastEventCache = new Map<string, BaseEvent>()
  private eventBus: EventBus

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus
  }

  configureBufferSize(channel: string, size: number): Effect.Effect<void, StreamOptimizationError> {
    return Effect.sync(() => {
      this.bufferSizes.set(channel, size)
    })
  }

  configureRateLimit(channel: string, limit: number): Effect.Effect<void, StreamOptimizationError> {
    return Effect.sync(() => {
      this.rateLimits.set(channel, limit)
    })
  }

  getOptimizationStats(): Effect.Effect<OptimizationStats, never> {
    return Effect.succeed({
      bufferSizes: this.bufferSizes,
      rateLimits: this.rateLimits,
      cachedEvents: this.lastEventCache.size,
      channels: [...new Set([...this.bufferSizes.keys(), ...this.rateLimits.keys()])],
    })
  }
}

/**
 * Optimization statistics
 */
export interface OptimizationStats {
  bufferSizes: Map<string, number>
  rateLimits: Map<string, number>
  cachedEvents: number
  channels: string[]
}
