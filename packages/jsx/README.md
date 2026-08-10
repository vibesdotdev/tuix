# @tuix/jsx

Primary authoring surface for Tuix applications.

Use this package to build terminal apps with JSX primitives (`<text>`, `<box>`, `<flex>`, etc.) while the runtime executes MVU/effect orchestration underneath.

## Install

```bash
bun add @tuix/jsx
```

## JSX Runtime Setup

In `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@tuix/jsx"
  }
}
```

## Minimal Example

```tsx
import { runApp } from '@tuix/jsx'
import { $state } from '@tuix/reactive'

function Counter() {
  const count = $state(0)

  return (
    <box padding={1} border="rounded" gap={1}>
      <text>Count: {count()}</text>
      <button onClick={() => count.$set(count() + 1)}>Increment</button>
    </box>
  )
}

runApp(Counter)
```

## Public API (high-level)

- JSX factory/runtime: `jsx`, `jsxs`, `jsxDEV`, `Fragment`, `createElement`
- Rendering/runtime bridge: `render`, `runApp`
- App primitives: `Command`, `Plugin`, `Fallback`, scope components
- Compiler/parser exports for advanced users

## Package Boundaries

`@tuix/jsx` depends on:
- `@tuix/core`
- `@tuix/ansi`
- `@tuix/view`
- `@tuix/reactive`
- `@tuix/runtime`

It intentionally does **not** depend on ecosystem packages like `@tuix/config`, `@tuix/debug`, `@tuix/logger`, etc.

Those integrate at app composition level (for example via `@tuix/app-presets`).
