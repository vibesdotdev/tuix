/**
 * Snapshot Command - Manage test snapshots
 */

import { vstack, text, box, bold, dim, green, red, yellow } from '@tuix/view'
import type { Component, Cmd } from '@tuix/core/types'
import { Effect } from 'effect'
import { readdirSync, statSync, readFileSync, unlinkSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * Snapshot command props
 */
export interface SnapshotProps {
  action: 'list' | 'update' | 'clean'
  pattern?: string
}

/**
 * Snapshot info
 */
interface SnapshotInfo {
  testFile: string
  snapshotFile: string
  testCount: number
  size: number
  modified: Date
}

/**
 * Snapshot model
 */
interface SnapshotModel {
  props: SnapshotProps
  snapshots: SnapshotInfo[]
  status: 'loading' | 'ready' | 'updating' | 'cleaning' | 'complete' | 'error'
  error?: string
  message?: string
}

/**
 * Snapshot messages
 */
type SnapshotMsg =
  | { _tag: 'Load' }
  | { _tag: 'LoadComplete'; snapshots: SnapshotInfo[] }
  | { _tag: 'Update' }
  | { _tag: 'UpdateComplete'; count: number }
  | { _tag: 'Clean' }
  | { _tag: 'CleanComplete'; count: number }
  | { _tag: 'Error'; error: string }

/**
 * Count tests in a snapshot file
 */
function countTestsInSnapshot(snapshotPath: string): number {
  try {
    const content = readFileSync(snapshotPath, 'utf-8')
    // Count exports[`...`] patterns
    const matches = content.match(/exports\[`/g)
    return matches ? matches.length : 0
  } catch (error) {
    return 0
  }
}

/**
 * Discover snapshot files
 */
function discoverSnapshots(cwd: string = process.cwd()): SnapshotInfo[] {
  const snapshots: SnapshotInfo[] = []

  function scan(dir: string) {
    try {
      const entries = readdirSync(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = join(dir, entry.name)

        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue
        }

        if (entry.isDirectory()) {
          if (entry.name === '__snapshots__') {
            // Found a snapshot directory
            const snapshotFiles = readdirSync(fullPath)

            for (const snapFile of snapshotFiles) {
              if (snapFile.endsWith('.snap')) {
                const snapPath = join(fullPath, snapFile)
                const stats = statSync(snapPath)

                // Infer test file name
                const testFile = snapFile.replace('.snap', '.test.ts')
                const testPath = join(dir, testFile)

                snapshots.push({
                  testFile: relative(cwd, testPath),
                  snapshotFile: relative(cwd, snapPath),
                  testCount: countTestsInSnapshot(snapPath),
                  size: stats.size,
                  modified: stats.mtime,
                })
              }
            }
          } else {
            scan(fullPath)
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  scan(cwd)
  return snapshots.sort((a, b) => a.testFile.localeCompare(b.testFile))
}

/**
 * Snapshot Component
 */
export const Snapshot: Component<SnapshotModel, SnapshotMsg> = {
  init: Effect.gen(function* (_) {
    const args = process.argv.slice(3)
    const action = (args[0] || 'list') as 'list' | 'update' | 'clean'
    const pattern = args[1]

    return [
      {
        props: { action, pattern },
        snapshots: [],
        status: 'loading',
      },
      [loadSnapshots()],
    ]
  }),

  update: (msg, model) =>
    Effect.gen(function* (_) {
      switch (msg._tag) {
        case 'Load':
          return [{ ...model, status: 'loading' }, [loadSnapshots()]]

        case 'LoadComplete':
          if (model.props.action === 'list') {
            return [
              {
                ...model,
                status: 'complete',
                snapshots: msg.snapshots,
              },
              [],
            ]
          } else if (model.props.action === 'update') {
            return [
              {
                ...model,
                status: 'updating',
                snapshots: msg.snapshots,
              },
              [updateSnapshots(msg.snapshots)],
            ]
          } else if (model.props.action === 'clean') {
            return [
              {
                ...model,
                status: 'cleaning',
                snapshots: msg.snapshots,
              },
              [cleanOrphanedSnapshots(msg.snapshots)],
            ]
          }
          return [{ ...model, snapshots: msg.snapshots }, []]

        case 'Update':
          return [{ ...model, status: 'updating' }, [updateSnapshots(model.snapshots)]]

        case 'UpdateComplete':
          return [
            {
              ...model,
              status: 'complete',
              message: `Updated ${msg.count} snapshot files`,
            },
            [],
          ]

        case 'Clean':
          return [{ ...model, status: 'cleaning' }, [cleanOrphanedSnapshots(model.snapshots)]]

        case 'CleanComplete':
          return [
            {
              ...model,
              status: 'complete',
              message: msg.count > 0 ? `Cleaned ${msg.count} orphaned snapshots` : 'No orphaned snapshots found',
            },
            [],
          ]

        case 'Error':
          return [
            {
              ...model,
              status: 'error',
              error: msg.error,
            },
            [],
          ]

        default:
          return [model, []]
      }
    }),

  view: model => {
    const header = box(
      vstack(
        bold(text('📸 TUIX Snapshot Manager')),
        dim(text(`Action: ${model.props.action}`)),
        model.props.pattern ? dim(text(`Pattern: ${model.props.pattern}`)) : text('')
      )
    )

    let content
    switch (model.status) {
      case 'loading':
        content = yellow(text('Loading snapshots...'))
        break

      case 'ready':
        if (model.snapshots.length === 0) {
          content = dim(text('No snapshots found'))
        } else {
          content = vstack(
            bold(text(`Found ${model.snapshots.length} snapshot files:`)),
            text(''),
            ...model.snapshots.slice(0, 15).map(snapshot =>
              vstack(
                bold(text(snapshot.testFile)),
                text(`  Snapshot: ${snapshot.snapshotFile}`),
                text(`  Tests: ${snapshot.testCount}`),
                text(`  Size: ${formatBytes(snapshot.size)}`),
                text(`  Modified: ${snapshot.modified.toLocaleDateString()}`),
                text('')
              )
            )
          )

          if (model.snapshots.length > 15) {
            content.children.push(dim(text(`... and ${model.snapshots.length - 15} more`)))
          }
        }
        break

      case 'updating':
        content = yellow(text('Updating snapshots...'))
        break

      case 'cleaning':
        content = yellow(text('Cleaning orphaned snapshots...'))
        break

      case 'complete':
        if (model.props.action === 'list') {
          if (model.snapshots.length === 0) {
            content = dim(text('No snapshots found'))
          } else {
            const totalTests = model.snapshots.reduce((sum, s) => sum + s.testCount, 0)
            const totalSize = model.snapshots.reduce((sum, s) => sum + s.size, 0)

            content = vstack(
              green(bold(text('✓ Snapshot Summary'))),
              text(''),
              text(`Files: ${model.snapshots.length}`),
              text(`Tests: ${totalTests}`),
              text(`Total Size: ${formatBytes(totalSize)}`),
              text(''),
              ...model.snapshots.slice(0, 15).map(snapshot =>
                text(`  ${snapshot.testFile} (${snapshot.testCount} tests, ${formatBytes(snapshot.size)})`)
              )
            )

            if (model.snapshots.length > 15) {
              content.children.push(dim(text(`... and ${model.snapshots.length - 15} more`)))
            }
          }
        } else {
          content = green(text(`✓ ${model.message}`))
        }
        break

      case 'error':
        content = red(text(`Error: ${model.error}`))
        break
    }

    return vstack(header, text(''), content)
  },

  subscriptions: model => Effect.succeed([]),
}

/**
 * Load snapshots command
 */
function loadSnapshots(): Cmd<SnapshotMsg> {
  return Effect.gen(function* (_) {
    try {
      const snapshots = discoverSnapshots()
      return { _tag: 'LoadComplete' as const, snapshots }
    } catch (error) {
      return {
        _tag: 'Error' as const,
        error: `Failed to load snapshots: ${error}`,
      }
    }
  })
}

/**
 * Update snapshots by running tests with UPDATE_SNAPSHOTS=true
 */
function updateSnapshots(snapshots: SnapshotInfo[]): Cmd<SnapshotMsg> {
  return Effect.gen(function* (_) {
    try {
      // Run tests with UPDATE_SNAPSHOTS=true
      const testFiles = [...new Set(snapshots.map(s => s.testFile))]

      for (const testFile of testFiles) {
        const proc = Bun.spawn(['bun', 'test', testFile], {
          env: { ...process.env, UPDATE_SNAPSHOTS: 'true' },
          stdout: 'inherit',
          stderr: 'inherit',
        })

        yield* Effect.promise(() => proc.exited)
      }

      return {
        _tag: 'UpdateComplete' as const,
        count: testFiles.length,
      }
    } catch (error) {
      return {
        _tag: 'Error' as const,
        error: `Failed to update snapshots: ${error}`,
      }
    }
  })
}

/**
 * Clean orphaned snapshots (snapshots without corresponding test files)
 */
function cleanOrphanedSnapshots(snapshots: SnapshotInfo[]): Cmd<SnapshotMsg> {
  return Effect.gen(function* (_) {
    try {
      let cleanedCount = 0

      for (const snapshot of snapshots) {
        // Check if test file exists
        try {
          statSync(join(process.cwd(), snapshot.testFile))
        } catch (error) {
          // Test file doesn't exist, remove snapshot
          try {
            unlinkSync(join(process.cwd(), snapshot.snapshotFile))
            cleanedCount++
          } catch (unlinkError) {
            // Ignore if we can't delete
          }
        }
      }

      return {
        _tag: 'CleanComplete' as const,
        count: cleanedCount,
      }
    } catch (error) {
      return {
        _tag: 'Error' as const,
        error: `Failed to clean snapshots: ${error}`,
      }
    }
  })
}

/**
 * Format bytes as human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

export default Snapshot
