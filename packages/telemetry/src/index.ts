/**
 * @tuix/telemetry - Opt-in telemetry and analytics
 */

// Types
export type {
  TelemetryEvent,
  TelemetryError,
  TelemetryPerformance,
  TelemetryConfig,
  TelemetryCollector,
  TelemetryTransport,
  TransportError,
  HttpTransportConfig,
  FileTransportConfig,
} from './types'

// Collectors
export { EventCollector, ErrorCollector, PerformanceCollector } from './collectors'

// Transports
export { HttpTransport, createHttpTransport, FileTransport, createFileTransport } from './transports'

// Plugin
export { Telemetry } from './plugin'
export type { TelemetryProps, TelemetryModel, TelemetryMsg } from './plugin'
