# Tuix CLI Plugins & Commands

How command routing and plugin grouping actually work in this checkout.
The old version of this file described a `@tuix/plugins/*` package family
and a `tuix plugin install` workflow that never shipped — it is retired.
What exists is simpler and lives in `@tuix/jsx`.

## The three authoring tags

```tsx
import { Command, Plugin, Fallback } from '@tuix/jsx'

export default function App() {
  return (
    <>
      <Command name="version" description="Show version" component={Version} />
      <Command name="help" description="Help explorer" component={Help} interactive />

      <Plugin name="config" description="Manage configuration">
        <Command name="get" description="Get one value" component={ConfigGet} />
        <Command name="set" description="Set one value" component={ConfigSet} />
      </Plugin>

      <Fallback component={Welcome} />
    </>
  )
}
```

- **`<Command>`** registers an executable route (`tuix <name>`). Set
  `interactive` for full-screen surfaces; omit it for one-shot renders
  that print and exit.
- **`<Plugin>`** is a scope that groups commands under a path prefix
  (`tuix config get <key>`). It is the only grouping mechanism — there is
  no separate plugin registry, installer, or marketplace.
- **`<Fallback>`** renders when argv matches no route (bare `tuix` or an
  unknown path).

## Routing

`runApp` (from `@tuix/jsx`) parses `process.argv` into a route
(`activeRouteStore.initFromArgv()`), walks the JSX tree once so every
`Command`/`Plugin` registers its scope with the global scope manager,
then renders the matching scope's component. Longest-prefix wins; extra
path segments become positional args; `--flags` are parsed with type
coercion. Interactivity is decided by the *active surface* (`interactive`
on the matched command, or detected from the fallback), not by the root
component's name.

## Scope internals

`Command` and `Plugin` are thin wrappers over `<Scope>`. Scopes:

- register into the global `ScopeManager` (children before parents),
- link plugins to parents via `metadata._parentScopeId`,
- get path fixes applied after registration (`fixScopePaths`),
- gate rendering on `activeRouteStore.matches(path)`.

## What "plugin packages" means here

Ecosystem packages (`@tuix/config`, `@tuix/logger`, `@tuix/process-manager`,
`@tuix/telemetry`, `@tuix/update`, `@tuix/debug`) each export a module +
JSX components you can wire into your app's runtime bootstrap.
`@tuix/app-presets` provides factories that compose them:

```ts
import { createAppPreset } from '@tuix/app-presets'
```

See [MODULES.md](./MODULES.md) for the package map and
[MODULE_CATALOG.md](../spec/20-catalog/MODULE_CATALOG.md) for status.

## Testing routes

`@tuix/docs` can extract a command catalog from a JSX app
(`extractAppDoc`) — this is what `tuix help` renders. The demo app
(`apps/demo/src/app.tsx`) is the reference wiring.
