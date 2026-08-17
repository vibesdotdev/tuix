# Quickstart

Build a minimal terminal app with JSX, runes, and Effect MVU.

## Counter

```tsx
/** @jsxImportSource @tuix/jsx */
import { $state } from '@tuix/reactive'
import { Fallback, runApp } from '@tuix/jsx'

function Counter() {
  const count = $state(0, 'count')
  return (
    <vstack>
      <text>Count: {count()}</text>
    </vstack>
  )
}

export default function App() {
  return <Fallback component={Counter} />
}

await runApp(App, { interactive: true })
```

Named `$state(0, 'count')` or `$states({ count: 0 })` is required under Bun so the model field survives compile. Updates use `$set`, which bridges into MVU via `bindMvuPush` so the next paint hydrates correctly.

`runApp` routes by argv (see the CLI section below), so a bare component renders
behind a `Fallback` when no command is given. `compileToComponent` remains available
for embedding a JSX surface inside an existing Effect program.

## CLI app with commands

```tsx
import { Command, Fallback } from '@tuix/jsx'
import { runApp } from '@tuix/jsx'

function Version() {
  return <text>1.0.0</text>
}

export function App() {
  return (
    <>
      <Command name="version" description="Show version" component={Version} />
      <Fallback component={() => <text>Run: app version</text>} />
    </>
  )
}

await runApp(App)
```

## Services

Provide live terminal I/O from the platform facade:

```ts
import { LiveServices, detectCapabilities, encodeGraphics } from '@tuix/platform'
```

Live implementations physically live under `@tuix/core`; `@tuix/platform` re-exports them for apps.

## Tests

```bash
bun test
bun test tests/architecture
bun test tests/catalog-honesty.test.ts
```

## Next

- [Architecture](./architecture.md)
- Specs under `spec/`
