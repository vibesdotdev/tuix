/** @jsxImportSource @tuix/jsx */

/**
 * Config Set Command
 *
 * Set a configuration value
 */

import { Command } from '@tuix/jsx'
import { Effect } from 'effect'
import { StorageService } from '@tuix/storage'
import { LiveServices } from '@tuix/core/services/live'

export interface ConfigSetProps {
  filename: string
  format: string
}

export default async function ConfigSet({ filename, format }: ConfigSetProps) {
  // Get key and value from args (e.g., `config set server.port 3000`)
  const args = process.argv.slice(3)
  const key = args[0]
  const rawValue = args[1]

  if (!key || rawValue === undefined) {
    return (
      <Command name="set" description="Set a config value">
        <vstack>
          <text color="red">Error: Key and value required</text>
          <text>Usage: config set &lt;key&gt; &lt;value&gt;</text>
          <text>Example: config set server.port 3000</text>
        </vstack>
      </Command>
    )
  }

  // Parse value (try JSON, fall back to string)
  let value: any = rawValue
  try {
    value = JSON.parse(rawValue)
  } catch {
    // Keep as string
  }

  const program = Effect.gen(function* (_) {
    const storage = yield* _(StorageService)
    const storageKey = `config.${key}`
    yield* _(storage.set(storageKey, value))

    return (
      <vstack>
        <text color="green">✓ Config updated</text>
        <text color="cyan">{key} = {JSON.stringify(value)}</text>
      </vstack>
    )
  })

  const result = await Effect.runPromise(program.pipe(Effect.provide(LiveServices)))

  return (
    <Command name="set" description="Set a config value">
      {result}
    </Command>
  )
}
