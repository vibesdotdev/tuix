/**
 * File Transport
 */

import { Effect } from 'effect'
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import type {
  TelemetryTransport,
  TelemetryEvent,
  TelemetryError,
  TelemetryPerformance,
  FileTransportConfig,
  TransportError,
} from '../types'

export class FileTransport implements TelemetryTransport {
  constructor(private config: FileTransportConfig) {
    this.ensureDirectory()
  }

  private ensureDirectory(): void {
    if (!existsSync(this.config.directory)) {
      mkdirSync(this.config.directory, { recursive: true })
    }
  }

  private getFilePath(type: 'events' | 'errors' | 'performance'): string {
    const pattern = this.config.filePattern || 'telemetry-{type}-{date}.ndjson'
    const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const filename = pattern.replace('{type}', type).replace('{date}', date)
    return join(this.config.directory, filename)
  }

  private async appendToFile(filePath: string, data: any[]): Promise<void> {
    // Write as newline-delimited JSON
    const lines = data.map(item => JSON.stringify(item)).join('\n') + '\n'
    await Bun.write(filePath, lines, { createPath: true, append: true })

    // Check file size and rotate if needed
    await this.rotateIfNeeded(filePath)
  }

  private async rotateIfNeeded(filePath: string): Promise<void> {
    const maxFileSize = this.config.maxFileSize || 10 * 1024 * 1024 // 10MB default

    try {
      const stats = statSync(filePath)
      if (stats.size > maxFileSize) {
        // Rotate: rename current file with timestamp
        const timestamp = Date.now()
        const rotatedPath = `${filePath}.${timestamp}`
        await Bun.write(rotatedPath, await Bun.file(filePath).text())
        await Bun.write(filePath, '')

        // Clean up old files
        await this.cleanupOldFiles()
      }
    } catch (error) {
      // File might not exist yet, that's ok
    }
  }

  private async cleanupOldFiles(): Promise<void> {
    const maxFiles = this.config.maxFiles || 10

    try {
      const files = readdirSync(this.config.directory)
        .map(filename => ({
          filename,
          path: join(this.config.directory, filename),
          mtime: statSync(join(this.config.directory, filename)).mtime.getTime(),
        }))
        .sort((a, b) => b.mtime - a.mtime) // Sort by modification time, newest first

      // Remove old files
      if (files.length > maxFiles) {
        for (const file of files.slice(maxFiles)) {
          try {
            unlinkSync(file.path)
          } catch (error) {
            // Ignore errors when deleting
          }
        }
      }
    } catch (error) {
      // Ignore directory read errors
    }
  }

  send(events: TelemetryEvent[]): Effect.Effect<void, TransportError> {
    return Effect.tryPromise({
      try: async () => {
        const filePath = this.getFilePath('events')
        await this.appendToFile(filePath, events)
      },
      catch: error => ({
        _tag: 'TransportError' as const,
        message: `Failed to write events to file: ${error}`,
        cause: error,
      }),
    })
  }

  sendErrors(errors: TelemetryError[]): Effect.Effect<void, TransportError> {
    return Effect.tryPromise({
      try: async () => {
        const filePath = this.getFilePath('errors')
        await this.appendToFile(filePath, errors)
      },
      catch: error => ({
        _tag: 'TransportError' as const,
        message: `Failed to write errors to file: ${error}`,
        cause: error,
      }),
    })
  }

  sendPerformance(metrics: TelemetryPerformance[]): Effect.Effect<void, TransportError> {
    return Effect.tryPromise({
      try: async () => {
        const filePath = this.getFilePath('performance')
        await this.appendToFile(filePath, metrics)
      },
      catch: error => ({
        _tag: 'TransportError' as const,
        message: `Failed to write performance metrics to file: ${error}`,
        cause: error,
      }),
    })
  }

  flush(): Effect.Effect<void, TransportError> {
    // File writes are immediate, nothing to flush
    return Effect.succeed(undefined)
  }
}

/**
 * Create file transport
 */
export function createFileTransport(config: FileTransportConfig): TelemetryTransport {
  return new FileTransport(config)
}
