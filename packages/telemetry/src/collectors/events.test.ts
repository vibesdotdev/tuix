/**
 * Event Collector Tests
 */

import { test, expect, describe } from 'bun:test'
import { Effect } from 'effect'
import { EventCollector } from './events'
import { createFileTransport } from '../transports/file'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

describe('Event Collector', () => {
  test('should create event collector', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'tuix-telemetry-test-'))
    const transport = createFileTransport({ directory: tempDir })

    const collector = new EventCollector(
      {
        enabled: true,
        appName: 'test-app',
        appVersion: '1.0.0',
      },
      transport
    )

    expect(collector).toBeDefined()

    collector.stop()
    rmSync(tempDir, { recursive: true, force: true })
  })

  test('should collect events when enabled', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'tuix-telemetry-test-'))
    const transport = createFileTransport({ directory: tempDir })

    const collector = new EventCollector(
      {
        enabled: true,
        appName: 'test-app',
        appVersion: '1.0.0',
      },
      transport
    )

    await Effect.runPromise(
      collector.collectEvent({
        name: 'test-event',
        properties: { foo: 'bar' },
        timestamp: new Date(),
      })
    )

    collector.stop()
    rmSync(tempDir, { recursive: true, force: true })
  })

  test('should not collect events when disabled', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'tuix-telemetry-test-'))
    const transport = createFileTransport({ directory: tempDir })

    const collector = new EventCollector(
      {
        enabled: false,
        appName: 'test-app',
        appVersion: '1.0.0',
      },
      transport
    )

    await Effect.runPromise(
      collector.collectEvent({
        name: 'test-event',
        timestamp: new Date(),
      })
    )

    collector.stop()
    rmSync(tempDir, { recursive: true, force: true })
  })
})
