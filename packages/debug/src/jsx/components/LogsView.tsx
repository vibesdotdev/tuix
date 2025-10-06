/**
 * Logs View Component
 *
 * Displays intercepted console logs in a scrollable view
 */

import { Box, Flex, Text } from '@tuix/ui'
import type { JSX } from '@tuix/jsx'

interface LogsViewProps {
  logs: string[]
}

export function LogsView({ logs }: LogsViewProps): JSX.Element {
  if (logs.length === 0) {
    return <Text style={{ color: 'gray' }}>No logs captured. Console output will appear here.</Text>
  }

  // Show last 20 logs
  const recentLogs = logs.slice(-20)

  return (
    <Flex direction="column">
      <Text style={{ color: 'yellow', bold: true }}>Console Logs ({logs.length} total)</Text>
      <Box style={{ marginTop: 1 }}>
        <Flex direction="column">
          {recentLogs.map((log, i) => {
            let color = 'white'
            if (log.startsWith('[ERROR]')) color = 'red'
            else if (log.startsWith('[WARN]')) color = 'yellow'
            else if (log.startsWith('[INFO]')) color = 'cyan'

            return (
              <Text key={i} style={{ color }}>
                {log}
              </Text>
            )
          })}
        </Flex>
      </Box>
    </Flex>
  )
}
