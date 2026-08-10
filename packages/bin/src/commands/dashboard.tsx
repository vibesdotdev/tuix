/**
 * TUIX CLI - Dashboard command
 *
 * System status dashboard with modern UI.
 */

import {
  InteractiveLayout,
  Panel,
  Header,
  StatusIndicator,
  Divider,
  ProgressBar,
  Badge,
  Text,
  Box,
} from '@tuix/ui'
import { $state, $derived, $effect } from '@tuix/reactive'
import { vibesTheme } from '@tuix/themes'

const theme = vibesTheme.colors

export function DashboardCommand(): JSX.Element {
  // Simulated metrics
  const cpuUsage = $state(45)
  const memoryUsage = $state(68)
  const uptime = $state(Date.now())

  // Update metrics periodically
  $effect(() => {
    const interval = setInterval(() => {
      cpuUsage.$set(40 + Math.random() * 20)
      memoryUsage.$set(60 + Math.random() * 20)
    }, 2000)

    return () => clearInterval(interval)
  })

  const uptimeHours = $derived(() => {
    const hours = Math.floor((Date.now() - uptime()) / 1000 / 60 / 60)
    return hours
  })

  return (
    <InteractiveLayout
      header={
        <Header
          title="TUIX Dashboard"
          subtitle="Framework health and performance metrics"
          badge={<Badge variant="success" label="Online" />}
        />
      }
      footer={
        <Box>
          <Text color={theme.textDim} dim>
            Press Ctrl+C to exit
          </Text>
        </Box>
      }
    >
      <Box direction="vertical">
        <Divider label="Services" margin={2} />

        <Box direction="vertical">
          <StatusIndicator status="active" label="Core Runtime" pulse />
          <StatusIndicator status="active" label="Config Service" />
          <StatusIndicator status="active" label="Logger" />
          <StatusIndicator status="active" label="Process Manager" />
          <StatusIndicator status="inactive" label="Telemetry (disabled)" />
          <StatusIndicator status="active" label="Update Checker" />
        </Box>

        <Divider label="Resources" margin={2} />

        <Box direction="vertical">
          <ProgressBar
            value={cpuUsage()}
            label="CPU Usage"
            showPercentage
            variant={cpuUsage() > 80 ? 'error' : cpuUsage() > 60 ? 'warning' : 'success'}
          />
          <Box margin={{ top: 1 }}>
            <ProgressBar
              value={memoryUsage()}
              label="Memory Usage"
              showPercentage
              variant={memoryUsage() > 80 ? 'error' : memoryUsage() > 60 ? 'warning' : 'success'}
            />
          </Box>
        </Box>

        <Divider label="Runtime Info" margin={2} />

        <Box direction="vertical">
          <Box direction="horizontal">
            <Text color={theme.primary} bold>
              Uptime:
            </Text>
            <Text> </Text>
            <Text>{uptimeHours()} hours</Text>
          </Box>
          <Box direction="horizontal">
            <Text color={theme.primary} bold>
              Bun Version:
            </Text>
            <Text> </Text>
            <Text>{Bun.version}</Text>
          </Box>
          <Box direction="horizontal">
            <Text color={theme.primary} bold>
              Platform:
            </Text>
            <Text> </Text>
            <Text>
              {process.platform} / {process.arch}
            </Text>
          </Box>
          <Box direction="horizontal">
            <Text color={theme.primary} bold>
              PID:
            </Text>
            <Text> </Text>
            <Text>{process.pid}</Text>
          </Box>
        </Box>
      </Box>
    </InteractiveLayout>
  )
}
