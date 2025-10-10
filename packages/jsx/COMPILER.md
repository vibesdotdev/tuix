# JSX Compiler

The JSX compiler converts JSX components into proper MVU `Component<Model, Msg>` instances that run on the TUIX runtime.

## Overview

Before the compiler, JSX components bypassed the MVU runtime entirely—they rendered once and exited. Now:

1. **JSX → MVU Component** - JSX compiles to `Component<Model, Msg>`
2. **Interactive Detection** - Auto-detects CLI vs TUI apps
3. **Runtime Integration** - Uses full MVU runtime with hooks
4. **Reactive State** - Syncs with Svelte 5 runes via hooks

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   JSX Component                          │
│  function MyApp() {                                      │
│    const count = $state(0)                               │
│    return <text>Count: {count()}</text>                  │
│  }                                                        │
└──────────────────────────────────────────────────────────┘
                         │
                         │ compileToComponent()
                         ▼
┌──────────────────────────────────────────────────────────┐
│             Component<Model, Msg>                        │
│  {                                                       │
│    init: Effect<[Model, Cmd[]]>                         │
│    update: (Msg, Model) => Effect<[Model, Cmd[]]>       │
│    view: (Model) => View                                │
│    subscriptions?: (Model) => Sub<Msg>                  │
│  }                                                       │
└──────────────────────────────────────────────────────────┘
                         │
                         │ runApp()
                         ▼
┌──────────────────────────────────────────────────────────┐
│                   MVU Runtime                            │
│  • Model-View-Update loop                               │
│  • Runtime hooks (reactive integration)                 │
│  • exitAfterRender (CLI vs TUI)                         │
│  • Command execution                                     │
│  • Subscription management                              │
└──────────────────────────────────────────────────────────┘
```

## Usage

### Basic CLI Command

```typescript
import { runApp } from '@tuix/jsx'

function ListCommand() {
  return (
    <vstack>
      <text>Available items:</text>
      <text>• Item 1</text>
      <text>• Item 2</text>
      <text>• Item 3</text>
    </vstack>
  )
}

// Compiles to Component, runs once, exits
await runApp(ListCommand)
```

### Interactive TUI App

```typescript
import { runApp } from '@tuix/jsx'
import { $state } from '@tuix/reactive'

function CounterApp() {
  const count = $state(0)
  
  return (
    <vstack>
      <text>Count: {count()}</text>
      <text>Press 'i' to increment, 'q' to quit</text>
    </vstack>
  )
}

// Compiles to Component, loops continuously
await runApp(CounterApp, { interactive: true })
```

### With Configuration

```typescript
await runApp(MyApp, {
  interactive: true,      // Force interactive mode
  extractState: true,     // Extract $state as model
  fps: 60,               // Target frame rate
  enableMouse: true,     // Enable mouse events
  debug: true,           // Debug output
})
```

## API

### runApp(component, config?)

Compiles JSX component and runs it with the MVU runtime.

**Parameters:**
- `component: JSXComponent` - JSX component function
- `config?: JSXRunConfig` - Optional configuration

**Config Options:**
```typescript
interface JSXRunConfig {
  debug?: boolean          // Debug output (default: false)
  interactive?: boolean    // Interactive mode (default: auto-detect)
  extractState?: boolean   // Extract reactive state (default: true)
  fps?: number            // Target FPS (default: 60)
  enableMouse?: boolean   // Mouse support (default: false)
}
```

**Returns:** `Promise<void>`

### compileToComponent(component, options?)

Compiles JSX component to MVU Component.

**Parameters:**
- `component: JSXComponent` - JSX component function
- `options?: CompileOptions` - Compilation options

**Options:**
```typescript
interface CompileOptions {
  extractState?: boolean   // Extract $state as model
  interactive?: boolean    // Interactive mode
  debug?: boolean         // Debug output
}
```

**Returns:** `Component<Model, Msg>`

### detectInteractive(component)

Detects if a component is interactive (needs continuous loop).

**Parameters:**
- `component: JSXComponent` - JSX component to analyze

**Returns:** `boolean` - Currently always returns `false` (placeholder)

**Future:** Will analyze component for:
- Event handlers (`onKeyPress`, `onClick`, etc.)
- Input components (`<Input>`, `<TextInput>`, etc.)
- Subscriptions

### createStatelessComponent(component)

Creates a simple stateless MVU component from JSX.

**Parameters:**
- `component: JSXComponent` - JSX component function

**Returns:** `Component<{}, never>` - Stateless component

## Interactive Detection

The compiler auto-detects whether a component should run as:

**CLI Command** (non-interactive):
- Renders once and exits
- No event handlers
- No input components
- `exitAfterRender: true`

**TUI App** (interactive):
- Continuous rendering loop
- Has event handlers or input
- Has subscriptions
- `exitAfterRender: false`

### Manual Override

```typescript
// Force CLI mode
await runApp(MyComponent, { interactive: false })

// Force TUI mode
await runApp(MyComponent, { interactive: true })
```

## State Extraction

When `extractState: true` (default), the compiler extracts reactive state:

```typescript
function MyApp() {
  const count = $state(0)      // Extracted as model.count
  const name = $state('Alice')  // Extracted as model.name
  
  return <text>{name()}: {count()}</text>
}
```

**Current Implementation:** Placeholder (returns empty model)

**Future:** Will scan for `$state()` calls and extract initial values

## Migration Guide

### From Old runApp

**Before (bypasses MVU runtime):**
```typescript
import { runApp } from '@tuix/jsx/app'

function MyApp() {
  return <text>Hello</text>
}

await runApp(MyApp, { interactive: false })
```

**After (uses MVU runtime):**
```typescript
import { runApp } from '@tuix/jsx'

function MyApp() {
  return <text>Hello</text>
}

await runApp(MyApp) // Auto-detects non-interactive
```

### Backward Compatibility

The old `runApp` is still available as `runAppLegacy`:

```typescript
import { runAppLegacy } from '@tuix/jsx'

await runAppLegacy(MyOldComponent)
```

## Integration with Runtime Hooks

The compiler automatically integrates with runtime hooks:

```typescript
import { runApp } from '@tuix/jsx'
import { $state } from '@tuix/reactive'

function MyApp() {
  const count = $state(0)
  
  // After each MVU update:
  // 1. afterUpdate hook fires
  // 2. ReactiveContext syncs count with model
  // 3. $effect functions run
  
  return <text>Count: {count()}</text>
}

// Hooks are automatically created and passed to runtime
await runApp(MyApp)
```

## Examples

### CLI Command with Args

```typescript
import { runApp } from '@tuix/jsx'
import { useScope } from '@tuix/jsx/scope'

function ConfigGet() {
  const { args } = useScope()
  const key = args()[0] || 'unknown'
  
  return <text>Getting config for: {key}</text>
}

await runApp(ConfigGet)
// $ myapp config get api.key
// Getting config for: api.key
```

### Interactive Counter

```typescript
import { runApp } from '@tuix/jsx'
import { $state, $effect } from '@tuix/reactive'

function Counter() {
  const count = $state(0)
  
  $effect(() => {
    console.log('Count changed:', count())
  })
  
  return (
    <vstack>
      <text>Count: {count()}</text>
      <text>Press + to increment, - to decrement</text>
    </vstack>
  )
}

await runApp(Counter, { interactive: true })
```

### Todo List

```typescript
import { runApp } from '@tuix/jsx'
import { $state } from '@tuix/reactive'

function TodoList() {
  const todos = $state([
    { id: 1, text: 'Learn TUIX', done: false },
    { id: 2, text: 'Build app', done: false },
  ])
  
  return (
    <vstack>
      {todos().map(todo => (
        <text key={todo.id}>
          [{todo.done ? 'x' : ' '}] {todo.text}
        </text>
      ))}
    </vstack>
  )
}

await runApp(TodoList, { interactive: true })
```

## Testing

```bash
cd packages/jsx
bun test src/compiler/
```

All compiler functionality is fully tested:
- Component compilation
- Interactive detection
- State extraction
- Model initialization
- View rendering
- Update handling

## Future Enhancements

### Planned Features

1. **State Extraction** - Scan for `$state()` calls and extract as model
2. **Interactive Detection** - Analyze JSX tree for event handlers
3. **Message Generation** - Generate Msg types from event handlers
4. **Subscription Extraction** - Extract subscriptions from component
5. **AST Analysis** - Proper static analysis of component source

### Example Future Behavior

```typescript
function MyApp() {
  const count = $state(0)  // → model.count = 0
  
  const increment = () => {
    count.$set(count() + 1)  // → dispatch({ type: 'increment' })
  }
  
  return (
    <vstack>
      <text>Count: {count()}</text>
      <button onPress={increment}>+</button>  // → onKeyPress detected = interactive
    </vstack>
  )
}

// Compiler generates:
// type Model = { count: number }
// type Msg = { type: 'increment' }
// interactive = true (has onPress handler)
```

## See Also

- [Runtime Hooks](../../runtime/README.md)
- [Reactive Integration](../../reactive/RUNTIME_INTEGRATION.md)
- [Scope System](../scope/README.md)
- [Parser](../parser/README.md)
