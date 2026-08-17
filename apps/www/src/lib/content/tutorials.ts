/**
 * Progressive tutorials with multi-style samples (JSX vs Effect MVU).
 * Prose follows ASD-STE100 Simplified Technical English:
 * short sentences, active voice, one idea per sentence, articles required.
 */

export type TutorialApproach = {
  id: string
  label: string
  lang: string
  filename: string
  code: string
  note?: string
}

export type TutorialStep = {
  heading: string
  body: string
}

export type Tutorial = {
  slug: string
  title: string
  level: number
  levelLabel: string
  summary: string
  /** One-line outcome the learner can verify */
  outcome: string
  goals: string[]
  prerequisites: string[]
  steps: TutorialStep[]
  approaches: TutorialApproach[]
  next?: string
  packages: string[]
  /** Optional related component or feature links */
  related?: Array<{ href: string; label: string }>
}

export const tutorials: Tutorial[] = [
  {
    slug: 'hello-world',
    title: 'Hello world',
    level: 1,
    levelLabel: 'Beginner',
    summary: 'Render one screen. Then exit.',
    outcome: 'The terminal shows a greeting and the process ends.',
    goals: [
      'Return terminal content from a component.',
      'Start the app with runApp.',
      'Compare JSX with an Effect Model-View-Update (MVU) component.',
    ],
    prerequisites: ['Install Bun 1.1 or newer.', 'Install the Tuix monorepo packages.'],
    packages: ['@tuix/jsx', '@tuix/view', '@tuix/runtime', '@tuix/platform'],
    related: [
      { href: '/packages/jsx', label: '@tuix/jsx' },
      { href: '/docs/quickstart', label: 'Quickstart' },
      { href: '/docs/patterns/jsx-to-mvu', label: 'JSX → MVU pattern' },
      { href: '/docs/patterns/interactive-mode', label: 'One-shot vs interactive' },
    ],
    steps: [
      {
        heading: 'What you build',
        body: 'You print a short greeting. The app does not wait for keys. Use this path for reports and one-shot command output.',
      },
      {
        heading: 'Pick a style',
        body: 'Open the JSX tab for the common product path. Open the Effect MVU tab when you want init, update, and view under your control.',
      },
      {
        heading: 'Run the sample',
        body: 'Save the file. Run it with Bun. Confirm that the greeting appears. Confirm that the process exits.',
      },
    ],
    approaches: [
      {
        id: 'jsx',
        label: 'JSX',
        lang: 'tsx',
        filename: 'hello.tsx',
        note: 'Product path. Use @tuix/jsx runApp for most CLI apps.',
        code: `/** @jsxImportSource @tuix/jsx */
import { runApp } from '@tuix/jsx'

function Hello() {
  return (
    <vstack>
      <text>Hello, Tuix</text>
      <text>One-shot render. Then exit.</text>
    </vstack>
  )
}

await runApp(Hello, { interactive: false })`,
      },
      {
        id: 'effect-mvu',
        label: 'Effect MVU',
        lang: 'typescript',
        filename: 'hello-mvu.ts',
        note: 'Runtime path. Provide LiveServices when you use Live terminal I/O.',
        code: `import { Effect } from 'effect'
import { runApp } from '@tuix/runtime'
import { LiveServices } from '@tuix/platform'
import { text, vstack } from '@tuix/view'
import type { Component } from '@tuix/core/types'

type Model = { message: string }
type Msg = never

const Hello: Component<Model, Msg> = {
  init: Effect.succeed([{ message: 'Hello, Tuix' }, []]),
  update: (_msg, model) => Effect.succeed([model, []]),
  view: (model) => ({
    render: () =>
      Effect.succeed(
        vstack([
          text(model.message),
          text('One-shot render. Then exit.'),
        ]),
      ),
  }),
}

await Effect.runPromise(
  runApp(Hello).pipe(Effect.provide(LiveServices)),
)`,
      },
    ],
    next: 'interactive-counter',
  },
  {
    slug: 'interactive-counter',
    title: 'Interactive counter',
    level: 2,
    levelLabel: 'Beginner',
    summary: 'Keep the app open. Store count in the model. Update from messages.',
    outcome: 'The screen stays open and shows a count field from the model.',
    goals: [
      'Create named $state so fields survive compile under Bun.',
      'Use interactive mode so the runtime does not exit after the first paint.',
      'See the same loop with explicit Effect messages.',
    ],
    prerequisites: ['Complete the Hello world tutorial.'],
    packages: ['@tuix/jsx', '@tuix/reactive', '@tuix/runtime', '@tuix/platform', '@tuix/view'],
    related: [
      { href: '/packages/reactive', label: '@tuix/reactive' },
      { href: '/docs/features/reactive-runes-mvu-bridge', label: 'Runes ↔ MVU feature' },
      { href: '/docs/patterns/named-state', label: 'Named state pattern' },
    ],
    steps: [
      {
        heading: 'Named state',
        body: 'Call $state with an initial value and a name string. The name becomes a model field. Call $set so the next paint reads from the model.',
      },
      {
        heading: 'Interactive mode',
        body: 'Pass interactive: true to runApp. Without that flag, one-shot mode exits after the first paint.',
      },
      {
        heading: 'Compare styles',
        body: 'JSX hides the message loop. Effect MVU shows init, update, and view. Both styles use the same runtime loop.',
      },
    ],
    approaches: [
      {
        id: 'jsx',
        label: 'JSX + runes',
        lang: 'tsx',
        filename: 'counter.tsx',
        note: 'Prefer named $state for product CLIs. Bind keys or buttons to count.$set in a full app.',
        code: `/** @jsxImportSource @tuix/jsx */
import { $state } from '@tuix/reactive'
import { runApp } from '@tuix/jsx'

function Counter() {
  const count = $state(0, 'count')

  return (
    <vstack>
      <text>Count: {count()}</text>
      <text>Named state hydrates from the model on each paint.</text>
      <text>Call count.$set(count() + 1) from a key or button.</text>
    </vstack>
  )
}

await runApp(Counter, {
  interactive: true,
  extractState: true,
})`,
      },
      {
        id: 'effect-mvu',
        label: 'Effect MVU',
        lang: 'typescript',
        filename: 'counter-mvu.ts',
        note: 'Messages are explicit. update returns a new model and a command list.',
        code: `import { Effect } from 'effect'
import { runApp } from '@tuix/runtime'
import { LiveServices } from '@tuix/platform'
import { text, vstack } from '@tuix/view'
import type { Component } from '@tuix/core/types'

type Model = { count: number }
type Msg = { type: 'inc' } | { type: 'dec' }

const Counter: Component<Model, Msg> = {
  init: Effect.succeed([{ count: 0 }, []]),
  update: (msg, model) => {
    if (msg.type === 'inc') {
      return Effect.succeed([{ count: model.count + 1 }, []])
    }
    if (msg.type === 'dec') {
      return Effect.succeed([{ count: model.count - 1 }, []])
    }
    return Effect.succeed([model, []])
  },
  view: (model) => ({
    render: () =>
      Effect.succeed(
        vstack([
          text(\`Count: \${model.count}\`),
          text('Dispatch { type: "inc" } from keys or commands.'),
        ]),
      ),
  }),
}

await Effect.runPromise(
  runApp(Counter).pipe(Effect.provide(LiveServices)),
)`,
      },
    ],
    next: 'multi-command-cli',
  },
  {
    slug: 'multi-command-cli',
    title: 'Multi-command CLI',
    level: 3,
    levelLabel: 'Intermediate',
    summary: 'Register subcommands. Provide a fallback for bare invocation.',
    outcome: 'demo version prints a version. Bare demo shows usage text.',
    goals: [
      'Register each subcommand with Command.',
      'Provide Fallback when no command matches.',
      'See an Effect app that branches on argv without JSX Command.',
    ],
    prerequisites: ['Complete the Interactive counter tutorial.'],
    packages: ['@tuix/jsx', '@tuix/runtime', '@tuix/platform', '@tuix/view'],
    related: [
      { href: '/docs/cli', label: 'CLI guide' },
      { href: '/docs/components/command', label: 'Command component' },
      { href: '/docs/patterns/cli-routing', label: 'CLI routing pattern' },
    ],
    steps: [
      {
        heading: 'Command tree',
        body: 'Each Command has a name, a description, and a component. The JSX runApp path matches argv against the scope tree.',
      },
      {
        heading: 'Fallback',
        body: 'Fallback runs when no command matches. Use it for usage text and the default screen.',
      },
      {
        heading: 'Effect style',
        body: 'Without JSX Command, parse argv yourself. Select one Component. The runtime still runs one Model-View-Update (MVU) tree.',
      },
    ],
    approaches: [
      {
        id: 'jsx',
        label: 'JSX Command',
        lang: 'tsx',
        filename: 'cli.tsx',
        note: 'Matches the tuix dogfood CLI pattern.',
        code: `/** @jsxImportSource @tuix/jsx */
import { Command, Fallback, runApp } from '@tuix/jsx'

function Version() {
  return <text>1.0.0-rc.3</text>
}

function HelpHome() {
  return (
    <vstack>
      <text>demo — sample CLI</text>
      <text>Run: demo version</text>
    </vstack>
  )
}

function App() {
  return (
    <>
      <Command
        name="version"
        description="Show version"
        component={Version}
      />
      <Fallback component={HelpHome} />
    </>
  )
}

await runApp(App)`,
      },
      {
        id: 'effect-mvu',
        label: 'Effect branch',
        lang: 'typescript',
        filename: 'cli-mvu.ts',
        note: 'Manual argv branch into one Component. No JSX Command tree.',
        code: `import { Effect } from 'effect'
import { runApp } from '@tuix/runtime'
import { LiveServices } from '@tuix/platform'
import { text, vstack } from '@tuix/view'
import type { Component } from '@tuix/core/types'

type Model = { line: string }
type Msg = never

function makeScreen(line: string): Component<Model, Msg> {
  return {
    init: Effect.succeed([{ line }, []]),
    update: (_msg, model) => Effect.succeed([model, []]),
    view: (model) => ({
      render: () => Effect.succeed(vstack([text(model.line)])),
    }),
  }
}

const arg = process.argv[2]
const screen =
  arg === 'version'
    ? makeScreen('1.0.0-rc.3')
    : makeScreen('demo — run: demo version')

await Effect.runPromise(
  runApp(screen).pipe(Effect.provide(LiveServices)),
)`,
      },
    ],
    next: 'keys-and-input',
  },
  {
    slug: 'keys-and-input',
    title: 'Keys and input',
    level: 4,
    levelLabel: 'Intermediate',
    summary: 'Handle keys in an interactive session. Store the last key in the model.',
    outcome: 'Each key updates a named field. q records a quit request.',
    goals: [
      'Keep interactive mode open for key streams.',
      'Use registerKeyHandler or explicit key messages.',
      'Write key results into named state or the model.',
    ],
    prerequisites: ['Complete the Multi-command CLI tutorial.'],
    packages: ['@tuix/jsx', '@tuix/reactive', '@tuix/runtime', '@tuix/platform', '@tuix/view'],
    related: [
      { href: '/docs/patterns/keys-focus-paste', label: 'Keys, focus, paste pattern' },
      { href: '/docs/patterns/interactive-mode', label: 'One-shot vs interactive' },
    ],
    steps: [
      {
        heading: 'Interactive first',
        body: 'Key streams need interactive mode. One-shot mode exits before useful input arrives.',
      },
      {
        heading: 'JSX path',
        body: 'Call registerKeyHandler from @tuix/reactive. Update named $state inside the handler. Prefer Form widgets when they already own keys.',
      },
      {
        heading: 'Effect path',
        body: 'Model last key as a field. Dispatch key messages from your input layer into update.',
      },
      {
        heading: 'Paste and focus',
        body: 'Bracketed paste and focus CSI live on Live InputService. See the keys pattern page for paste rules.',
      },
    ],
    approaches: [
      {
        id: 'jsx',
        label: 'JSX keys',
        lang: 'tsx',
        filename: 'keys.tsx',
        note: 'registerKeyHandler is low-level. Widgets such as List already handle arrows.',
        code: `/** @jsxImportSource @tuix/jsx */
import { $state, registerKeyHandler } from '@tuix/reactive'
import { runApp } from '@tuix/jsx'

function KeyProbe() {
  const last = $state('(none)', 'last')
  const quit = $state(false, 'quit')

  registerKeyHandler((key) => {
    if (key === 'q') {
      quit.$set(true)
      last.$set('quit')
      return
    }
    last.$set(key)
  })

  return (
    <vstack>
      <text>Press keys. Press q to request quit.</text>
      <text>Last: {last()}</text>
      <text>Quit: {quit() ? 'yes' : 'no'}</text>
    </vstack>
  )
}

await runApp(KeyProbe, {
  interactive: true,
  extractState: true,
})`,
      },
      {
        id: 'effect-mvu',
        label: 'Effect MVU',
        lang: 'typescript',
        filename: 'keys-mvu.ts',
        note: 'Key events become messages. update owns the model change.',
        code: `import { Effect } from 'effect'
import { runApp } from '@tuix/runtime'
import { LiveServices } from '@tuix/platform'
import { text, vstack } from '@tuix/view'
import type { Component } from '@tuix/core/types'

type Model = { last: string; quit: boolean }
type Msg = { type: 'key'; value: string }

const KeyProbe: Component<Model, Msg> = {
  init: Effect.succeed([{ last: '(none)', quit: false }, []]),
  update: (msg, model) => {
    if (msg.type === 'key' && msg.value === 'q') {
      return Effect.succeed([{ last: 'quit', quit: true }, []])
    }
    if (msg.type === 'key') {
      return Effect.succeed([{ ...model, last: msg.value }, []])
    }
    return Effect.succeed([model, []])
  },
  view: (model) => ({
    render: () =>
      Effect.succeed(
        vstack([
          text('Press keys. Dispatch { type: "key", value }.'),
          text(\`Last: \${model.last}\`),
          text(\`Quit: \${model.quit ? 'yes' : 'no'}\`),
        ]),
      ),
  }),
}

await Effect.runPromise(
  runApp(KeyProbe).pipe(Effect.provide(LiveServices)),
)`,
      },
    ],
    next: 'forms-and-lists',
  },
  {
    slug: 'forms-and-lists',
    title: 'Forms and lists',
    level: 5,
    levelLabel: 'Intermediate',
    summary: 'Collect field values in a Form. Select a row from a List.',
    outcome:
      'A form holds name and agree. A list holds a role. Submit stores a short summary line.',
    goals: [
      'Compose Form, TextInput, Checkbox, and Button from @tuix/ui.',
      'Select one item with List and named selection state.',
      'Keep field values in the model, not only in local closures.',
    ],
    prerequisites: ['Complete the Keys and input tutorial.'],
    packages: [
      '@tuix/ui',
      '@tuix/jsx',
      '@tuix/reactive',
      '@tuix/view',
      '@tuix/runtime',
      '@tuix/platform',
    ],
    related: [
      { href: '/docs/components/form', label: 'Form' },
      { href: '/docs/components/text-input', label: 'TextInput' },
      { href: '/docs/components/list', label: 'List' },
      { href: '/docs/components/checkbox', label: 'Checkbox' },
      { href: '/docs/patterns/named-state', label: 'Named state pattern' },
    ],
    steps: [
      {
        heading: 'What you build',
        body: 'You build a small profile screen. The form collects a name and an agree flag. The list selects a role. Submit writes a summary line.',
      },
      {
        heading: 'Form fields',
        body: 'Wrap fields in Form. Bind TextInput and Checkbox to named $state. Use Button for the submit action. Store results in the model.',
      },
      {
        heading: 'List selection',
        body: 'Pass items and selectedIndex to List. Handle onSelect with selected.$set. Render each row with renderItem.',
      },
      {
        heading: 'Validation note',
        body: 'Form can call onSubmit and onValidationError. Field-level validate helpers live under @tuix/ui. Add them when several fields must pass together.',
      },
      {
        heading: 'Effect style',
        body: 'Without widgets, keep the same model shape. Use messages for field edits, list moves, and submit. Draw the form with view primitives.',
      },
    ],
    approaches: [
      {
        id: 'jsx',
        label: 'JSX + Form + List',
        lang: 'tsx',
        filename: 'profile-form.tsx',
        note: 'Real @tuix/ui widgets: Form, TextInput, Checkbox, Button, List, Box, Header, Text.',
        code: `/** @jsxImportSource @tuix/jsx */
import { $state } from '@tuix/reactive'
import { runApp } from '@tuix/jsx'
import {
  Box,
  Header,
  Text,
  Form,
  TextInput,
  Checkbox,
  Button,
  List,
} from '@tuix/ui'

const ROLES = ['Developer', 'Operator', 'Admin']

function ProfileForm() {
  const name = $state('', 'name')
  const agree = $state(false, 'agree')
  const selected = $state(0, 'selected')
  const summary = $state('', 'summary')

  function submit() {
    if (!agree()) {
      summary.$set('Error: accept the terms first.')
      return
    }
    const role = ROLES[selected()] ?? ROLES[0]
    const label = name().trim() || '(no name)'
    summary.$set(\`Saved: \${label} · \${role}\`)
  }

  return (
    <Box>
      <Header>Profile</Header>

      <Form onSubmit={submit}>
        <Text>Name</Text>
        <TextInput
          bind:value={name}
          placeholder="Your name"
          width={28}
        />
        <Checkbox
          bind:checked={agree}
          label="I accept the terms"
        />
        <Button variant="primary" onClick={submit}>
          Save
        </Button>
      </Form>

      <Text>Role</Text>
      <List
        items={ROLES}
        selectedIndex={selected}
        selectionMode="single"
        height={5}
        onSelect={(index) => selected.$set(index)}
        renderItem={(item, _i, isSelected) => (
          <text>
            {isSelected ? '>' : ' '} {item}
          </text>
        )}
      />

      <Text>{summary() || 'Fill the form. Select a role. Save.'}</Text>
    </Box>
  )
}

await runApp(ProfileForm, {
  interactive: true,
  extractState: true,
})`,
      },
      {
        id: 'effect-mvu',
        label: 'Effect MVU form',
        lang: 'typescript',
        filename: 'profile-form-mvu.ts',
        note: 'Same model: name, agree, selected, summary. Messages edit fields and submit.',
        code: `import { Effect } from 'effect'
import { runApp } from '@tuix/runtime'
import { LiveServices } from '@tuix/platform'
import { text, vstack } from '@tuix/view'
import type { Component } from '@tuix/core/types'

const ROLES = ['Developer', 'Operator', 'Admin'] as const

type Model = {
  name: string
  agree: boolean
  selected: number
  summary: string
}

type Msg =
  | { type: 'setName'; value: string }
  | { type: 'toggleAgree' }
  | { type: 'select'; index: number }
  | { type: 'submit' }

const ProfileForm: Component<Model, Msg> = {
  init: Effect.succeed([
    { name: '', agree: false, selected: 0, summary: '' },
    [],
  ]),
  update: (msg, model) => {
    if (msg.type === 'setName') {
      return Effect.succeed([{ ...model, name: msg.value }, []])
    }
    if (msg.type === 'toggleAgree') {
      return Effect.succeed([{ ...model, agree: !model.agree }, []])
    }
    if (msg.type === 'select') {
      return Effect.succeed([{ ...model, selected: msg.index }, []])
    }
    if (msg.type === 'submit') {
      if (!model.agree) {
        return Effect.succeed([
          { ...model, summary: 'Error: accept the terms first.' },
          [],
        ])
      }
      const role = ROLES[model.selected] ?? ROLES[0]
      const label = model.name.trim() || '(no name)'
      return Effect.succeed([
        { ...model, summary: \`Saved: \${label} · \${role}\` },
        [],
      ])
    }
    return Effect.succeed([model, []])
  },
  view: (model) => ({
    render: () =>
      Effect.succeed(
        vstack([
          text('Profile'),
          text(\`Name: \${model.name || '(empty)'}\`),
          text(\`Agree: \${model.agree ? 'yes' : 'no'}\`),
          text('Role:'),
          ...ROLES.map((role, i) =>
            text(\`\${i === model.selected ? '>' : ' '} \${role}\`),
          ),
          text(model.summary || 'Edit fields. Select a role. Submit.'),
          text('Msgs: setName | toggleAgree | select | submit'),
        ]),
      ),
  }),
}

await Effect.runPromise(
  runApp(ProfileForm).pipe(Effect.provide(LiveServices)),
)`,
      },
    ],
    next: 'layout-and-viewport',
  },
  {
    slug: 'layout-and-viewport',
    title: 'Layout and viewport',
    level: 6,
    levelLabel: 'Intermediate',
    summary: 'Frame a screen with header chrome. Scroll long content in a Viewport.',
    outcome: 'A header and status row stay fixed. A long log scrolls inside Viewport.',
    goals: [
      'Compose Box, Header, Flex, and Viewport from @tuix/ui.',
      'Keep chrome outside the scroll region.',
      'Compare intrinsic vstack layout with widget layout.',
    ],
    prerequisites: ['Complete the Forms and lists tutorial.'],
    packages: ['@tuix/ui', '@tuix/jsx', '@tuix/view', '@tuix/runtime', '@tuix/platform'],
    related: [
      { href: '/docs/patterns/layout', label: 'Layout pattern' },
      { href: '/docs/components/viewport', label: 'Viewport' },
      { href: '/packages/view', label: '@tuix/view' },
    ],
    steps: [
      {
        heading: 'Regions',
        body: 'Split the screen into chrome and content. Put titles and key hints in chrome. Put long output in a scroll region.',
      },
      {
        heading: 'Viewport',
        body: 'Use Viewport when content exceeds the visible height. Set height. Prefer scroll for logs and long lists.',
      },
      {
        heading: 'Primitives',
        body: 'Use vstack and hstack for light layout without widgets. Use view flexbox when you need reverse or wrap.',
      },
    ],
    approaches: [
      {
        id: 'jsx',
        label: 'JSX + Viewport',
        lang: 'tsx',
        filename: 'layout.tsx',
        note: 'Chrome stays outside Viewport. Log lines scroll inside.',
        code: `/** @jsxImportSource @tuix/jsx */
import { runApp } from '@tuix/jsx'
import { Box, Header, Text, Flex, Viewport } from '@tuix/ui'

function BuildLog() {
  const lines = Array.from({ length: 40 }, (_, i) => \`log line \${i + 1}\`)

  return (
    <Box>
      <Header>Build log</Header>
      <Flex direction="row" gap={2}>
        <Text>status: running</Text>
        <Text>esc: quit</Text>
      </Flex>
      <Viewport height={12} showScrollbars>
        <vstack>
          {lines.map((line) => (
            <text key={line}>{line}</text>
          ))}
        </vstack>
      </Viewport>
    </Box>
  )
}

await runApp(BuildLog, { interactive: true })`,
      },
      {
        id: 'effect-mvu',
        label: 'Effect + view',
        lang: 'typescript',
        filename: 'layout-mvu.ts',
        note: 'Same regions with view primitives only.',
        code: `import { Effect } from 'effect'
import { runApp } from '@tuix/runtime'
import { LiveServices } from '@tuix/platform'
import { text, vstack } from '@tuix/view'
import type { Component } from '@tuix/core/types'

type Model = { lines: string[] }
type Msg = never

const BuildLog: Component<Model, Msg> = {
  init: Effect.succeed([
    {
      lines: Array.from({ length: 12 }, (_, i) => \`log line \${i + 1}\`),
    },
    [],
  ]),
  update: (_msg, model) => Effect.succeed([model, []]),
  view: (model) => ({
    render: () =>
      Effect.succeed(
        vstack([
          text('Build log'),
          text('status: running | esc: quit'),
          text('---'),
          ...model.lines.map((line) => text(line)),
        ]),
      ),
  }),
}

await Effect.runPromise(
  runApp(BuildLog).pipe(Effect.provide(LiveServices)),
)`,
      },
    ],
    next: 'async-commands',
  },
  {
    slug: 'async-commands',
    title: 'Async commands and ticks',
    level: 7,
    levelLabel: 'Advanced',
    summary: 'Run one-shot Effects as Cmd. Stream ticks with Sub.interval.',
    outcome: 'A status field updates from Cmd. A tick counter advances on an interval.',
    goals: [
      'Return Cmd from init or update.',
      'Map Effect success and failure to messages.',
      'Use Sub.interval only in interactive mode.',
    ],
    prerequisites: ['Complete the Layout and viewport tutorial.'],
    packages: ['@tuix/runtime', '@tuix/platform', '@tuix/view'],
    related: [
      { href: '/docs/patterns/async-cmd-sub', label: 'Async Cmd/Sub pattern' },
      { href: '/docs/patterns/interactive-mode', label: 'One-shot vs interactive' },
      { href: '/packages/runtime', label: '@tuix/runtime' },
    ],
    steps: [
      {
        heading: 'Commands',
        body: 'A Cmd is an Effect that produces a message or null. Use Cmd.delay, Cmd.fromEffect, Cmd.fetch, or Cmd.exec.',
      },
      {
        heading: 'Subscriptions',
        body: 'subscriptions(model) returns a stream of messages. Sub.interval is the simple timer. One-shot mode may exit before ticks arrive.',
      },
      {
        heading: 'Update owns results',
        body: 'Never block inside view. Let messages carry async results into the model. Then paint from the model.',
      },
    ],
    approaches: [
      {
        id: 'effect-mvu',
        label: 'Effect MVU',
        lang: 'typescript',
        filename: 'async-mvu.ts',
        note: 'Preferred path for explicit async. Interactive mode keeps Sub alive.',
        code: `import { Effect, Duration } from 'effect'
import { runApp, Cmd, Sub } from '@tuix/runtime'
import { LiveServices } from '@tuix/platform'
import { text, vstack } from '@tuix/view'
import type { Component } from '@tuix/core/types'

type Model = { ticks: number; status: string }
type Msg =
  | { type: 'tick' }
  | { type: 'loaded'; body: string }
  | { type: 'failed'; error: string }

const App: Component<Model, Msg> = {
  init: Effect.succeed([
    { ticks: 0, status: 'loading' },
    [
      Cmd.fromEffect(
        Effect.succeed('ready'),
        (body) => ({ type: 'loaded', body }) as Msg,
        (error) => ({ type: 'failed', error: String(error) }) as Msg,
      ),
    ],
  ]),
  update: (msg, model) => {
    if (msg.type === 'tick') {
      return Effect.succeed([{ ...model, ticks: model.ticks + 1 }, []])
    }
    if (msg.type === 'loaded') {
      return Effect.succeed([{ ...model, status: msg.body }, []])
    }
    if (msg.type === 'failed') {
      return Effect.succeed([{ ...model, status: msg.error }, []])
    }
    return Effect.succeed([model, []])
  },
  view: (model) => ({
    render: () =>
      Effect.succeed(
        vstack([
          text(\`status=\${model.status}\`),
          text(\`ticks=\${model.ticks}\`),
        ]),
      ),
  }),
  subscriptions: () =>
    Sub.interval(Duration.seconds(1), { type: 'tick' } as Msg),
}

await Effect.runPromise(
  runApp(App).pipe(Effect.provide(LiveServices)),
)`,
      },
      {
        id: 'jsx',
        label: 'JSX guidance',
        lang: 'tsx',
        filename: 'async-jsx.tsx',
        note: 'After async work completes, write into named $state so paint hydrates from the model.',
        code: `/** @jsxImportSource @tuix/jsx */
import { $state } from '@tuix/reactive'
import { runApp } from '@tuix/jsx'

function StatusPanel() {
  const status = $state('loading', 'status')

  // Kick async work once. Prefer Cmd in Effect MVU for complex flows.
  void Promise.resolve('ready').then((value) => {
    status.$set(value)
  })

  return (
    <vstack>
      <text>Status: {status()}</text>
      <text>Named $set keeps the result in the model.</text>
    </vstack>
  )
}

await runApp(StatusPanel, {
  interactive: true,
  extractState: true,
})`,
      },
    ],
    next: 'live-services',
  },
  {
    slug: 'live-services',
    title: 'Live services and capabilities',
    level: 8,
    levelLabel: 'Advanced',
    summary: 'Provide LiveServices. Detect capabilities. Write through Effect.',
    outcome: 'The program prints color level and graphics protocol.',
    goals: [
      'Import LiveServices from @tuix/platform.',
      'Call detectCapabilities with environment data.',
      'Provide the Live layer to Effect programs.',
    ],
    prerequisites: ['Complete the Async commands and ticks tutorial.'],
    packages: ['@tuix/platform', '@tuix/core', '@tuix/runtime', '@tuix/jsx'],
    related: [
      { href: '/packages/platform', label: '@tuix/platform' },
      { href: '/docs/features/platform-live-services', label: 'LiveServices feature' },
      { href: '/docs/capabilities', label: 'Terminal & graphics guide' },
      { href: '/docs/patterns/platform-live', label: 'Platform facade pattern' },
    ],
    steps: [
      {
        heading: 'Facade and owner',
        body: 'core owns Live implementations. platform re-exports them for apps. Prefer platform imports in application code.',
      },
      {
        heading: 'Capabilities',
        body: 'detectCapabilities is pure. You can unit-test it without a teletypewriter (TTY). Use TUIX_PROBE_* overrides in continuous integration (CI).',
      },
      {
        heading: 'Provide layers',
        body: 'Pipe Effect.provide(LiveServices) when the program needs TerminalService, InputService, RendererService, or StorageService.',
      },
    ],
    approaches: [
      {
        id: 'jsx',
        label: 'JSX app + caps',
        lang: 'tsx',
        filename: 'caps-app.tsx',
        note: 'JSX runApp already wires Live I/O. Call detectCapabilities for feature flags in the view.',
        code: `/** @jsxImportSource @tuix/jsx */
import { runApp } from '@tuix/jsx'
import {
  detectCapabilities,
  selectGraphicsProtocol,
} from '@tuix/platform'

const caps = detectCapabilities({
  env: process.env as Record<string, string>,
  columns: process.stdout.columns,
  rows: process.stdout.rows,
})
const protocol = selectGraphicsProtocol(caps)

function CapsScreen() {
  return (
    <vstack>
      <text>Color level: {String(caps.colorLevel)}</text>
      <text>Graphics protocol: {String(protocol)}</text>
    </vstack>
  )
}

await runApp(CapsScreen, { interactive: false })`,
      },
      {
        id: 'effect-mvu',
        label: 'Effect + LiveServices',
        lang: 'typescript',
        filename: 'live-effect.ts',
        note: 'Use TerminalService under LiveServices for direct writes.',
        code: `import { Effect } from 'effect'
import {
  LiveServices,
  TerminalService,
  detectCapabilities,
  selectGraphicsProtocol,
} from '@tuix/platform'

const caps = detectCapabilities({
  env: process.env as Record<string, string>,
})
const protocol = selectGraphicsProtocol(caps)

const program = Effect.gen(function* () {
  const term = yield* TerminalService
  yield* term.writeLine(\`colorLevel=\${caps.colorLevel}\`)
  yield* term.writeLine(\`graphics=\${protocol}\`)
})

await Effect.runPromise(program.pipe(Effect.provide(LiveServices)))`,
      },
    ],
    next: 'pty-session',
  },
  {
    slug: 'pty-session',
    title: 'Pseudo-Terminal session',
    level: 9,
    levelLabel: 'Advanced',
    summary: 'Spawn a Pseudo-Terminal (PTY). Write input. Resize. Read output.',
    outcome: 'A shell process starts and echo output reaches the host.',
    goals: [
      'Spawn a PTY with spawnPty from @tuix/process-manager.',
      'Subscribe to onData. Call write and resize.',
      'Use a mock backend in tests.',
    ],
    prerequisites: ['Complete the Live services and capabilities tutorial.'],
    packages: ['@tuix/process-manager', '@tuix/testing', '@tuix/jsx', '@tuix/reactive'],
    related: [
      { href: '/packages/process-manager', label: '@tuix/process-manager' },
      { href: '/docs/features/interactive-pty', label: 'Interactive PTY feature' },
      { href: '/docs/patterns/pty', label: 'PTY pattern' },
    ],
    steps: [
      {
        heading: 'Production backend',
        body: 'The production path wraps node-pty. Spawn with a command, arguments, and size.',
      },
      {
        heading: 'Lifecycle',
        body: 'Handle onData for output. Call write for input. Call resize when the host size changes. Call kill on exit.',
      },
      {
        heading: 'Tests',
        body: 'Use createMockPtyBackend and setDefaultPtyBackend. Unit tests do not load native modules.',
      },
    ],
    approaches: [
      {
        id: 'jsx',
        label: 'App + spawnPty',
        lang: 'tsx',
        filename: 'pty-app.tsx',
        note: 'Show status in JSX. Drive the PTY with process-manager APIs.',
        code: `/** @jsxImportSource @tuix/jsx */
import { $state } from '@tuix/reactive'
import { runApp } from '@tuix/jsx'
import { spawnPty } from '@tuix/process-manager'

function PtyStatus() {
  const line = $state('starting', 'line')

  const shell = spawnPty('bash', ['-l'], { cols: 80, rows: 24 })
  shell.onData((chunk) => {
    line.$set(chunk.slice(0, 80))
  })
  shell.write('echo hello-from-pty\\n')

  return (
    <vstack>
      <text>PTY session</text>
      <text>{line()}</text>
    </vstack>
  )
}

await runApp(PtyStatus, {
  interactive: true,
  extractState: true,
})`,
      },
      {
        id: 'effect-mvu',
        label: 'Script + mock',
        lang: 'typescript',
        filename: 'pty-script.ts',
        note: 'Direct PTY control without a full TUI. Good for workers and tests.',
        code: `import {
  spawnPty,
  createMockPtyBackend,
  setDefaultPtyBackend,
} from '@tuix/process-manager'

// Production
const shell = spawnPty('bash', ['-l'], { cols: 80, rows: 24 })
shell.onData((data) => process.stdout.write(data))
shell.write('echo hello\\n')
shell.resize(120, 40)

// Tests: mock backend, no native PTY
const mock = createMockPtyBackend()
setDefaultPtyBackend(mock)
const handle = spawnPty('echo', ['hi'], {}, mock)
handle.write('input')`,
      },
    ],
  },
  {
    slug: 'theming-and-tokens',
    title: 'Theming and tokens',
    level: 4,
    levelLabel: 'Intermediate',
    summary: 'Paint one widget tree in six palettes without touching widget code.',
    outcome: 'The screen repaints in a new palette when you switch the theme at runtime.',
    goals: [
      'Read color and depth from theme tokens instead of hex literals.',
      'Switch the live theme with setUITheme.',
      'Preview every built-in palette with the tuix CLI.',
    ],
    prerequisites: [
      'Finish the forms and lists tutorial.',
      'Read the theming guide for the token schema.',
    ],
    packages: ['@tuix/ui', '@tuix/themes'],
    related: [
      { href: '/docs/theming', label: 'Theming guide' },
      { href: '/packages/themes', label: '@tuix/themes' },
      { href: '/packages/ui', label: '@tuix/ui' },
      { href: '/docs/components/kbd', label: 'Kbd component' },
    ],
    steps: [
      {
        heading: 'What you build',
        body: 'You render a small panel from tokens only. Then you cycle every built-in theme and the panel repaints. You do not change the widget code.',
      },
      {
        heading: 'Take color from the hook',
        body: 'Call useUITheme inside the widget. Read theme.colors for accents and theme.depth for surfaces. Never write a hex literal in a widget.',
      },
      {
        heading: 'Switch at runtime',
        body: 'Call setUITheme with another built-in theme. Every useUITheme consumer repaints because the theme is one global rune.',
      },
      {
        heading: 'Preview the palettes',
        body: 'Run the theme gallery from the CLI. Press j and k. The whole screen repaints in each palette. This proves the token path end to end.',
      },
    ],
    approaches: [
      {
        id: 'jsx',
        label: 'JSX',
        lang: 'tsx',
        filename: 'themes.tsx',
        note: 'Product path. One global rune drives every widget.',
        code: `/** @jsxImportSource @tuix/jsx */
import { $state, registerKeyHandler } from '@tuix/reactive'
import { Kbd, StatusBar, setUITheme, useUITheme } from '@tuix/ui'
import {
  vibesTheme, darkTheme, nordTheme, draculaTheme,
} from '@tuix/themes'

const PALETTES = [vibesTheme, darkTheme, nordTheme, draculaTheme]

function PalettePanel() {
  const { theme, depth } = useUITheme()
  const index = $state(0, 'palette')

  registerKeyHandler(key => {
    if (key === 'j') {
      const next = (index() + 1) % PALETTES.length
      index.$set(next)
      setUITheme(PALETTES[next]!)
    }
    if (key === 'k') {
      const next = (index() - 1 + PALETTES.length) % PALETTES.length
      index.$set(next)
      setUITheme(PALETTES[next]!)
    }
  })

  return (
    <box border="rounded" background={depth.surface} borderColor={theme.colors.border}>
      <text fg={theme.colors.primary}>{theme.name}</text>
      <text fg={theme.colors.textDim}>tokens only — no hex in widgets</text>
      <StatusBar
        facts={[{ slot: 'theme', value: theme.name, tone: 'default' }]}
        hints={[{ keys: 'j/k', label: 'cycle palette' }]}
      />
    </box>
  )
}

export default PalettePanel`,
      },
      {
        id: 'cli',
        label: 'CLI preview',
        lang: 'bash',
        filename: 'terminal',
        note: 'The tuix CLI ships the same loop as a command.',
        code: `cd packages/bin
bun src/bin/tuix.ts themes-preview

# j / k  cycle palettes (whole screen repaints)
# enter  prints the setUITheme snippet
# r      resets to vibes`,
      },
    ],
  },
]

export function getTutorial(slug: string): Tutorial | undefined {
  return tutorials.find(t => t.slug === slug)
}

export function tutorialHref(slug: string): string {
  return `/docs/tutorials/${slug}`
}

export const tutorialNav = tutorials.map(t => ({
  href: tutorialHref(t.slug),
  label: `${t.level}. ${t.title}`,
  level: t.level,
}))
