/**
 * TUIX CLI - Version command
 *
 * Shows version information with modern UI.
 */

import { StaticLayout, Text, Box, Badge, Divider } from '@tuix/ui'
import { vibesTheme } from '@tuix/themes'

const theme = vibesTheme.colors

export function VersionCommand(): JSX.Element {
  const version = '1.0.0-rc.3'
  const buildDate = new Date().toISOString().split('T')[0]

  return (
    <StaticLayout title="TUIX Framework" version={`v${version}`}>
      <Box direction="vertical">
        {/* System info */}
        <Box direction="vertical">
          <Box direction="horizontal">
            <Text color={theme.primary} bold>
              Runtime:
            </Text>
            <Text> </Text>
            <Text>Bun {Bun.version}</Text>
          </Box>
          <Box direction="horizontal">
            <Text color={theme.primary} bold>
              Platform:
            </Text>
            <Text> </Text>
            <Text>
              {process.platform} {process.arch}
            </Text>
          </Box>
          <Box direction="horizontal">
            <Text color={theme.primary} bold>
              Build:
            </Text>
            <Text> </Text>
            <Text>{buildDate}</Text>
          </Box>
        </Box>

        <Divider margin={2} />

        {/* Links */}
        <Box direction="vertical">
          <Box direction="horizontal">
            <Text bold>Website:</Text>
            <Text> </Text>
            <Text color={theme.info}>https://tuix.dev</Text>
          </Box>
          <Box direction="horizontal">
            <Text bold>License:</Text>
            <Text> </Text>
            <Text>MIT</Text>
          </Box>
          <Box direction="horizontal">
            <Text bold>Repository:</Text>
            <Text> </Text>
            <Text color={theme.info}>https://github.com/tuix/tuix</Text>
          </Box>
        </Box>
      </Box>
    </StaticLayout>
  )
}
