/**
 * Debug Performance Tab
 */

import { color } from '@tuix/core'
import { Flex, Text } from '@tuix/ui'
import { debugStore } from '../../../core/store'
import type { JSX } from '@tuix/jsx'

export function DebugPerformance(): JSX.Element {
  const performanceMetrics = debugStore.getPerformanceReport()

  return (
    <Flex direction="column">
      <Text color={color.cyan} bold>⚡ Performance Metrics</Text>
      <Text />
      <Text color={color.yellow}>Component Performance:</Text>
      {performanceMetrics.slice(0, 10).map(metric => (
        <Flex direction="column">
          <Text>  {metric.name}:</Text>
          <Text>    Calls: {metric.count}</Text>
          <Text color={metric.avgTime > 16 ? color.red : color.green}>
            Avg: {metric.avgTime.toFixed(2)}ms
          </Text>
          <Text>    Max: {metric.maxTime.toFixed(2)}ms</Text>
          <Text>    Total: {metric.totalTime.toFixed(2)}ms</Text>
          <Text />
        </Flex>
      ))}
    </Flex>
  )
}
