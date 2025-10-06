/**
 * Output View Component
 *
 * Displays intercepted stdout/stderr output
 */

import { View } from '@tuix/core'

interface OutputViewProps {
  output: string[]
}

export function OutputView({ output }: OutputViewProps) {
  if (output.length === 0) {
    return View.text({
      style: { color: 'gray' },
      children: 'No output captured. Process stdout/stderr will appear here.',
    })
  }

  // Join output lines and show last portion
  const fullOutput = output.join('')
  const lines = fullOutput.split('\n')
  const recentLines = lines.slice(-20)

  return View.vstack({
    children: [
      View.text({
        style: { color: 'green', bold: true },
        children: `Process Output (${lines.length} lines)`,
      }),
      View.box({
        style: { marginTop: 1 },
        children: View.vstack({
          children: recentLines.map((line, i) => {
            const color = line.includes('[STDERR]') ? 'red' : 'white'

            return View.text({
              key: i,
              style: { color },
              children: line,
            })
          }),
        }),
      }),
    ],
  })
}
