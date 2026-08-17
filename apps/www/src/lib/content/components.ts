/**
 * UI component catalog for the product site.
 * STE100-style short descriptions. Status reflects docs depth, not code status.
 */

export type ComponentDoc = {
  slug: string
  name: string
  category: string
  package: string
  summary: string
  whenToUse: string
  /** Docs depth: full | brief | none */
  docs: 'full' | 'brief' | 'none'
  example?: { lang: string; filename: string; code: string }
}

export const componentDocs: ComponentDoc[] = [
  // Display
  {
    slug: 'text',
    name: 'Text',
    category: 'Display',
    package: '@tuix/ui',
    summary: 'Render a styled text line or block in the terminal.',
    whenToUse: 'Use Text for labels, messages, and body copy in a widget tree.',
    docs: 'brief',
    example: {
      lang: 'tsx',
      filename: 'text.tsx',
      code: `import { Text } from '@tuix/ui'

<Text>Hello, terminal</Text>`,
    },
  },
  {
    slug: 'header',
    name: 'Header',
    category: 'Display',
    package: '@tuix/ui',
    summary: 'Show a title row for a screen or panel.',
    whenToUse: 'Use Header at the top of a layout or modal.',
    docs: 'brief',
  },
  {
    slug: 'badge',
    name: 'Badge',
    category: 'Display',
    package: '@tuix/ui',
    summary: 'Show a short status or count chip.',
    whenToUse: 'Use Badge for counts, tags, and compact status marks.',
    docs: 'brief',
  },
  {
    slug: 'status-indicator',
    name: 'StatusIndicator',
    category: 'Display',
    package: '@tuix/ui',
    summary: 'Show a live status mark (for example ok, warn, error).',
    whenToUse: 'Use StatusIndicator next to process or service state.',
    docs: 'brief',
  },
  {
    slug: 'divider',
    name: 'Divider',
    category: 'Display',
    package: '@tuix/ui',
    summary: 'Draw a horizontal rule between sections.',
    whenToUse: 'Use Divider to separate blocks in a vertical layout.',
    docs: 'brief',
  },
  {
    slug: 'large-text',
    name: 'LargeText',
    category: 'Display',
    package: '@tuix/ui',
    summary: 'Render large banner text for titles and empty states.',
    whenToUse: 'Use LargeText for splash titles and focus headlines.',
    docs: 'brief',
  },
  // Layout
  {
    slug: 'box',
    name: 'Box',
    category: 'Layout',
    package: '@tuix/ui',
    summary: 'Wrap children in a bordered or padded region.',
    whenToUse: 'Use Box for cards, panels, and grouped content.',
    docs: 'brief',
  },
  {
    slug: 'flex',
    name: 'Flex / Row / Column / Stack / Grid',
    category: 'Layout',
    package: '@tuix/ui',
    summary: 'Arrange children with flex-style row and column layouts.',
    whenToUse: 'Use Flex helpers to build toolbars, forms, and split panes.',
    docs: 'brief',
  },
  {
    slug: 'panel',
    name: 'Panel',
    category: 'Layout',
    package: '@tuix/ui',
    summary: 'Show a titled content panel.',
    whenToUse: 'Use Panel when a section needs a clear title and body.',
    docs: 'brief',
  },
  {
    slug: 'viewport',
    name: 'Viewport',
    category: 'Layout',
    package: '@tuix/ui',
    summary: 'Clip and scroll content inside a fixed terminal region.',
    whenToUse: 'Use Viewport for long lists and scrollable logs.',
    docs: 'brief',
  },
  {
    slug: 'static-layout',
    name: 'StaticLayout',
    category: 'Layout',
    package: '@tuix/ui',
    summary: 'Compose a non-interactive full-screen layout shell.',
    whenToUse: 'Use StaticLayout for one-shot reports and help screens.',
    docs: 'brief',
  },
  {
    slug: 'interactive-layout',
    name: 'InteractiveLayout',
    category: 'Layout',
    package: '@tuix/ui',
    summary: 'Compose a full-screen layout for keyboard-driven apps.',
    whenToUse: 'Use InteractiveLayout for dashboards and multi-pane TUIs.',
    docs: 'brief',
  },
  {
    slug: 'scrollable-box',
    name: 'ScrollableBox',
    category: 'Layout',
    package: '@tuix/ui',
    summary: 'Scroll a box of content with keyboard or mouse.',
    whenToUse: 'Use ScrollableBox when content exceeds the visible area.',
    docs: 'brief',
    example: {
      lang: 'tsx',
      filename: 'log-view.tsx',
      code: `import { ScrollableBox } from '@tuix/ui'

<ScrollableBox
  title="Logs"
  items={logLines}
  height={12}
  renderItem={(line) => <text>{line}</text>}
/>`,
    },
  },
  // Forms
  {
    slug: 'button',
    name: 'Button',
    category: 'Forms',
    package: '@tuix/ui',
    summary: 'Activate an action with a focusable control.',
    whenToUse: 'Use Button for confirm, cancel, and primary actions.',
    docs: 'brief',
  },
  {
    slug: 'text-input',
    name: 'TextInput',
    category: 'Forms',
    package: '@tuix/ui',
    summary: 'Collect a single line of text from the user.',
    whenToUse: 'Use TextInput for names, paths, and search queries.',
    docs: 'brief',
    example: {
      lang: 'tsx',
      filename: 'text-input.tsx',
      code: `import { $state } from '@tuix/reactive'
import { TextInput } from '@tuix/ui'

const name = $state('', 'name')

<TextInput
  bind:value={name}
  placeholder="Your name"
  width={28}
/>`,
    },
  },
  {
    slug: 'select',
    name: 'Select',
    category: 'Forms',
    package: '@tuix/ui',
    summary: 'Choose one option from a list.',
    whenToUse: 'Use Select for enums and fixed choice lists.',
    docs: 'brief',
  },
  {
    slug: 'checkbox',
    name: 'Checkbox',
    category: 'Forms',
    package: '@tuix/ui',
    summary: 'Toggle a boolean option.',
    whenToUse: 'Use Checkbox for independent on or off settings.',
    docs: 'brief',
  },
  {
    slug: 'radio',
    name: 'Radio',
    category: 'Forms',
    package: '@tuix/ui',
    summary: 'Choose one option in a mutually exclusive group.',
    whenToUse: 'Use Radio when only one option in a set can be true.',
    docs: 'brief',
  },
  {
    slug: 'toggle',
    name: 'Toggle',
    category: 'Forms',
    package: '@tuix/ui',
    summary: 'Switch a setting between two states.',
    whenToUse: 'Use Toggle for feature flags and compact boolean UI.',
    docs: 'brief',
    example: {
      lang: 'tsx',
      filename: 'toggle.tsx',
      code: `import { $state } from '@tuix/reactive'
import { Toggle } from '@tuix/ui'

const telemetry = $state(false, 'telemetry')

<Toggle
  bind:checked={telemetry}
  label="Share crash reports"
  onChange={(on) => saveSetting('telemetry', on)}
/>`,
    },
  },
  {
    slug: 'confirm',
    name: 'Confirm',
    category: 'Forms',
    package: '@tuix/ui',
    summary: 'Ask the user to confirm or cancel an action.',
    whenToUse: 'Use Confirm before destructive or irreversible work.',
    docs: 'brief',
  },
  {
    slug: 'form',
    name: 'Form',
    category: 'Forms',
    package: '@tuix/ui',
    summary: 'Group fields and handle submit for multi-field input.',
    whenToUse: 'Use Form when several fields belong to one submit action.',
    docs: 'brief',
    example: {
      lang: 'tsx',
      filename: 'form.tsx',
      code: `import { $state } from '@tuix/reactive'
import { Form, TextInput, Checkbox, Button } from '@tuix/ui'

function Profile() {
  const name = $state('', 'name')
  const agree = $state(false, 'agree')

  return (
    <Form onSubmit={() => { /* save */ }}>
      <TextInput bind:value={name} placeholder="Name" />
      <Checkbox bind:checked={agree} label="I accept the terms" />
      <Button variant="primary">Save</Button>
    </Form>
  )
}`,
    },
  },
  {
    slug: 'file-picker',
    name: 'FilePicker',
    category: 'Forms',
    package: '@tuix/ui',
    summary: 'Browse and select a file path in the terminal.',
    whenToUse: 'Use FilePicker for open and save path selection.',
    docs: 'brief',
    example: {
      lang: 'tsx',
      filename: 'file-picker.tsx',
      code: `import { $state } from '@tuix/reactive'
import { FilePicker } from '@tuix/ui'

const path = $state('', 'path')

<FilePicker
  bind:value={path}
  cwd={process.cwd()}
  onPick={(file) => path.$set(file)}
/>`,
    },
  },
  // Data
  {
    slug: 'table',
    name: 'Table / DataTable / CompactTable',
    category: 'Data',
    package: '@tuix/ui',
    summary: 'Render rows and columns of structured data.',
    whenToUse: 'Use Table for process lists, configs, and reports.',
    docs: 'brief',
  },
  {
    slug: 'list',
    name: 'List / SimpleList / CheckList / NumberedList',
    category: 'Data',
    package: '@tuix/ui',
    summary: 'Render a selectable or static list of items.',
    whenToUse: 'Use List for menus, checklists, and item pickers.',
    docs: 'brief',
    example: {
      lang: 'tsx',
      filename: 'list.tsx',
      code: `import { $state } from '@tuix/reactive'
import { List } from '@tuix/ui'

const selected = $state(0, 'selected')
const items = ['Developer', 'Operator', 'Admin']

<List
  items={items}
  selectedIndex={selected}
  selectionMode="single"
  onSelect={(i) => selected.$set(i)}
  renderItem={(item, _i, isSelected) => (
    <text>{isSelected ? '>' : ' '} {item}</text>
  )}
/>`,
    },
  },
  {
    slug: 'filter-box',
    name: 'FilterBox',
    category: 'Data',
    package: '@tuix/ui',
    summary: 'Filter a data set with a search box.',
    whenToUse: 'Use FilterBox above tables and long lists.',
    docs: 'brief',
    example: {
      lang: 'tsx',
      filename: 'filter-box.tsx',
      code: `import { $state } from '@tuix/reactive'
import { FilterBox, List } from '@tuix/ui'

const query = $state('', 'query')

<FilterBox bind:query={query} placeholder="Filter processes…" />
<List items={procs.filter(p => p.includes(query()))} />`,
    },
  },
  // Feedback
  {
    slug: 'modal',
    name: 'Modal / InfoModal / ConfirmModal / LoadingModal / ErrorModal',
    category: 'Feedback',
    package: '@tuix/ui',
    summary: 'Show a focused overlay dialog over the current screen.',
    whenToUse: 'Use Modal for blocking prompts and short workflows.',
    docs: 'brief',
  },
  {
    slug: 'progress-bar',
    name: 'ProgressBar',
    category: 'Feedback',
    package: '@tuix/ui',
    summary: 'Show completion progress for a task.',
    whenToUse: 'Use ProgressBar for installs, downloads, and long jobs.',
    docs: 'brief',
  },
  {
    slug: 'toast',
    name: 'Toast / ToastViewport',
    category: 'Feedback',
    package: '@tuix/ui',
    summary: 'Show a short transient notification.',
    whenToUse: 'Use Toast for success and error notices that auto-dismiss.',
    docs: 'brief',
    example: {
      lang: 'tsx',
      filename: 'toast.tsx',
      code: `import { createToastStore, ToastViewport } from '@tuix/ui'

const toasts = createToastStore({ maxVisible: 3 })

async function save() {
  await writeBuffer()
  toasts.success('Saved')
}

// Render once per surface; drive it with push helpers.
<ToastViewport store={toasts} />`,
    },
  },
  {
    slug: 'tooltip',
    name: 'Tooltip',
    category: 'Feedback',
    package: '@tuix/ui',
    summary: 'Show helper text near a focused control.',
    whenToUse: 'Use Tooltip for keyboard hints and field help.',
    docs: 'brief',
    example: {
      lang: 'tsx',
      filename: 'tooltip.tsx',
      code: `import { $state } from '@tuix/reactive'
import { Tooltip } from '@tuix/ui'

const showHint = $state(false, 'showHint')

<text>buffer</text>
<Tooltip
  visible={showHint()}
  placement="below"
  content="Write the buffer to disk"
  duration={4000}
  onHide={() => showHint.$set(false)}
/>`,
    },
  },
  {
    slug: 'spinner',
    name: 'Spinner',
    category: 'Feedback',
    package: '@tuix/ui',
    summary: 'Show an indeterminate busy indicator.',
    whenToUse: 'Use Spinner while you wait for a long Effect or network call.',
    docs: 'brief',
    example: {
      lang: 'tsx',
      filename: 'spinner.tsx',
      code: `import { Spinner } from '@tuix/ui'

<Spinner type="dots" text="Indexing workspace…" speed={80} />`,
    },
  },
  // Navigation
  {
    slug: 'help',
    name: 'Help',
    category: 'Navigation',
    package: '@tuix/ui',
    summary: 'Browse help entries with keyboard navigation.',
    whenToUse: 'Use Help for in-app command and keybinding help.',
    docs: 'brief',
  },
  {
    slug: 'tabs',
    name: 'Tabs',
    category: 'Navigation',
    package: '@tuix/ui',
    summary: 'Switch between labeled panels.',
    whenToUse: 'Use Tabs for multi-section screens in one view.',
    docs: 'brief',
    example: {
      lang: 'tsx',
      filename: 'tabs.tsx',
      code: `import { Tabs, Tab } from '@tuix/ui'

<Tabs activeIndex={0} onTabChange={(i) => switchPane(i)}>
  <Tab label="Overview">{overviewPane}</Tab>
  <Tab label="Logs">{logPane}</Tab>
  <Tab label="Config" badge="2">{configPane}</Tab>
</Tabs>`,
    },
  },
  // System
  {
    slug: 'exit',
    name: 'Exit',
    category: 'System',
    package: '@tuix/ui',
    summary: 'Signal a clean application exit from the widget tree.',
    whenToUse: 'Use Exit when a screen should end the interactive session.',
    docs: 'brief',
    example: {
      lang: 'tsx',
      filename: 'exit.tsx',
      code: `import { Exit } from '@tuix/ui'

// Renders the farewell line, then exits after the paint lands.
<Exit code={0} delay={500}>Bye — buffers flushed.</Exit>`,
    },
  },
  // JSX app components
  {
    slug: 'command',
    name: 'Command',
    category: 'JSX app',
    package: '@tuix/jsx',
    summary: 'Register a CLI subcommand with a component and description.',
    whenToUse: 'Use Command for each path your CLI exposes.',
    docs: 'brief',
    example: {
      lang: 'tsx',
      filename: 'command.tsx',
      code: `import { Command } from '@tuix/jsx'

<Command name="version" description="Show version" component={Version} />`,
    },
  },
  {
    slug: 'fallback',
    name: 'Fallback',
    category: 'JSX app',
    package: '@tuix/jsx',
    summary: 'Render a default view when no command matches.',
    whenToUse: 'Use Fallback for bare invocation and unknown routes.',
    docs: 'brief',
  },
  {
    slug: 'plugin',
    name: 'Plugin',
    category: 'JSX app',
    package: '@tuix/jsx',
    summary: 'Register a plugin scope with nested commands.',
    whenToUse: 'Use Plugin to group related commands under one path.',
    docs: 'brief',
    example: {
      lang: 'tsx',
      filename: 'plugin.tsx',
      code: `import { Plugin, Command } from '@tuix/jsx'

<Plugin name="config" description="Manage configuration">
  <Command name="get" description="Print one value" component={ConfigGet} />
  <Command name="set" description="Set one value" component={ConfigSet} />
</Plugin>

// Routes: tuix config get <key>, tuix config set <key> <value>`,
    },
  },
  {
    slug: 'scope',
    name: 'Scope / ScopeProvider',
    category: 'JSX app',
    package: '@tuix/jsx',
    summary: 'Define a named scope for routing and reactive state.',
    whenToUse: 'Use Scope for nested command trees and scoped state.',
    docs: 'brief',
    example: {
      lang: 'tsx',
      filename: 'scope.tsx',
      code: `import { Scope } from '@tuix/jsx'

// Scope names the route node and gives nested $state keys a home.
<Scope name="deploy" description="Ship the current branch">
  <DeployScreen />
</Scope>`,
    },
  },
  // JSX intrinsics
  {
    slug: 'intrinsic-text',
    name: '<text> / <vstack> / <hstack> / <box>',
    category: 'JSX primitives',
    package: '@tuix/jsx',
    summary: 'Built-in JSX elements that compile to view nodes.',
    whenToUse: 'Use primitives for layout when you do not need full widgets.',
    docs: 'brief',
  },
  // New widget families (2026-08-17)
  {
    slug: 'kbd',
    name: 'Kbd / KbdHint',
    category: 'Display',
    package: '@tuix/ui',
    summary: 'Render a keyboard chip: [/] or [^K] with an optional label.',
    whenToUse: 'Use Kbd in footers, help rows, and hint lines.',
    docs: 'brief',
    example: {
      lang: 'tsx',
      filename: 'kbd.tsx',
      code: `import { Kbd, KbdHint } from '@tuix/ui'

<KbdHint keys="/" label="commands" />
<KbdHint keys="ctrl+k" label="clear" />
<Kbd keys="esc" />`,
    },
  },
  {
    slug: 'avatar',
    name: 'Avatar',
    category: 'Display',
    package: '@tuix/ui',
    summary: 'Identity mark with initials or a glyph and a stable per-name color.',
    whenToUse: 'Use Avatar in session lists and mention rows.',
    docs: 'brief',
    example: {
      lang: 'tsx',
      filename: 'avatar.tsx',
      code: `import { Avatar } from '@tuix/ui'

<Avatar name="Ada Lovelace" />      // [AL] — accent hashed from the name
<Avatar name="Grace Hopper" size="small" />
<Avatar glyph="✿" size="large" />   // ( ✿ )`,
    },
  },
  {
    slug: 'accordion',
    name: 'Accordion',
    category: 'Display',
    package: '@tuix/ui',
    summary: 'Folded sections with a keyboard cursor and disclosure marks.',
    whenToUse: 'Use Accordion for settings groups and collapsible detail.',
    docs: 'brief',
    example: {
      lang: 'tsx',
      filename: 'accordion.tsx',
      code: `import { Accordion } from '@tuix/ui'

<Accordion
  defaultOpen={0}
  items={[
    { title: 'Session', children: '3 open · rewrite auth active' },
    { title: 'Files', children: 'sessions-open.ts · login.ts' },
  ]}
/>`,
    },
  },
  {
    slug: 'sparkline',
    name: 'Sparkline',
    category: 'Data',
    package: '@tuix/ui',
    summary: 'One-line chart of block glyphs scaled to the series.',
    whenToUse: 'Use Sparkline for latency, throughput, and trend chips.',
    docs: 'brief',
    example: {
      lang: 'tsx',
      filename: 'sparkline.tsx',
      code: `import { Sparkline } from '@tuix/ui'

<Sparkline values={latencyHistory} label="p99 ms" />
<Sparkline values={opsPerSec} variant="line" width={20} />`,
    },
  },
  {
    slug: 'skeleton',
    name: 'Skeleton / SkeletonText',
    category: 'Feedback',
    package: '@tuix/ui',
    summary: 'Static loading placeholder that never animates or steals keys.',
    whenToUse: 'Use Skeleton while data loads, in place of the real content.',
    docs: 'brief',
    example: {
      lang: 'tsx',
      filename: 'skeleton.tsx',
      code: `import { Skeleton, SkeletonText } from '@tuix/ui'

{loading
  ? <SkeletonText lines={3} width={28} />
  : <Content />}`,
    },
  },
  {
    slug: 'alert',
    name: 'Alert',
    category: 'Feedback',
    package: '@tuix/ui',
    summary: 'Inline non-modal callout with an accent border and glyph.',
    whenToUse: 'Use Alert for persistent context (read-only, degraded).',
    docs: 'brief',
    example: {
      lang: 'tsx',
      filename: 'alert.tsx',
      code: `import { Alert } from '@tuix/ui'

<Alert variant="warning" title="Read-only">
  Workspace is in review mode.
</Alert>`,
    },
  },
  {
    slug: 'breadcrumbs',
    name: 'Breadcrumbs',
    category: 'Navigation',
    package: '@tuix/ui',
    summary: 'Path trail with dim ancestors and a bright leaf.',
    whenToUse: 'Use Breadcrumbs in file browsers and nested screens.',
    docs: 'brief',
    example: {
      lang: 'tsx',
      filename: 'breadcrumbs.tsx',
      code: `import { Breadcrumbs } from '@tuix/ui'

<Breadcrumbs
  items={[
    { label: 'apps' },
    { label: 'demo' },
    { label: 'kit.tsx' },
  ]}
/>`,
    },
  },
]

export const componentCategories = [
  'Display',
  'Layout',
  'Forms',
  'Data',
  'Feedback',
  'Navigation',
  'System',
  'JSX app',
  'JSX primitives',
] as const

export function getComponent(slug: string): ComponentDoc | undefined {
  return componentDocs.find(c => c.slug === slug)
}

export function componentsByCategory(): Array<{ category: string; items: ComponentDoc[] }> {
  return componentCategories
    .map(category => ({
      category,
      items: componentDocs.filter(c => c.category === category),
    }))
    .filter(g => g.items.length > 0)
}

export function componentHref(slug: string): string {
  return `/docs/components/${slug}`
}
