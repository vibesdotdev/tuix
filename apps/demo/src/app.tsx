import { Command, Plugin } from '@tuix/jsx'
import FooPlugin from './plugin/foo'
import HelloCommand from './commands/hello-test'
import StudioHome from './commands/studio-home'
import Kit from './commands/kit'
import Brand from './commands/brand'
import Forms from './commands/forms'
import Tasks from './commands/tasks'
import Dash from './commands/dash'
import ShowcaseCommand from './commands/showcase'
import Widgets from './commands/widgets'
import AIChatDemo from './commands/ai-chat-demo'
import AIChatClean from './commands/ai-chat-clean'
import DashboardDemo from './commands/dashboard-demo'
import AIChatInteractive from './commands/ai-chat-interactive'
import DashboardInteractive from './commands/dashboard-interactive'
import { ConfigGet, ConfigList, ConfigSet } from './commands/config-demo'

export default function App() {
  return (
    <vstack>
      <FooPlugin />
      <Command name="hello" description="A friendly greeting" component={HelloCommand} />
      <Command
        name="studio-home"
        description="Vibes Studio home as Tuix JSX"
        component={StudioHome}
      />
      <Command name="kit" description="KISS kit primitives" component={Kit} />
      <Command
        name="brand"
        description="Wordmark banner, braille sparkline, gradient border"
        component={Brand}
      />
      <Command
        name="forms"
        description="bind:value + focus ring + modal backdrop (live proof)"
        component={Forms}
      />
      <Command
        name="tasks"
        description="Task board — filters, focus-ring input, scrim confirm"
        component={Tasks}
      />
      <Command
        name="dash"
        description="Live dashboard — sparklines, bars, service status"
        component={Dash}
      />
      <Command name="showcase" description="Show off TUIX components" component={ShowcaseCommand} />
      <Command
        name="widgets"
        description="New widget gallery (Kbd, Avatar, Sparkline, Skeleton, Alert, Toast)"
        component={Widgets}
      />

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
      <Command
        name="ai-chat-clean"
        description="Clean vibes-style AI chat (thin borders, purple accent)"
        component={AIChatClean}
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
