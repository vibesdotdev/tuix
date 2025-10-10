/** @jsxImportSource @tuix/jsx */

/**
 * Config Demo - Shows how commands access args and flags via context
 *
 * Examples:
 *   bun run src/index.ts config get api.key
 *   bun run src/index.ts config get api.key --reveal
 *   bun run src/index.ts config list --format json
 */

import { context } from '@tuix/reactive/state'
import { style, colors } from '@tuix/ansi'

// Simulated config data
const configData = {
  'api.key': '***secret***',
  'api.url': 'https://api.example.com',
  'debug': 'true',
  'log.level': 'info',
}

export function ConfigGet() {
  const key = context.arg(0)
  const reveal = context.flag('reveal', false)

  if (!key) {
    return <text style={style().fg(colors.red)}>Error: Missing required argument: key</text>
  }

  const value = configData[key as keyof typeof configData]

  if (value === undefined) {
    return <text style={style().fg(colors.red)}>Error: Config key not found: {key}</text>
  }

  const displayValue = reveal ? value : (value.includes('secret') ? '***' : value)

  return (
    <vstack>
      <text style={style().bold()}>{key}</text>
      <text>{displayValue}</text>
    </vstack>
  )
}

export function ConfigList() {
  const format = context.flag('format', 'table')

  if (format === 'json') {
    return <text>{JSON.stringify(configData, null, 2)}</text>
  }

  // Table format
  return (
    <vstack>
      <text style={style().bold()}>Configuration</text>
      <text></text>
      {Object.entries(configData).map(([key, value]) => (
        <hstack key={key}>
          <text style={style().fg(colors.cyan)}>{key.padEnd(15)}</text>
          <text>{value}</text>
        </hstack>
      ))}
    </vstack>
  )
}

export function ConfigSet() {
  const key = context.arg(0)
  const value = context.arg(1)

  if (!key || !value) {
    return (
      <text style={style().fg(colors.red)}>
        Error: Missing required arguments: key value
      </text>
    )
  }

  return (
    <vstack>
      <text style={style().fg(colors.green)}>✓ Set {key} = {value}</text>
      <text style={style().faint()}>Configuration updated</text>
    </vstack>
  )
}
