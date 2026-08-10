/**
 * Snapshot Testing Tests
 */

import { test, expect, describe, beforeEach } from 'bun:test'
import {
  serialize,
  normalizeOutput,
  stripAnsiCodes,
  ViewSerializer,
  StringSerializer,
} from './serializer'
import { FileSnapshotStorage } from './storage'
import { toMatchSnapshot, configureSnapshots, setCurrentTestName } from './matcher'
import { text } from '@tuix/view'
import { mkdirSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'

describe('Snapshot Serializer', () => {
  test('serializes plain strings', async () => {
    const result = await serialize('Hello World')
    expect(result).toBe('Hello World')
  })

  test('serializes View components', async () => {
    const view = text('Test View')
    const result = await serialize(view)
    expect(result).toBe('Test View')
  })

  test('strips ANSI codes by default', () => {
    const input = '\x1b[1mBold\x1b[0m \x1b[2mDim\x1b[0m'
    const result = normalizeOutput(input)
    expect(result).toBe('Bold Dim')
  })

  test('preserves ANSI codes when configured', () => {
    const input = '\x1b[1mBold\x1b[0m'
    const result = normalizeOutput(input, { stripAnsi: false })
    expect(result).toBe('\x1b[1mBold\x1b[0m')
  })

  test('normalizes line endings', () => {
    const input = 'Line 1\r\nLine 2\r\nLine 3'
    const result = normalizeOutput(input)
    expect(result).toBe('Line 1\nLine 2\nLine 3')
  })

  test('trims trailing whitespace', () => {
    const input = 'Line 1   \nLine 2  \nLine 3 '
    const result = normalizeOutput(input)
    expect(result).toBe('Line 1\nLine 2\nLine 3')
  })

  test('ViewSerializer detects View objects', () => {
    const view = text('Test')
    expect(ViewSerializer.test(view)).toBe(true)
    expect(ViewSerializer.test('string')).toBe(false)
    expect(ViewSerializer.test(123)).toBe(false)
  })

  test('StringSerializer detects strings', () => {
    expect(StringSerializer.test('string')).toBe(true)
    expect(StringSerializer.test(123)).toBe(false)
    expect(StringSerializer.test({})).toBe(false)
  })
})

describe('Snapshot Storage', () => {
  const testDir = join(process.cwd(), 'packages/testing/src/snapshot/__test_snapshots__')
  const testFile = join(testDir, '../test.test.ts')

  beforeEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true })
    }
  })

  test('creates snapshot directory if it does not exist', () => {
    const storage = new FileSnapshotStorage('__test_snapshots__')
    storage.write(testFile, 'test 1', 'snapshot content')

    expect(existsSync(testDir)).toBe(true)
  })

  test('writes and reads snapshots', () => {
    const storage = new FileSnapshotStorage('__test_snapshots__')
    const content = 'Test snapshot content'

    storage.write(testFile, 'test 1', content)
    const read = storage.read(testFile, 'test 1')

    expect(read).toBe(content)
  })

  test('returns null for non-existent snapshots', () => {
    const storage = new FileSnapshotStorage('__test_snapshots__')
    const read = storage.read(testFile, 'non-existent')

    expect(read).toBe(null)
  })

  test('checks if snapshot exists', () => {
    const storage = new FileSnapshotStorage('__test_snapshots__')

    expect(storage.exists(testFile, 'test 1')).toBe(false)

    storage.write(testFile, 'test 1', 'content')

    expect(storage.exists(testFile, 'test 1')).toBe(true)
  })

  test('stores multiple snapshots in same file', () => {
    const storage = new FileSnapshotStorage('__test_snapshots__')

    storage.write(testFile, 'test 1', 'content 1')
    storage.write(testFile, 'test 2', 'content 2')
    storage.write(testFile, 'test 3', 'content 3')

    expect(storage.read(testFile, 'test 1')).toBe('content 1')
    expect(storage.read(testFile, 'test 2')).toBe('content 2')
    expect(storage.read(testFile, 'test 3')).toBe('content 3')
  })

  test('updates existing snapshots', () => {
    const storage = new FileSnapshotStorage('__test_snapshots__')

    storage.write(testFile, 'test 1', 'original content')
    storage.write(testFile, 'test 1', 'updated content')

    expect(storage.read(testFile, 'test 1')).toBe('updated content')
  })
})

describe('Snapshot Matcher', () => {
  const testDir = join(process.cwd(), 'packages/testing/src/snapshot/__test_snapshots__')

  beforeEach(() => {
    // Clean up and configure
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true })
    }

    configureSnapshots({
      updateSnapshots: false,
      storage: new FileSnapshotStorage('__test_snapshots__'),
    })
  })

  test('creates new snapshot in update mode', async () => {
    configureSnapshots({ updateSnapshots: true })
    setCurrentTestName('creates new snapshot')

    const result = await toMatchSnapshot('Test content')

    expect(result.pass).toBe(true)
    expect(result.message).toContain('New snapshot created')
  })

  test('matches existing snapshot', async () => {
    configureSnapshots({ updateSnapshots: true })
    setCurrentTestName('matches existing snapshot')

    // Create snapshot
    await toMatchSnapshot('Test content')

    // Switch to check mode
    configureSnapshots({ updateSnapshots: false })

    // Should match
    const result = await toMatchSnapshot('Test content')

    expect(result.pass).toBe(true)
  })

  test('fails when snapshot does not exist in check mode', async () => {
    configureSnapshots({ updateSnapshots: false })
    setCurrentTestName('non-existent snapshot')

    const result = await toMatchSnapshot('Test content')

    expect(result.pass).toBe(false)
    expect(result.message).toContain('No snapshot found')
  })

  test('fails when snapshot does not match', async () => {
    configureSnapshots({ updateSnapshots: true })
    setCurrentTestName('mismatched snapshot')

    // Create snapshot
    await toMatchSnapshot('Original content')

    // Switch to check mode
    configureSnapshots({ updateSnapshots: false })

    // Try different content
    const result = await toMatchSnapshot('Different content')

    expect(result.pass).toBe(false)
    expect(result.message).toContain('Snapshot mismatch')
  })

  test('updates snapshot in update mode', async () => {
    configureSnapshots({ updateSnapshots: true })
    setCurrentTestName('updates snapshot')

    // Create original
    await toMatchSnapshot('Original')

    // Update
    const result = await toMatchSnapshot('Updated')

    expect(result.pass).toBe(true)
    expect(result.message).toContain('Snapshot updated')
  })
})
