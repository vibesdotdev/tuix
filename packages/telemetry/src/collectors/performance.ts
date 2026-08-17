/**
 * Performance Collector
 */

import { Effect } from 'effect'
import type {
  TelemetryPerformance,
  TelemetryConfig,
  TelemetryTransport,
  TelemetryError,
} from '../types'

export class PerformanceCollector {
  private metrics: TelemetryPerformance[] = []
  private sessionId: string
  private flushTimer?: Timer
  private activeTimers = new Map<string, number>()

  constructor(
    private config: TelemetryConfig,
    private transport: TelemetryTransport
  ) {
    this.sessionId = this.generateSessionId()
    this.startFlushTimer()
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  }

  private startFlushTimer(): void {
    const interval = this.config.flushInterval || 30000 // 30 seconds default

    this.flushTimer = setInterval(() => {
      Effect.runPromise(this.flush()).catch(error => {
        if (process.env.DEBUG) {
          console.error('[Telemetry] Flush error:', error)
        }
      })
    }, interval)
  }

  /**
   * Start timing an operation
   */
  startTiming(name: string): void {
    this.activeTimers.set(name, performance.now())
  }

  /**
   * End timing and collect metric
   */
  endTiming(name: string, metadata?: Record<string, any>): Effect.Effect<void, TelemetryError> {
    const startTime = this.activeTimers.get(name)
    if (!startTime) {
      return Effect.succeed(undefined)
    }

    this.activeTimers.delete(name)
    const duration = performance.now() - startTime

    return this.collectPerformance({
      name,
      duration,
      metadata,
      timestamp: new Date(),
      sessionId: this.sessionId,
    })
  }

  collectPerformance(metric: TelemetryPerformance): Effect.Effect<void, TelemetryError> {
    return Effect.try({
      try: () => {
        if (!this.config.enabled) {
          return
        }

        // Apply sampling
        const sampleRate = this.config.sampleRate ?? 1
        if (Math.random() > sampleRate) {
          return
        }

        // Add session info
        const enrichedMetric: TelemetryPerformance = {
          ...metric,
          sessionId: this.sessionId,
          timestamp: metric.timestamp || new Date(),
        }

        this.metrics.push(enrichedMetric)

        // Auto-flush if batch size reached
        const batchSize = this.config.batchSize || 100
        if (this.metrics.length >= batchSize) {
          Effect.runPromise(this.flush()).catch(() => {
            // Ignore flush errors in auto-flush
          })
        }
      },
      catch: error => ({
        _tag: 'TelemetryError' as const,
        message: `Failed to collect performance metric: ${error}`,
        cause: error,
      }),
    })
  }

  flush(): Effect.Effect<void, TelemetryError> {
    return Effect.gen(
      function* (_) {
        if (this.metrics.length === 0) {
          return
        }

        const metricsToSend = [...this.metrics]
        this.metrics = []

        yield* this.transport.sendPerformance(metricsToSend).pipe(
          Effect.mapError((error: any) => ({
            _tag: 'TelemetryError' as const,
            message: `Failed to flush performance metrics: ${error.message || error}`,
            cause: error,
          })),
          Effect.tapError(error =>
            // Put metrics back on failure — via the failure channel, not a die.
            Effect.sync(() => {
              this.metrics = metricsToSend.concat(this.metrics)
              return error
            })
          )
        )
      }.bind(this)
    )
  }

  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    Effect.runPromise(this.flush()).catch(() => {
      // Ignore flush errors on stop
    })
  }
}
