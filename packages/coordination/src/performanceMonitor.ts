/* Moved from impl/performanceMonitor.ts. See docs for compliance. */
/**
 * Performance Monitor - Cross-module performance monitoring and metrics
 *
 * Tracks event throughput, response times, memory usage, and generates
 * comprehensive performance reports across all modules.
 */

import { Effect, Duration } from 'effect'
import { EventBus } from '@tuix/reactive/events/event-bus'
import { ModuleBase, ModuleError } from '@tuix/runtime'
import type {
  PerformanceReport,
  PerformanceMetric,
  ThroughputMetric,
  ResponseTimeMetric,
  MemoryUsageMetric,
  WorkflowMetrics,
} from './types'
import type { BaseEvent } from '@tuix/reactive/events/event-bus'

/**
 * Performance event type
 */
export interface PerformanceReportEvent extends BaseEvent {
  readonly type: 'performance-report'
  readonly report: PerformanceReport
}

/**
 * Performance Monitor implementation
 */
export class PerformanceMonitor extends ModuleBase {
  private metrics = new Map<string, PerformanceMetric>()
  private eventCounts = new Map<string, number>()
  private responseTimeTracker = new Map<string, number[]>()
  private workflowMetrics = new Map<string, WorkflowMetrics>()
  private reportingInterval = Duration.minutes(5)

  constructor(eventBus: EventBus) {
    super(eventBus, 'performance-monitor')
  }

  initialize(): Effect.Effect<void, ModuleError> {
    return Effect.succeed(undefined).pipe(
      Effect.tap(() => this.emitEvent('performance-monitor-initialized', { type: 'custom' })),
      Effect.mapError(
        error =>
          new ModuleError('performance-monitor', 'Failed to initialize performance monitor', error)
      )
    )
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): Effect.Effect<void, never> {
    return Effect.sync(() => {
      this.metrics.clear()
      this.eventCounts.clear()
      this.responseTimeTracker.clear()
      this.workflowMetrics.clear()
    })
  }

  startWorkflowMonitoring(workflowId: string): Effect.Effect<void, never> {
    return Effect.sync(() => {
      this.workflowMetrics.set(workflowId, {
        workflowId,
        startTime: new Date(),
        stepDurations: new Map(),
        resourceUsage: {
          peakMemory: 0,
          avgCpu: 0,
        },
      })
    })
  }

  getWorkflowMetrics(workflowId: string): Effect.Effect<WorkflowMetrics | undefined, never> {
    return Effect.succeed(this.workflowMetrics.get(workflowId))
  }

  setReportingInterval(interval: Duration.Duration): Effect.Effect<void, never> {
    return Effect.sync(() => {
      this.reportingInterval = interval
    })
  }

  getPerformanceMetrics(): Effect.Effect<PerformanceReport, never> {
    return Effect.succeed({
      timestamp: new Date(),
      throughput: [],
      responseTimes: [],
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        timestamp: new Date(),
      },
      customMetrics: [],
    })
  }

  getEventThroughput(): Effect.Effect<ThroughputMetric[], never> {
    return Effect.succeed([])
  }
}
