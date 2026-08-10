/**
 * Snapshot Matcher - Custom Bun test matcher for snapshots
 */

import { serialize, defaultSerializers, type Serializer } from './serializer'
import { createSnapshotStorage, type SnapshotStorage } from './storage'

/**
 * Snapshot matcher configuration
 */
export interface SnapshotConfig {
  /**
   * Update snapshots mode (set via UPDATE_SNAPSHOTS env var)
   */
  updateSnapshots?: boolean

  /**
   * Custom serializers
   */
  serializers?: Serializer[]

  /**
   * Snapshot storage implementation
   */
  storage?: SnapshotStorage
}

/**
 * Global snapshot configuration
 */
let globalConfig: SnapshotConfig = {
  updateSnapshots:
    process.env.UPDATE_SNAPSHOTS === 'true' || process.argv.includes('--update-snapshots'),
  serializers: defaultSerializers,
  storage: createSnapshotStorage(),
}

/**
 * Configure snapshot testing globally
 */
export function configureSnapshots(config: Partial<SnapshotConfig>): void {
  globalConfig = {
    ...globalConfig,
    ...config,
  }
}

/**
 * Get current snapshot configuration
 */
export function getSnapshotConfig(): SnapshotConfig {
  return globalConfig
}

/**
 * Get the current test file path from stack trace
 */
function getCurrentTestFile(): string {
  const stack = new Error().stack || ''
  const lines = stack.split('\n')

  // Find the first line that looks like a test file
  for (const line of lines) {
    const match = line.match(/\((.+?\.(test|spec)\.(ts|tsx|js|jsx)):\d+:\d+\)/)
    if (match) {
      return match[1]
    }

    // Alternative format without parentheses
    const match2 = line.match(/at .+ \((.+?\.(test|spec)\.(ts|tsx|js|jsx)):\d+:\d+\)/)
    if (match2) {
      return match2[1]
    }
  }

  // Fallback: try to get from Bun.inspect if available
  return 'unknown-test-file.test.ts'
}

/**
 * Get the current test name from Bun's test context
 * Note: This is a simplified version - actual implementation would integrate with Bun's test API
 */
let currentTestName = 'unknown test'

/**
 * Set the current test name (called internally by test runner)
 */
export function setCurrentTestName(name: string): void {
  currentTestName = name
}

/**
 * Snapshot matcher implementation
 */
export async function toMatchSnapshot(
  received: unknown,
  testName?: string
): Promise<{ pass: boolean; message: string }> {
  const config = getSnapshotConfig()
  const storage = config.storage || createSnapshotStorage()
  const serializers = config.serializers || defaultSerializers

  // Get test context
  const testFile = getCurrentTestFile()
  const name = testName || currentTestName

  // Serialize the received value
  const receivedSnapshot = await serialize(received, serializers)

  // Check if we should update snapshots
  const updateMode = config.updateSnapshots

  // Get existing snapshot
  const existingSnapshot = storage.read(testFile, name)

  if (existingSnapshot === null) {
    // No snapshot exists
    if (updateMode) {
      // Create new snapshot
      storage.write(testFile, name, receivedSnapshot)
      return {
        pass: true,
        message: `New snapshot created for "${name}"`,
      }
    } else {
      // Fail: no snapshot in check mode
      return {
        pass: false,
        message: `No snapshot found for "${name}". Run with UPDATE_SNAPSHOTS=true to create.`,
      }
    }
  }

  // Compare with existing snapshot
  if (receivedSnapshot === existingSnapshot) {
    return {
      pass: true,
      message: `Snapshot matches for "${name}"`,
    }
  }

  // Snapshots don't match
  if (updateMode) {
    // Update snapshot
    storage.write(testFile, name, receivedSnapshot)
    return {
      pass: true,
      message: `Snapshot updated for "${name}"`,
    }
  } else {
    // Fail: mismatch in check mode
    return {
      pass: false,
      message: formatDiff(existingSnapshot, receivedSnapshot, name),
    }
  }
}

/**
 * Format a diff message for snapshot mismatch
 */
function formatDiff(expected: string, received: string, testName: string): string {
  const expectedLines = expected.split('\n')
  const receivedLines = received.split('\n')

  const diff: string[] = [`Snapshot mismatch for "${testName}"\n`]

  const maxLines = Math.max(expectedLines.length, receivedLines.length)

  for (let i = 0; i < maxLines; i++) {
    const expectedLine = expectedLines[i] || ''
    const receivedLine = receivedLines[i] || ''

    if (expectedLine !== receivedLine) {
      diff.push(`Line ${i + 1}:`)
      diff.push(`  Expected: ${expectedLine}`)
      diff.push(`  Received: ${receivedLine}`)
    }
  }

  diff.push('\nRun with UPDATE_SNAPSHOTS=true to update snapshots.')

  return diff.join('\n')
}

/**
 * Extend Bun's expect with toMatchSnapshot
 */
export function extendExpect(): void {
  // This would integrate with Bun's test API to add custom matchers
  // For now, we export the matcher function to be used manually
  // Example usage: expect(await toMatchSnapshot(value)).toBe(true)
}

/**
 * Helper function to use in tests
 */
export async function expectMatchSnapshot(received: unknown, testName?: string): Promise<void> {
  const result = await toMatchSnapshot(received, testName)
  if (!result.pass) {
    throw new Error(result.message)
  }
}
