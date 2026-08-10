/**
 * HTTP Transport
 */

import { Effect } from 'effect'
import type {
  TelemetryTransport,
  TelemetryEvent,
  TelemetryError,
  TelemetryPerformance,
  HttpTransportConfig,
  TransportError,
} from '../types'

export class HttpTransport implements TelemetryTransport {
  constructor(private config: HttpTransportConfig) {}

  send(events: TelemetryEvent[]): Effect.Effect<void, TransportError> {
    return Effect.tryPromise({
      try: async () => {
        const controller = new AbortController()
        const timeout = this.config.timeout || 5000

        const timeoutId = setTimeout(() => controller.abort(), timeout)

        try {
          const response = await fetch(`${this.config.endpoint}/events`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...this.config.headers,
            },
            body: JSON.stringify({ events }),
            signal: controller.signal,
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
        } finally {
          clearTimeout(timeoutId)
        }
      },
      catch: error => ({
        _tag: 'TransportError' as const,
        message: `Failed to send events via HTTP: ${error}`,
        cause: error,
      }),
    })
  }

  sendErrors(errors: TelemetryError[]): Effect.Effect<void, TransportError> {
    return Effect.tryPromise({
      try: async () => {
        const controller = new AbortController()
        const timeout = this.config.timeout || 5000

        const timeoutId = setTimeout(() => controller.abort(), timeout)

        try {
          const response = await fetch(`${this.config.endpoint}/errors`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...this.config.headers,
            },
            body: JSON.stringify({ errors }),
            signal: controller.signal,
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
        } finally {
          clearTimeout(timeoutId)
        }
      },
      catch: error => ({
        _tag: 'TransportError' as const,
        message: `Failed to send errors via HTTP: ${error}`,
        cause: error,
      }),
    })
  }

  sendPerformance(metrics: TelemetryPerformance[]): Effect.Effect<void, TransportError> {
    return Effect.tryPromise({
      try: async () => {
        const controller = new AbortController()
        const timeout = this.config.timeout || 5000

        const timeoutId = setTimeout(() => controller.abort(), timeout)

        try {
          const response = await fetch(`${this.config.endpoint}/performance`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...this.config.headers,
            },
            body: JSON.stringify({ metrics }),
            signal: controller.signal,
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
        } finally {
          clearTimeout(timeoutId)
        }
      },
      catch: error => ({
        _tag: 'TransportError' as const,
        message: `Failed to send performance metrics via HTTP: ${error}`,
        cause: error,
      }),
    })
  }

  flush(): Effect.Effect<void, TransportError> {
    // HTTP transport flushes immediately, nothing to do
    return Effect.succeed(undefined)
  }
}

/**
 * Create HTTP transport
 */
export function createHttpTransport(config: HttpTransportConfig): TelemetryTransport {
  return new HttpTransport(config)
}
