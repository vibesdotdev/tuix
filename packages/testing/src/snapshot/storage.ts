/**
 * Snapshot Storage - Manages snapshot files on disk
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

/**
 * Snapshot storage interface
 */
export interface SnapshotStorage {
  /**
   * Read a snapshot from disk
   */
  read(testFile: string, testName: string): string | null

  /**
   * Write a snapshot to disk
   */
  write(testFile: string, testName: string, content: string): void

  /**
   * Check if a snapshot exists
   */
  exists(testFile: string, testName: string): boolean

  /**
   * Get the snapshot file path
   */
  getSnapshotPath(testFile: string): string
}

/**
 * Default snapshot storage implementation
 */
export class FileSnapshotStorage implements SnapshotStorage {
  constructor(private readonly snapshotDir = '__snapshots__') {}

  getSnapshotPath(testFile: string): string {
    const dir = dirname(testFile)
    const snapshotDir = join(dir, this.snapshotDir)
    const filename = testFile.split('/').pop()?.replace(/\.(test|spec)\.(ts|tsx|js|jsx)$/, '')
    return join(snapshotDir, `${filename}.snap`)
  }

  read(testFile: string, testName: string): string | null {
    const snapshotPath = this.getSnapshotPath(testFile)

    if (!existsSync(snapshotPath)) {
      return null
    }

    try {
      const content = readFileSync(snapshotPath, 'utf-8')
      const snapshots = this.parseSnapshotFile(content)
      return snapshots[testName] || null
    } catch (error) {
      if (process.env.DEBUG) {
        console.error(`[Snapshot] Failed to read snapshot from ${snapshotPath}:`, error)
      }
      return null
    }
  }

  write(testFile: string, testName: string, content: string): void {
    const snapshotPath = this.getSnapshotPath(testFile)
    const snapshotDir = dirname(snapshotPath)

    // Ensure snapshot directory exists
    if (!existsSync(snapshotDir)) {
      mkdirSync(snapshotDir, { recursive: true })
    }

    // Read existing snapshots
    let snapshots: Record<string, string> = {}
    if (existsSync(snapshotPath)) {
      try {
        const existing = readFileSync(snapshotPath, 'utf-8')
        snapshots = this.parseSnapshotFile(existing)
      } catch (error) {
        if (process.env.DEBUG) {
          console.error(`[Snapshot] Failed to parse existing snapshots, starting fresh:`, error)
        }
        // Start fresh if file is corrupted
      }
    }

    // Update snapshot
    snapshots[testName] = content

    // Write back to disk
    const serialized = this.serializeSnapshots(snapshots)
    writeFileSync(snapshotPath, serialized, 'utf-8')
  }

  exists(testFile: string, testName: string): boolean {
    return this.read(testFile, testName) !== null
  }

  /**
   * Parse snapshot file content into map
   */
  private parseSnapshotFile(content: string): Record<string, string> {
    const snapshots: Record<string, string> = {}
    const lines = content.split('\n')
    let currentTest: string | null = null
    let currentSnapshot: string[] = []
    let inSnapshot = false

    for (const line of lines) {
      // Check for test header: exports[`test name`] = `
      const headerMatch = line.match(/^exports\[`(.+?)`\] = `$/)
      if (headerMatch) {
        // Save previous snapshot if exists
        if (currentTest && currentSnapshot.length > 0) {
          snapshots[currentTest] = currentSnapshot.join('\n')
        }

        currentTest = headerMatch[1]
        currentSnapshot = []
        inSnapshot = true
        continue
      }

      // Check for snapshot end: `;
      if (line === '`;' && inSnapshot) {
        if (currentTest) {
          snapshots[currentTest] = currentSnapshot.join('\n')
        }
        currentTest = null
        currentSnapshot = []
        inSnapshot = false
        continue
      }

      // Collect snapshot content
      if (inSnapshot && currentTest) {
        currentSnapshot.push(line)
      }
    }

    return snapshots
  }

  /**
   * Serialize snapshots to file format
   */
  private serializeSnapshots(snapshots: Record<string, string>): string {
    const lines: string[] = []

    // Sort by test name for consistent output
    const testNames = Object.keys(snapshots).sort()

    for (const testName of testNames) {
      const content = snapshots[testName]
      lines.push(`exports[\`${testName}\`] = \``)
      lines.push(content)
      lines.push('`;')
      lines.push('') // Empty line between snapshots
    }

    return lines.join('\n')
  }
}

/**
 * Create default snapshot storage
 */
export const createSnapshotStorage = (): SnapshotStorage => {
  return new FileSnapshotStorage()
}
