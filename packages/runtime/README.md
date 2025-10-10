# @tuix/runtime

MVU (Model-View-Update) runtime with hooks system for TUIX framework.

## Features

- **MVU Architecture**: Elm-inspired architecture with strict separation of concerns
- **Runtime Hooks**: Integration points for reactivity, JSX, and custom behaviors
- **Built-in Commands**: Common commands (delay, fetch, exec) and subscriptions
- **Smart Exit**: Automatic exit for CLI commands, continuous loop for TUI apps
- **Effect.ts Integration**: Type-safe async operations and structured concurrency

## Installation

```bash
bun add @tuix/runtime
```

## Basic Usage

### Simple Counter App

```typescript
import { Effect } from 'effect'
import { runApp } from '@tuix/runtime'

type Model = { count: number }
type Msg = { type: 'increment' } | { type: 'decrement' }

const component = {
  init: Effect.succeed([{ count: 0 }, []] as const),
  
  update: (msg: Msg, model: Model) => {
    switch (msg.type) {
      case 'increment':
        return Effect.succeed([{ count: model.count + 1 }, []] as const)
      case 'decrement':
        return Effect.succeed([{ count: model.count - 1 }, []] as const)
    }
  },
  
  view: (model: Model) => ({
    render: () => Effect.succeed(`Count: ${model.count}`)
  })
}

await Effect.runPromise(
  runApp(component, { fps: 60 })
)
```

## Runtime Hooks

Hooks provide integration points for external systems like reactivity and JSX compilation.

### Available Hooks

```typescript
import { createHooks, type RuntimeHooks } from '@tuix/runtime'

const hooks: RuntimeHooks<Model, Msg> = {
  // Called before component initialization
  beforeInit: () => Effect.sync(() => {
    console.log('Initializing...')
  }),

  // Called after component initialization
  afterInit: (model) => Effect.sync(() => {
    console.log('Initialized with model:', model)
  }),

  // Called before processing an update
  beforeUpdate: (msg, model) => Effect.sync(() => {
    console.log('Update:', msg)
  }),

  // Called after processing an update
  afterUpdate: (oldModel, newModel, msg) => Effect.sync(() => {
    // Sync reactive state here
    syncReactiveState(newModel)
  }),

  // Called before rendering
  beforeRender: (model) => Effect.sync(() => {
    // Prepare state for render
  }),

  // Called after rendering
  afterRender: (view, model) => Effect.sync(() => {
    // Track render performance
  }),

  // Called when a command is executed
  onCommand: (cmd) => Effect.sync(() => {
    // Track commands for telemetry
  }),

  // Called when a message is queued
  onMessage: (msg) => Effect.sync(() => {
    // Transform or filter messages
    return msg
  }),

  // Called on errors
  onError: (error, context) => Effect.sync(() => {
    console.error(`Error in ${context}:`, error)
  }),

  // Called on shutdown
  onShutdown: () => Effect.sync(() => {
    // Cleanup resources
  })
}

// Use hooks in your app
await Effect.runPromise(
  runApp(component, { hooks })
)
```

### Composing Hooks

```typescript
import { composeHooks } from '@tuix/runtime'

const reactiveHooks = createHooks({
  afterUpdate: (oldModel, newModel, msg) => 
    Effect.sync(() => syncReactiveState(newModel))
})

const loggingHooks = createHooks({
  beforeUpdate: (msg, model) =>
    Effect.sync(() => console.log('Update:', msg))
})

const combined = composeHooks(reactiveHooks, loggingHooks)

await Effect.runPromise(
  runApp(component, { hooks: combined })
)
```

## Built-in Commands

### Cmd Helpers

```typescript
import { Cmd } from '@tuix/runtime'
import { Duration } from 'effect'

// No-op command
const cmd1 = Cmd.none()

// Delay a message
const cmd2 = Cmd.delay(Duration.seconds(2), { type: 'timeout' })

// HTTP fetch
const cmd3 = Cmd.fetch(
  'https://api.example.com/data',
  data => ({ type: 'success', data }),
  error => ({ type: 'error', error })
)

// Execute shell command
const cmd4 = Cmd.exec(
  'ls -la',
  output => ({ type: 'output', output }),
  error => ({ type: 'error', error })
)

// Batch multiple commands
const cmd5 = Cmd.batch([cmd2, cmd3, cmd4])

// Map command message
const cmd6 = Cmd.map(cmd3, msg => ({ ...msg, timestamp: Date.now() }))

// From Effect
const cmd7 = Cmd.fromEffect(
  Effect.succeed(42),
  value => ({ type: 'loaded', value }),
  error => ({ type: 'error', error })
)
```

### Using Commands in Update

```typescript
const component = {
  update: (msg: Msg, model: Model) => {
    switch (msg.type) {
      case 'fetchData':
        return Effect.succeed([
          { ...model, loading: true },
          [
            Cmd.fetch(
              '/api/data',
              data => ({ type: 'dataLoaded', data }),
              error => ({ type: 'error', error })
            )
          ]
        ] as const)
      
      case 'dataLoaded':
        return Effect.succeed([
          { ...model, loading: false, data: msg.data },
          []
        ] as const)
    }
  }
}
```

## Subscriptions

```typescript
import { Sub } from '@tuix/runtime'
import { Duration, Stream } from 'effect'

const component = {
  // ... init, update, view ...
  
  subscriptions: (model: Model) => {
    if (!model.active) return Sub.none()
    
    // Emit tick every second
    return Sub.interval(Duration.seconds(1), { type: 'tick' })
  }
}
```

### Sub Helpers

```typescript
import { Sub } from '@tuix/runtime'

// No subscription
const sub1 = Sub.none()

// Interval subscription
const sub2 = Sub.interval(Duration.seconds(1), { type: 'tick' })

// From Stream
const events = Stream.fromAsyncIterable(eventEmitter)
const sub3 = Sub.fromStream(events, e => ({ type: 'event', e }))

// Batch subscriptions
const sub4 = Sub.batch([sub2, sub3])

// Map subscription
const sub5 = Sub.map(sub2, msg => ({ ...msg, timestamp: Date.now() }))
```

## Exit After Render

For CLI commands that don't need continuous rendering:

```typescript
// CLI command - exits after first render
await Effect.runPromise(
  runApp(cliComponent, {
    exitAfterRender: true,  // App exits after rendering once
    fullscreen: false       // Don't use alternate screen
  })
)

// TUI app - continuous loop
await Effect.runPromise(
  runApp(tuiComponent, {
    exitAfterRender: false, // Default - keeps running
    fullscreen: true,
    fps: 60
  })
)
```

## Configuration Options

```typescript
interface RuntimeConfig {
  // Target frames per second (default: 60)
  fps?: number

  // Enable mouse support (default: false)
  enableMouse?: boolean

  // Run in fullscreen mode (default: true)
  fullscreen?: boolean

  // Enable debug logging (default: false)
  debug?: boolean

  // Exit after first render - for CLI commands (default: false)
  exitAfterRender?: boolean

  // Runtime hooks for integration
  hooks?: RuntimeHooks<Model, Msg>

  // Custom error handler
  onError?: (error: unknown) => Effect<void>

  // Custom quit handler
  onQuit?: () => Effect<void>

  // Buffer size for message queue (default: 1000)
  messageBufferSize?: number

  // Enable performance monitoring (default: false)
  performanceMonitoring?: boolean
}
```

## Examples

### CLI Command with Auto-Exit

```typescript
const listCommand = {
  init: Effect.succeed([{ items: [] }, [
    Cmd.exec(
      'ls -la',
      output => ({ type: 'output', output }),
      error => ({ type: 'error', error })
    )
  ]] as const),
  
  update: (msg: Msg, model: Model) => {
    if (msg.type === 'output') {
      return Effect.succeed([
        { ...model, items: msg.output.split('\n') },
        []
      ] as const)
    }
    return Effect.succeed([model, []] as const)
  },
  
  view: (model: Model) => ({
    render: () => Effect.succeed(model.items.join('\n'))
  })
}

// Runs once and exits
await Effect.runPromise(
  runApp(listCommand, {
    exitAfterRender: true,
    fullscreen: false
  })
)
```

### Interactive TUI with Hooks

```typescript
import { createHooks } from '@tuix/runtime'

const hooks = createHooks({
  afterUpdate: (oldModel, newModel, msg) =>
    Effect.sync(() => {
      // Log all updates
      console.error('Update:', msg.type)
    }),
  
  beforeRender: (model) =>
    Effect.sync(() => {
      // Prepare reactive state
      syncState(model)
    })
})

await Effect.runPromise(
  runApp(interactiveTuiApp, {
    hooks,
    fps: 60,
    enableMouse: true,
    fullscreen: true
  })
)
```

## Testing

```bash
cd packages/runtime
bun test
```

## License

MIT
