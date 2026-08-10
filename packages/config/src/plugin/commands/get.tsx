/** @jsxImportSource @tuix/jsx */

/**
 * Config Get Command (Async)
 *
 * Get a configuration value - uses async/await
 */

import { Command } from '@tuix/jsx'
import { Effect } from 'effect'
import { StorageService } from '@tuix/storage'
import { LiveServices } from '@tuix/core/services/live'

export interface ConfigGetProps {
  filename: string
  format: string
}

export default async function ConfigGet({ filename, format }: ConfigGetProps) {
  // Get key from args (e.g., `config get server.port`)
  const args = process.argv.slice(3)
  const key = args[0]

  if (!key) {
    return (
      <Command name="get" description="Get a config value">
        <vstack>
          <text color="red">Error: No key specified</text>
          <text>Usage: config get &lt;key&gt;</text>
          <text>Example: config get server.port</text>
        </vstack>
      </Command>
    )
  }

  // Async Effect execution
  const program = Effect.gen(function* (_) {
    const storage = yield* _(StorageService)
    const storageKey = `config.${key}`
    const value = yield* _(storage.get(storageKey))

    if (value === undefined || value === null) {
      return (
        <vstack>
          <text color="yellow">Config key not found: {key}</text>
        </vstack>
      )
    }

    return (
      <vstack>
        <text color="cyan" bold>
          {key}
        </text>
        <text color="green">{JSON.stringify(value, null, 2)}</text>
      </vstack>
    )
  })

  const result = await Effect.runPromise(program.pipe(Effect.provide(LiveServices)))

  return (
    <Command name="get" description="Get a config value">
      {result}
    </Command>
  )
}
