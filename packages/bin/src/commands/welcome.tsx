/** @jsxImportSource @tuix/jsx */

import { Text, StaticLayout, Box } from '@tuix/ui'
import { vibesTheme } from '@tuix/themes'

const theme = vibesTheme.colors

export function WelcomeScreen(): JSX.Element {
  return (
    <StaticLayout
      title="TUIX CLI"
      subtitle="Terminal UI Framework"
      statusLine="Run tuix <command> or tuix help for more options"
    >
      <Box direction="vertical">
        <Text color={theme.fg} bold>Commands:</Text>
        <Text> </Text>
        <Box direction="vertical">
          <Box direction="horizontal">
            <Text color={theme.primary}>version</Text>
            <Text>    </Text>
            <Text color={theme.textDim}>Show version and system info</Text>
          </Box>
          <Box direction="horizontal">
            <Text color={theme.primary}>help</Text>
            <Text>       </Text>
            <Text color={theme.textDim}>Interactive help browser</Text>
          </Box>
          <Box direction="horizontal">
            <Text color={theme.primary}>dashboard</Text>
            <Text>  </Text>
            <Text color={theme.textDim}>Live system metrics</Text>
          </Box>
        </Box>
      </Box>
    </StaticLayout>
  )
}
