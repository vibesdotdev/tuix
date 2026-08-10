/**
 * CLI/TUI patterns + Tuix-unique paradigms.
 * STE100-style prose. Code is teaching-shaped against public APIs.
 */

export type PatternSample = {
  id: string
  label: string
  lang: string
  filename: string
  code: string
  note?: string
}

export type PatternDoc = {
  slug: string
  title: string
  /** common | unique */
  kind: 'common' | 'unique'
  category: string
  summary: string
  whyItMatters: string
  howInTuix: string
  pitfalls: string[]
  related: Array<{ href: string; label: string }>
  samples?: PatternSample[]
}

export const patterns: PatternDoc[] = [
  {
    slug: 'jsx-to-mvu',
    title: 'JSX compiles to Model-View-Update',
    kind: 'unique',
    category: 'Core pipeline',
    summary:
      'JSX does not paint the terminal. The compiler turns components into Model-View-Update (MVU) units.',
    whyItMatters:
      'Web mental models assume the component tree paints the screen. In Tuix, paint always goes through the runtime view phase.',
    howInTuix:
      'Author with JSX. Call runApp from @tuix/jsx. The bridge builds init, update, and view. The Effect runtime owns the loop. Do not write ANSI strings for primary UI paint.',
    pitfalls: [
      'Do not treat JSX as a direct terminal write API.',
      'Do not skip the model when you need state that survives re-render.',
      'One-shot and interactive modes both use the same pipeline.',
    ],
    related: [
      { href: '/docs/architecture', label: 'Architecture' },
      { href: '/docs/features/jsx-compile-bridge', label: 'JSX compile bridge' },
      { href: '/docs/tutorials/hello-world', label: 'Hello world' },
    ],
    samples: [
      {
        id: 'jsx',
        label: 'JSX',
        lang: 'tsx',
        filename: 'paint.tsx',
        note: 'JSX returns structure. runApp drives MVU paint.',
        code: `/** @jsxImportSource @tuix/jsx */
import { runApp } from '@tuix/jsx'

// This is not "DOM paint". It becomes a View in the MVU loop.
function Screen() {
  return (
    <vstack>
      <text>Compiled path → runtime view</text>
    </vstack>
  )
}

await runApp(Screen, { interactive: false })`,
      },
    ],
  },
  {
    slug: 'named-state',
    title: 'Named state and view hydration',
    kind: 'unique',
    category: 'State',
    summary:
      'Under Bun, give every durable field a name. $set bridges into MVU. View hydration restores values before paint.',
    whyItMatters:
      'Anonymous $state can disappear after compile rewrites. Named fields map to the model. Without hydration, paint can show stale closures.',
    howInTuix:
      'Use $state(init, \'name\') or $states({ name: init }). Call $set to update. The runtime uses bindMvuPush so named sets become { type: \'set\', key, value }. beginViewHydration(model) runs before view so runes match the model.',
    pitfalls: [
      'Do not rely on unnamed $state for model fields under Bun.',
      'Do not keep critical UI state only in local variables outside the model.',
      'Pass extractState: true when you compile interactive JSX apps.',
    ],
    related: [
      { href: '/packages/reactive', label: '@tuix/reactive' },
      { href: '/docs/features/reactive-runes-mvu-bridge', label: 'Runes ↔ MVU' },
      { href: '/docs/tutorials/interactive-counter', label: 'Interactive counter' },
    ],
    samples: [
      {
        id: 'jsx',
        label: 'JSX + runes',
        lang: 'tsx',
        filename: 'named-state.tsx',
        note: 'Second argument is the model key. Required for durable fields under Bun.',
        code: `import { $state, $states, $derived } from '@tuix/reactive'
import { runApp } from '@tuix/jsx'

function Panel() {
  const count = $state(0, 'count')
  const { label } = $states({ label: 'ready' })
  const line = $derived(() => \`\${label()}: \${count()}\`)

  return (
    <vstack>
      <text>{line()}</text>
      <text>count.$set pushes into MVU via bindMvuPush.</text>
    </vstack>
  )
}

await runApp(Panel, { interactive: true, extractState: true })`,
      },
      {
        id: 'effect-mvu',
        label: 'Effect MVU',
        lang: 'typescript',
        filename: 'named-state-mvu.ts',
        note: 'Same idea without runes: the model is the source of truth.',
        code: `import { Effect } from 'effect'
import { runApp } from '@tuix/runtime'
import { LiveServices } from '@tuix/platform'
import { text } from '@tuix/view'
import type { Component } from '@tuix/core/types'

type Model = { count: number; label: string }
type Msg = { type: 'set'; key: 'count' | 'label'; value: number | string }

const Panel: Component<Model, Msg> = {
  init: Effect.succeed([{ count: 0, label: 'ready' }, []]),
  update: (msg, model) =>
    Effect.succeed([{ ...model, [msg.key]: msg.value }, []]),
  view: (model) => ({
    render: () =>
      Effect.succeed(text(\`\${model.label}: \${model.count}\`)),
  }),
}

await Effect.runPromise(
  runApp(Panel).pipe(Effect.provide(LiveServices)),
)`,
      },
    ],
  },
  {
    slug: 'cli-routing',
    title: 'CLI routing with Command and Scope',
    kind: 'common',
    category: 'Routing',
    summary:
      'Treat argv paths as routes. Command registers destinations. Fallback handles no match. Scope nests groups.',
    whyItMatters:
      'Terminal apps have no browser URL bar. The argv path is the navigation model. “Links” are command paths users type or select.',
    howInTuix:
      'Declare Command nodes with name, description, and component. Nest Plugin or Scope for groups such as config get. runApp matches Bun.argv against the scope tree. Fallback renders usage when nothing matches.',
    pitfalls: [
      'Do not invent a separate router for basic CLIs. Use the scope tree.',
      'Do not forget Fallback for bare invocation.',
      'Deep paths need nested scopes or multi-segment command paths.',
    ],
    related: [
      { href: '/docs/components/command', label: 'Command' },
      { href: '/docs/components/fallback', label: 'Fallback' },
      { href: '/docs/tutorials/multi-command-cli', label: 'Multi-command CLI' },
      { href: '/docs/cli', label: 'CLI guide' },
    ],
    samples: [
      {
        id: 'jsx',
        label: 'JSX routes',
        lang: 'tsx',
        filename: 'routes.tsx',
        note: 'Each Command is a route destination. Fallback is the 404/home screen.',
        code: `/** @jsxImportSource @tuix/jsx */
import { Command, Fallback, Plugin, runApp } from '@tuix/jsx'

function Version() {
  return <text>1.0.0</text>
}

function ConfigGet() {
  return <text>config get …</text>
}

function Home() {
  return (
    <vstack>
      <text>app — type a command</text>
      <text>app version</text>
      <text>app config get</text>
    </vstack>
  )
}

function App() {
  return (
    <>
      <Command name="version" description="Show version" component={Version} />
      <Plugin name="config" description="Configuration">
        <Command name="get" description="Read a key" component={ConfigGet} />
      </Plugin>
      <Fallback component={Home} />
    </>
  )
}

await runApp(App)`,
      },
      {
        id: 'effect-mvu',
        label: 'Manual argv',
        lang: 'typescript',
        filename: 'routes-mvu.ts',
        note: 'Without JSX routing, branch on argv and pick one Component.',
        code: `import { Effect } from 'effect'
import { runApp } from '@tuix/runtime'
import { LiveServices } from '@tuix/platform'
import { text } from '@tuix/view'
import type { Component } from '@tuix/core/types'

type Model = { line: string }
type Msg = never

const screen = (line: string): Component<Model, Msg> => ({
  init: Effect.succeed([{ line }, []]),
  update: (_m, model) => Effect.succeed([model, []]),
  view: (model) => ({
    render: () => Effect.succeed(text(model.line)),
  }),
})

const [cmd, sub] = process.argv.slice(2)
const app =
  cmd === 'version'
    ? screen('1.0.0')
    : cmd === 'config' && sub === 'get'
      ? screen('config get …')
      : screen('app — run: app version | app config get')

await Effect.runPromise(runApp(app).pipe(Effect.provide(LiveServices)))`,
      },
    ],
  },
  {
    slug: 'interactive-mode',
    title: 'One-shot vs interactive',
    kind: 'unique',
    category: 'Lifecycle',
    summary:
      'One-shot apps paint once and exit. Interactive apps keep the loop open for keys and subscriptions.',
    whyItMatters:
      'CLI help and version should exit. Dashboards and editors must stay open. Wrong mode causes hangs or silent exits.',
    howInTuix:
      'Pass interactive: true or false to runApp. detectInteractive uses explicit flags, name heuristics (Interactive, Game, Editor), and source signals such as $state or TextInput. Bare *App names do not force interactive mode.',
    pitfalls: [
      'Do not leave interactive true on pure version commands.',
      'Do not expect subscriptions to keep a one-shot process alive.',
      'Do not rely only on component name *App for interactivity.',
    ],
    related: [
      { href: '/docs/tutorials/hello-world', label: 'Hello world (one-shot)' },
      { href: '/docs/tutorials/interactive-counter', label: 'Counter (interactive)' },
      { href: '/packages/jsx', label: '@tuix/jsx' },
    ],
    samples: [
      {
        id: 'jsx',
        label: 'Mode flags',
        lang: 'tsx',
        filename: 'modes.tsx',
        code: `import { runApp } from '@tuix/jsx'

// One-shot: paint and exit
await runApp(Version, { interactive: false })

// Interactive: keep the loop open
await runApp(Dashboard, { interactive: true, extractState: true })`,
      },
    ],
  },
  {
    slug: 'async-cmd-sub',
    title: 'Async work with Cmd and Sub',
    kind: 'common',
    category: 'Async',
    summary:
      'Commands run one-shot Effects that return messages. Subscriptions stream messages over time.',
    whyItMatters:
      'Terminal UIs need timers, fetches, and process output without blocking the render loop.',
    howInTuix:
      'Return Cmd values from update (or batch them). Use Cmd.delay, Cmd.fromEffect, Cmd.fetch, Cmd.exec. Declare subscriptions(model) with Sub.interval, Sub.fromStream, or Sub.batch. RuntimeHooks can observe or cancel messages.',
    pitfalls: [
      'Do not await long work inside view. Use Cmd.',
      'One-shot mode may exit before subscriptions deliver.',
      'Handle success and failure messages in update.',
    ],
    related: [
      { href: '/packages/runtime', label: '@tuix/runtime' },
      { href: '/docs/features/runtime-hooks', label: 'RuntimeHooks' },
      { href: '/docs/tutorials/async-commands', label: 'Async commands tutorial' },
    ],
    samples: [
      {
        id: 'effect-mvu',
        label: 'Effect MVU',
        lang: 'typescript',
        filename: 'async-mvu.ts',
        note: 'Cmd returns a message. Sub.interval feeds ticks while interactive.',
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
    { ticks: 0, status: 'boot' },
    [
      Cmd.delay(Duration.millis(10), { type: 'tick' } as Msg),
      Cmd.fromEffect(
        Effect.succeed('ok'),
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
          text(\`ticks=\${model.ticks}\`),
          text(\`status=\${model.status}\`),
        ]),
      ),
  }),
  subscriptions: () => Sub.interval(Duration.seconds(1), { type: 'tick' }),
}

await Effect.runPromise(runApp(App).pipe(Effect.provide(LiveServices)))`,
      },
      {
        id: 'jsx',
        label: 'JSX note',
        lang: 'tsx',
        filename: 'async-jsx.md',
        note: 'JSX apps still land in the same runtime. For timers and fetch, prefer Effect MVU or runtime Cmd helpers from compiled components.',
        code: `// Prefer Effect MVU for explicit Cmd / Sub.
// From JSX, keep durable results in named $state after async work completes.
// Example: after a fetch, call result.$set(data) so paint hydrates from the model.`,
      },
    ],
  },
  {
    slug: 'layout',
    title: 'Layout and viewport',
    kind: 'common',
    category: 'Layout',
    summary:
      'Stack and row primitives build structure. Viewport clips long content. Shell layouts frame full screens.',
    whyItMatters:
      'Terminal width and height are limited. Users need clear regions, scroll, and consistent chrome.',
    howInTuix:
      'Use <vstack>, <hstack>, and <box> intrinsics for light layout. Use Box, Flex, Row, Column, Viewport, StaticLayout, and InteractiveLayout from @tuix/ui for product screens. View flexbox supports reverse and wrap.',
    pitfalls: [
      'Do not print unbounded logs without Viewport or scroll.',
      'Do not mix many absolute widths without testing small terminals.',
      'Prefer one shell layout per interactive screen.',
    ],
    related: [
      { href: '/docs/components/viewport', label: 'Viewport' },
      { href: '/docs/components/flex', label: 'Flex' },
      { href: '/docs/tutorials/layout-and-viewport', label: 'Layout tutorial' },
      { href: '/packages/view', label: '@tuix/view' },
    ],
    samples: [
      {
        id: 'jsx',
        label: 'JSX layout',
        lang: 'tsx',
        filename: 'layout.tsx',
        code: `/** @jsxImportSource @tuix/jsx */
import { runApp } from '@tuix/jsx'
import { Box, Header, Text, Viewport, Flex } from '@tuix/ui'

function Screen() {
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

await runApp(Screen, { interactive: true })`,
      },
    ],
  },
  {
    slug: 'keys-focus-paste',
    title: 'Keys, focus, and paste',
    kind: 'common',
    category: 'Input',
    summary:
      'Interactive apps stream keys, focus CSI, and bracketed paste. readLine completes multi-character input on Enter.',
    whyItMatters:
      'Keyboard is the primary device. Paste must not become fake key spam. Focus events matter for multi-field forms.',
    howInTuix:
      'Live InputService streams keys, mouse, paste, resize, and focus. registerKeyHandler attaches app-level key logic. Form widgets manage focus. extractBracketedPaste and paste accumulators live under core. readLine uses a continuous PubSub subscription so multi-character lines work.',
    pitfalls: [
      'Do not re-subscribe per key for readLine. Use the continuous path.',
      'Do not treat paste chunks as single characters.',
      'Enable interactive mode before you expect key streams.',
    ],
    related: [
      { href: '/docs/capabilities', label: 'Terminal & graphics' },
      { href: '/docs/features/bracketed-paste', label: 'Bracketed paste' },
      { href: '/docs/tutorials/keys-and-input', label: 'Keys tutorial' },
      { href: '/packages/input', label: '@tuix/input' },
    ],
    samples: [
      {
        id: 'jsx',
        label: 'JSX keys',
        lang: 'tsx',
        filename: 'keys.tsx',
        note: 'registerKeyHandler is the low-level hook. Prefer widgets when they already handle keys.',
        code: `/** @jsxImportSource @tuix/jsx */
import { $state, registerKeyHandler } from '@tuix/reactive'
import { runApp } from '@tuix/jsx'

function KeyProbe() {
  const last = $state('(none)', 'last')

  registerKeyHandler((key) => {
    if (key === 'q') last.$set('quit requested')
    else last.$set(key)
  })

  return (
    <vstack>
      <text>Press keys. q marks quit.</text>
      <text>Last: {last()}</text>
    </vstack>
  )
}

await runApp(KeyProbe, { interactive: true, extractState: true })`,
      },
    ],
  },
  {
    slug: 'platform-live',
    title: 'Platform facade and Live services',
    kind: 'unique',
    category: 'I/O ownership',
    summary:
      'core owns Live implementations. platform is the public facade apps should import.',
    whyItMatters:
      'Wrong imports couple apps to private paths. Tests need stable Tags. Ownership stays clear for architecture gates.',
    howInTuix:
      'Import LiveServices, detectCapabilities, and graphics helpers from @tuix/platform. Provide LiveServices to Effect programs. Provide test fakes with the same service Tags.',
    pitfalls: [
      'Do not import deep core Live paths from app code when platform exports exist.',
      'Do not skip Effect.provide(LiveServices) for programs that need TerminalService.',
    ],
    related: [
      { href: '/packages/platform', label: '@tuix/platform' },
      { href: '/docs/features/platform-live-services', label: 'LiveServices feature' },
      { href: '/docs/tutorials/live-services', label: 'Live services tutorial' },
    ],
  },
  {
    slug: 'capabilities-graphics',
    title: 'Capabilities and graphics',
    kind: 'common',
    category: 'Terminal',
    summary:
      'Detect terminal features with a pure function. Encode images with sixel, Kitty, or iTerm2. Fall back to cells.',
    whyItMatters:
      'Terminals differ. Safe apps adapt. CI can force probes without a real teletypewriter (TTY).',
    howInTuix:
      'Call detectCapabilities({ env, probe? }). Use TUIX_PROBE_* overrides in continuous integration (CI). Call selectGraphicsProtocol and encodeGraphics. Check the fallback flag before write.',
    pitfalls: [
      'Do not assume truecolor or sixel on every host.',
      'Do not skip cell fallback when no protocol fits.',
    ],
    related: [
      { href: '/docs/capabilities', label: 'Terminal & graphics guide' },
      { href: '/docs/features/capability-detection', label: 'Capability detection' },
      { href: '/docs/features/graphics-encode-decode', label: 'Graphics encode' },
    ],
  },
  {
    slug: 'pty',
    title: 'Interactive child processes (PTY)',
    kind: 'common',
    category: 'Process',
    summary:
      'Spawn an interactive Pseudo-Terminal (PTY) for shells and TTY-aware tools.',
    whyItMatters:
      'Plain pipes break password prompts and full-screen child TUIs. PTY preserves a terminal device.',
    howInTuix:
      'Use spawnPty from @tuix/process-manager. Production uses node-pty. Mock backends keep unit tests free of native modules. Resize when the host size changes.',
    pitfalls: [
      'Do not use Bun.spawn alone when the child needs a TTY.',
      'Do not forget resize on host SIGWINCH-style changes.',
    ],
    related: [
      { href: '/docs/tutorials/pty-session', label: 'PTY tutorial' },
      { href: '/docs/features/interactive-pty', label: 'Interactive PTY feature' },
      { href: '/packages/process-manager', label: '@tuix/process-manager' },
    ],
  },
  {
    slug: 'runtime-hooks',
    title: 'RuntimeHooks and error recovery',
    kind: 'unique',
    category: 'Runtime',
    summary:
      'Hooks observe the loop. onMessage can cancel work. Render errors can trip a circuit breaker.',
    whyItMatters:
      'Production TUIs need observability and safety when update or view fails.',
    howInTuix:
      'Pass RuntimeHooks into the runtime. onMessage may return null to cancel. onError and consecutive render error limits protect the session. See FEAT-rt-001 and FEAT-rt-002.',
    pitfalls: [
      'Do not ignore render error budgets in long-running dashboards.',
      'Do not use onMessage for core business logic only. Prefer update.',
    ],
    related: [
      { href: '/docs/features/runtime-hooks', label: 'RuntimeHooks' },
      { href: '/docs/features/error-recovery-circuit-break', label: 'Error recovery' },
      { href: '/packages/runtime', label: '@tuix/runtime' },
    ],
  },
  {
    slug: 'storage-config',
    title: 'Storage and configuration',
    kind: 'common',
    category: 'Data',
    summary:
      'Persist keys with storage adapters. Load config from JSON, YAML, TOML, or env.',
    whyItMatters:
      'CLIs need user settings and caches without ad-hoc file code in every command.',
    howInTuix:
      'Use @tuix/storage for memory and filesystem backends and useStorage. Use @tuix/config for structured load and store. Provide storage through Live services when the app already uses platform layers.',
    pitfalls: [
      'Do not hardcode paths without a storage adapter in multi-platform apps.',
      'Validate config before you write it back.',
    ],
    related: [
      { href: '/packages/storage', label: '@tuix/storage' },
      { href: '/packages/config', label: '@tuix/config' },
    ],
  },
]

export const patternCategories = [
  'Core pipeline',
  'State',
  'Routing',
  'Lifecycle',
  'Async',
  'Layout',
  'Input',
  'I/O ownership',
  'Terminal',
  'Process',
  'Runtime',
  'Data',
] as const

export function getPattern(slug: string): PatternDoc | undefined {
  return patterns.find((p) => p.slug === slug)
}

export function patternsByCategory(): Array<{ category: string; items: PatternDoc[] }> {
  return patternCategories
    .map((category) => ({
      category,
      items: patterns.filter((p) => p.category === category),
    }))
    .filter((g) => g.items.length > 0)
}

export function patternHref(slug: string): string {
  return `/docs/patterns/${slug}`
}

export const uniquePatterns = patterns.filter((p) => p.kind === 'unique')
export const commonPatterns = patterns.filter((p) => p.kind === 'common')
