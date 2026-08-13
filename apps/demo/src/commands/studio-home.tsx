/** @jsxImportSource @tuix/jsx */

import { style, colors } from '@tuix/ansi'
import { StatusBar } from '@tuix/ui'

export default function StudioHome() {
  return (
    <vstack>
      <text style={style().fg(colors.white).bold()}>Make something real</text>
      <text style={style().fg(colors.gray)}>Describe what you want to build</text>
      <text></text>
      <text>Start · Chat · Code Sessions · Workers · MCP</text>
      <text></text>
      <StatusBar
        facts={[{ slot: 'context', value: 'operator workbench' }]}
        hints={[
          { keys: '?', label: 'help' },
          { keys: '/', label: 'commands' },
        ]}
      />
    </vstack>
  )
}
