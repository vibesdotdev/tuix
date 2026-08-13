import { Command, Plugin } from '@tuix/jsx'
import FooPlugin from './plugin/foo'
import HelloCommand from './commands/hello-test'
import StudioHome from './commands/studio-home'
import Kit from './commands/kit'
import ShowcaseCommand from './commands/showcase'
import AIChatDemo from './commands/ai-chat-demo'
import DashboardDemo from './commands/dashboard-demo'
import AIChatInteractive from './commands/ai-chat-interactive'
import DashboardInteractive from './commands/dashboard-interactive'
import { ConfigGet, ConfigList, ConfigSet } from './commands/config-demo'

export default function App() {
  return (
    <vstack>
      <FooPlugin />
      <Command name="hello" description="A friendly greeting" component={HelloCommand} />
      <Command name="studio-home" description="Vibes Studio home as Tuix JSX" component={StudioHome} />
      <Command name="kit" description="KISS kit primitives" component={Kit} />
      <Command name="showcase" description="Show off TUIX components" component={ShowcaseCommand} />

      {/* Config plugin - demonstrates args/flags pattern */}
      <Plugin name="config" description="Manage configuration">
        <Command name="get" description="Get a config value" component={ConfigGet} />
        <Command name="list" description="List all config values" component={ConfigList} />
        <Command name="set" description="Set a config value" component={ConfigSet} />
      </Plugin>

      {/* AI demos */}
      <Command
        name="ai-chat"
        description="Interactive AI chat with live streaming"
        component={AIChatInteractive}
      />
      <Command
        name="ai-chat-static"
        description="Static AI chat demo (non-interactive)"
        component={AIChatDemo}
      />

      {/* Dashboard demos */}
      <Command
        name="dashboard"
        description="Live system monitoring dashboard"
        component={DashboardInteractive}
      />
      <Command
        name="dashboard-static"
        description="Static dashboard demo (non-interactive)"
        component={DashboardDemo}
      />
    </vstack>
  )
}
