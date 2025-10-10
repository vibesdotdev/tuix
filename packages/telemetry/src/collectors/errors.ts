/**
 * Error Collector
 */

import { Effect } from 'effect'
import type { TelemetryError, TelemetryConfig, TelemetryTransport, TelemetryError as TelemetryErrorType } from '../types'

export class ErrorCollector {
  private errors: TelemetryError[] = []
  private sessionId: string
  private flushTimer?: Timer

  constructor(
    private config: TelemetryConfig,
    private transport: TelemetryTransport
  ) {
    this.sessionId = this.generateSessionId()
    this.startFlushTimer()
    this.setupGlobalErrorHandler()
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  }

  private startFlushTimer(): void {
    const interval = this.config.flushInterval || 30000 // 30 seconds default

    this.flushTimer = setInterval(() => {
      Effect.runPromise(this.flush()).catch((error) => {
        if (process.env.DEBUG) {
          console.error('[Telemetry] Flush error:', error)
        }
      })
    }, interval)
  }

  private setupGlobalErrorHandler(): void {
    if (typeof process !== 'undefined' && process.on) {
      process.on('uncaughtException', (error) => {
        Effect.runPromise(
          this.collectError({
            message: error.message,
            stack: error.stack,
            context: { type: 'uncaughtException' },
            timestamp: new Date(),
          })
        ).catch(() => {
          // Ignore collection errors
        })
      })

      process.on('unhandledRejection', (reason) => {
        Effect.runPromise(
          this.collectError({
            message: reason instanceof Error ? reason.message : String(reason),
            stack: reason instanceof Error ? reason.stack : undefined,
            context: { type: 'unhandledRejection' },
            timestamp: new Date(),
          })
        ).catch(() => {
          // Ignore collection errors
        })
      })
    }
  }

  collectError(error: TelemetryError): Effect.Effect<void, TelemetryErrorType> {
    return Effect.try({
      try: () => {
        if (!this.config.enabled) {
          return
        }

        // Add session and user info
        const enrichedError: TelemetryError = {
          ...error,
          sessionId: this.sessionId,
          userId: this.config.anonymous ? undefined : this.config.userId,
          timestamp: error.timestamp || new Date(),
        }

        this.errors.push(enrichedError)

        // Flush immediately for errors (they're important)
        Effect.runPromise(this.flush()).catch(() => {
          // Ignore flush errors
        })
      },
      catch: (error) => ({
        _tag: 'TelemetryError' as const,
        message: `Failed to collect error: ${error}`,
        cause: error,
      }),
    })
  }

  flush(): Effect.Effect<void, TelemetryErrorType> {
    return Effect.gen(function* (_) {
      if (this.errors.length === 0) {
        return
      }

      const errorsToSend = [...this.errors]
      this.errors = []

      yield* this.transport.sendErrors(errorsToSend).pipe(
        Effect.catchAll((error) =>
          Effect.sync(() => {
            // Put errors back if send failed
            this.errors = errorsToSend.concat(this.errors)
            throw error
          })
        ),
        Effect.mapError((error: any) => ({
          _tag: 'TelemetryError' as const,
          message: `Failed to flush errors: ${error.message || error}`,
          cause: error,
        }))
      )
    }.bind(this))
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
