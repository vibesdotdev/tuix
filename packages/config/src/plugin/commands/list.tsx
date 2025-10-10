/** @jsxImportSource @tuix/jsx */

/**
 * Config List Command
 *
 * List all configuration values
 */

import { Command } from '@tuix/jsx'
import { Effect } from 'effect'
import { StorageService } from '@tuix/storage'
import { LiveServices } from '@tuix/core/services/live'

export interface ConfigListProps {
  filename: string
  format: string
}

export default async function ConfigList({ filename, format }: ConfigListProps) {
  const program = Effect.gen(function* (_) {
    const storage = yield* _(StorageService)
    const keys = yield* _(storage.keys('config.'))

    if (keys.length === 0) {
      return (
        <vstack>
          <text color="yellow">No configuration values found</text>
        </vstack>
      )
    }

    const entries = yield* _(
      Effect.all(
        keys.map(key =>
          storage.get(key).pipe(
            Effect.map(value => ({ key: key.replace('config.', ''), value }))
          )
        )
      )
    )

    return (
      <vstack>
        <text color="cyan" bold>Configuration Values:</text>
        <text></text>
        {entries.map(({ key, value }) => (
          <hstack key={key}>
            <text color="blue" style={{ width: 30 }}>{key}</text>
            <text color="green">{JSON.stringify(value)}</text>
          </hstack>
        ))}
      </vstack>
    )
  })

  const result = await Effect.runPromise(program.pipe(Effect.provide(LiveServices)))

  return (
    <Command name="list" description="List all config values">
      {result}
    </Command>
  )
}
