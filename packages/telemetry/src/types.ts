/**
 * Telemetry System Types
 */

import { Effect } from 'effect'

/**
 * Telemetry event
 */
export interface TelemetryEvent {
  /** Event name */
  name: string
  /** Event properties */
  properties?: Record<string, any>
  /** Event timestamp */
  timestamp: Date
  /** Session ID */
  sessionId?: string
  /** User ID */
  userId?: string
}

/**
 * Telemetry error event
 */
export interface TelemetryError {
  /** Error message */
  message: string
  /** Error stack trace */
  stack?: string
  /** Error context */
  context?: Record<string, any>
  /** Timestamp */
  timestamp: Date
  /** Session ID */
  sessionId?: string
  /** User ID */
  userId?: string
}

/**
 * Telemetry performance metric
 */
export interface TelemetryPerformance {
  /** Metric name */
  name: string
  /** Duration in ms */
  duration: number
  /** Additional metadata */
  metadata?: Record<string, any>
  /** Timestamp */
  timestamp: Date
  /** Session ID */
  sessionId?: string
}

/**
 * Telemetry configuration
 */
export interface TelemetryConfig {
  /** Enable telemetry (opt-in) */
  enabled?: boolean
  /** Application name */
  appName: string
  /** Application version */
  appVersion: string
  /** User ID (optional) */
  userId?: string
  /** Anonymous mode (no user tracking) */
  anonymous?: boolean
  /** Sample rate (0-1, default: 1) */
  sampleRate?: number
  /** Batch events before sending */
  batchSize?: number
  /** Flush interval in ms */
  flushInterval?: number
}

/**
 * Telemetry collector interface
 */
export interface TelemetryCollector {
  /**
   * Collect an event
   */
  collectEvent(event: TelemetryEvent): Effect.Effect<void, TelemetryError>

  /**
   * Collect an error
   */
  collectError(error: TelemetryError): Effect.Effect<void, TelemetryError>

  /**
   * Collect a performance metric
   */
  collectPerformance(metric: TelemetryPerformance): Effect.Effect<void, TelemetryError>
}

/**
 * Telemetry transport interface
 */
export interface TelemetryTransport {
  /**
   * Send events
   */
  send(events: TelemetryEvent[]): Effect.Effect<void, TransportError>

  /**
   * Send errors
   */
  sendErrors(errors: TelemetryError[]): Effect.Effect<void, TransportError>

  /**
   * Send performance metrics
   */
  sendPerformance(metrics: TelemetryPerformance[]): Effect.Effect<void, TransportError>

  /**
   * Flush pending data
   */
  flush(): Effect.Effect<void, TransportError>
}

/**
 * Telemetry error type
 */
export class TelemetryError {
  readonly _tag = 'TelemetryError'
  constructor(
    readonly message: string,
    readonly cause?: unknown
  ) {}
}

/**
 * Transport error type
 */
export class TransportError {
  readonly _tag = 'TransportError'
  constructor(
    readonly message: string,
    readonly cause?: unknown
  ) {}
}

/**
 * HTTP transport configuration
 */
export interface HttpTransportConfig {
  /** Endpoint URL */
  endpoint: string
  /** Headers */
  headers?: Record<string, string>
  /** Timeout in ms */
  timeout?: number
}

/**
 * File transport configuration
 */
export interface FileTransportConfig {
  /** Log directory */
  directory: string
  /** File name pattern */
  filePattern?: string
  /** Max file size in bytes */
  maxFileSize?: number
  /** Max files to keep */
  maxFiles?: number
}
