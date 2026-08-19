/** @jsxImportSource @tuix/jsx */

import { Sparkline, Wordmark, useUITheme } from '@tuix/ui'
import { renderGradientBox } from '@tuix/ansi'
import { border } from '@tuix/ansi'

function Brand() {
  const { theme } = useUITheme()

  const rps = [4, 9, 6, 14, 11, 19, 15, 24, 20, 28, 25, 31, 27, 35, 30, 38]
  const p99 = [12, 18, 15, 22, 30, 26, 34, 29, 40, 36, 44, 39, 50, 46, 55, 51]

  const gradientLines = renderGradientBox({
    width: 44,
    height: 7,
    border: border.rounded,
    gradient: { from: theme.colors.primary, to: theme.colors.tertiary },
    content: ['gradient borders', 'lipgloss-style perimeter blend'],
  }).split('\n')

  return (
    <flex direction="column" gap={1}>
      <Wordmark text="tuix" width={44} />
      <text fg={theme.colors.textDim}>terminal ui for bun · jsx · runes · effect</text>
      <text> </text>
      <text fg={theme.colors.textDim}>rps</text>
      <Sparkline values={rps} variant="braille" rows={2} width={40} />
      <text> </text>
      <text fg={theme.colors.textDim}>p99 ms</text>
      <Sparkline values={p99} variant="bar" width={40} />
      <text> </text>
      <vstack gap={0}>
        {gradientLines.map((line, i) => (
          <text key={`${i}`}>{line}</text>
        ))}
      </vstack>
    </flex>
  )
}

Brand.interactive = false

export default Brand
