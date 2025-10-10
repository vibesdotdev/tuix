/**
 * File Transport Tests
 */

import { test, expect, describe, beforeEach, afterEach } from 'bun:test'
import { Effect } from 'effect'
import { createFileTransport } from './file'
import { mkdtempSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

describe('File Transport', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'tuix-telemetry-test-'))
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  test('should create file transport', () => {
    const transport = createFileTransport({ directory: tempDir })
    expect(transport).toBeDefined()
  })

  test('should create directory if not exists', () => {
    const newDir = join(tempDir, 'nested', 'dir')
    const transport = createFileTransport({ directory: newDir })

    expect(existsSync(newDir)).toBe(true)
  })

  test('should write events to file', async () => {
    const transport = createFileTransport({ directory: tempDir })

    await Effect.runPromise(
      transport.send([
        {
          name: 'test-event',
          timestamp: new Date(),
        },
      ])
    )

    // Check that file was created
    const files = await Bun.spawn(['ls', tempDir], {
      stdout: 'pipe',
    }).stdout.text()

    expect(files).toContain('telemetry-events')
  })
})
