/** @jsxImportSource @tuix/jsx */

/**
 * Config Export Command
 *
 * Export configuration to a file
 */

import { Command } from '@tuix/jsx'
import { Effect } from 'effect'
import { StorageService } from '@tuix/storage'
import { LiveServices } from '@tuix/core/services/live'
import { saveConfigFile } from '../../storage/formats'

export interface ConfigExportProps {
  filename: string
  format: string
}

export default async function ConfigExport({ filename, format }: ConfigExportProps) {
  // Get file path from args (e.g., `config export myconfig.json`)
  const args = process.argv.slice(3)
  const filePath = args[0] || filename

  const program = Effect.gen(function* (_) {
    const storage = yield* _(StorageService)

    // Get all config keys
    const keys = yield* _(storage.keys('config.'))

    // Load all values
    const entries = yield* _(
      Effect.all(
        keys.map(key =>
          storage.get(key).pipe(
            Effect.map(value => [key.replace('config.', ''), value] as const)
          )
        )
      )
    )

    // Unflatten into nested object
    const unflatten = (entries: Array<readonly [string, any]>): Record<string, any> => {
      const result: Record<string, any> = {}
      for (const [key, value] of entries) {
        const parts = key.split('.')
        let current = result
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i]
          if (!(part in current)) {
            current[part] = {}
          }
          current = current[part]
        }
        current[parts[parts.length - 1]] = value
      }
      return result
    }

    const config = unflatten(entries)

    // Save to file
    yield* _(saveConfigFile(filePath, config))

    return (
      <vstack>
        <text color="green">✓ Config exported to {filePath}</text>
        <text color="cyan">{entries.length} values exported</text>
      </vstack>
    )
  })

  const result = await Effect.runPromise(
    program.pipe(
      Effect.provide(LiveServices),
      Effect.catchAll(error =>
        Effect.succeed(
          <vstack>
            <text color="red">✗ Failed to export config</text>
            <text color="red">{String(error)}</text>
          </vstack>
        )
      )
    )
  )

  return (
    <Command name="export" description="Export config to a file">
      {result}
    </Command>
  )
}
