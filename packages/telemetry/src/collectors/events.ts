/**
 * Event Collector
 */

import { Effect } from 'effect'
import type {
  TelemetryEvent,
  TelemetryCollector,
  TelemetryConfig,
  TelemetryTransport,
  TelemetryError as TelemetryErrorType,
} from '../types'

export class EventCollector {
  private events: TelemetryEvent[] = []
  private sessionId: string
  private flushTimer?: Timer

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

  collectEvent(event: TelemetryEvent): Effect.Effect<void, TelemetryErrorType> {
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

        // Add session and user info
        const enrichedEvent: TelemetryEvent = {
          ...event,
          sessionId: this.sessionId,
          userId: this.config.anonymous ? undefined : this.config.userId,
          timestamp: event.timestamp || new Date(),
        }

        this.events.push(enrichedEvent)

        // Auto-flush if batch size reached
        const batchSize = this.config.batchSize || 100
        if (this.events.length >= batchSize) {
          Effect.runPromise(this.flush()).catch(() => {
            // Ignore flush errors in auto-flush
          })
        }
      },
      catch: error => ({
        _tag: 'TelemetryError' as const,
        message: `Failed to collect event: ${error}`,
        cause: error,
      }),
    })
  }

  flush(): Effect.Effect<void, TelemetryErrorType> {
    return Effect.gen(
      function* (_) {
        if (this.events.length === 0) {
          return
        }

        const eventsToSend = [...this.events]
        this.events = []

        yield* this.transport.send(eventsToSend).pipe(
          Effect.catchAll(error =>
            Effect.sync(() => {
              // Put events back if send failed
              this.events = eventsToSend.concat(this.events)
              throw error
            })
          ),
          Effect.mapError((error: any) => ({
            _tag: 'TelemetryError' as const,
            message: `Failed to flush events: ${error.message || error}`,
            cause: error,
          }))
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
