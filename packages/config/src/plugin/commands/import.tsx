/** @jsxImportSource @tuix/jsx */

/**
 * Config Import Command
 *
 * Import configuration from a file
 */

import { Command } from '@tuix/jsx'
import { Effect } from 'effect'
import { StorageService } from '@tuix/storage'
import { LiveServices } from '@tuix/core/services/live'
import { loadConfigFile } from '../../storage/formats'

export interface ConfigImportProps {
  filename: string
  format: string
}

export default async function ConfigImport({ filename, format }: ConfigImportProps) {
  // Get file path from args (e.g., `config import myconfig.json`)
  const args = process.argv.slice(3)
  const filePath = args[0] || filename

  const program = Effect.gen(function* (_) {
    const storage = yield* _(StorageService)

    // Load config from file
    const config = yield* _(loadConfigFile(filePath))

    // Flatten and store each key
    const flatten = (obj: any, prefix = ''): Array<[string, any]> => {
      const entries: Array<[string, any]> = []
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          entries.push(...flatten(value, fullKey))
        } else {
          entries.push([fullKey, value])
        }
      }
      return entries
    }

    const entries = flatten(config)

    // Store all entries
    yield* _(Effect.all(entries.map(([key, value]) => storage.set(`config.${key}`, value))))

    return (
      <vstack>
        <text color="green">✓ Config imported from {filePath}</text>
        <text color="cyan">{entries.length} values imported</text>
      </vstack>
    )
  })

  const result = await Effect.runPromise(
    program.pipe(
      Effect.provide(LiveServices),
      Effect.catchAll(error =>
        Effect.succeed(
          <vstack>
            <text color="red">✗ Failed to import config</text>
            <text color="red">{String(error)}</text>
          </vstack>
        )
      )
    )
  )

  return (
    <Command name="import" description="Import config from a file">
      {result}
    </Command>
  )
}
