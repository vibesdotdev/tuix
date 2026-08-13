/** @jsxImportSource @tuix/jsx */

import { Mark, StatusBar } from '@tuix/ui'

function Kit() {
  const cols = Math.max(20, process.stdout.columns ?? 120)
  const rows = Math.max(8, (process.stdout.rows ?? 40) - 1)

  return (
    <flex direction="column">
      <Mark cols={cols} rows={rows} scale={1} frame={2.2} />
      <StatusBar
        facts={[{ slot: 'context', value: 'flower of life' }]}
        hints={[{ keys: 'esc', label: 'cancel' }]}
      />
    </flex>
  )
}

Kit.interactive = true

export default Kit
