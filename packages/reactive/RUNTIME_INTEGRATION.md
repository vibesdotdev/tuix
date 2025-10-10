# Reactive Runtime Integration

This document explains how the @tuix/reactive package integrates with the MVU runtime via hooks.

## Overview

The reactive runtime integration enables Svelte 5 runes ($state, $derived, $effect) to work seamlessly with the MVU (Model-View-Update) architecture. State changes in the MVU model automatically sync to reactive state, and effects run after each update.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      MVU Runtime                             │
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│  │  Model   │───▶│  Update  │───▶│   View   │             │
│  └──────────┘    └──────────┘    └──────────┘             │
│        │              │                                      │
│        │              │                                      │
│        ▼              ▼                                      │
│  ┌─────────────────────────────────────┐                   │
│  │      Runtime Hooks (afterUpdate)     │                   │
│  └─────────────────────────────────────┘                   │
│                     │                                        │
└─────────────────────┼────────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │    ReactiveContext         │
         │                            │
         │  • Syncs MVU model to      │
         │    reactive $state         │
         │  • Runs $effect after      │
         │    each update             │
         │  • Manages cleanup         │
         └────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │   Svelte 5 Runes           │
         │                            │
         │  • $state (reactive values)│
         │  • $derived (computed)     │
         │  • $effect (side effects)  │
         └────────────────────────────┘
```

## Key Components

### ReactiveContext

Manages the synchronization between MVU model and reactive state.

**Responsibilities:**
- Initialize reactive state from MVU model
- Sync state when model updates
- Register and run effects after updates
- Clean up effects on shutdown

### Runtime Hooks

Three hooks integrate reactive state with the MVU runtime:

1. **afterInit** - Initialize reactive state from initial model
2. **afterUpdate** - Sync state and run effects after each update
3. **onShutdown** - Clean up all effects

## Usage

### Basic Integration

```typescript
import { Effect } from 'effect'
import { runApp } from '@tuix/runtime'
import { createReactiveHooks, $state } from '@tuix/reactive'

type Model = { count: number }
type Msg = { type: 'increment' }

// Create reactive hooks
const hooks = createReactiveHooks()

// Run app with reactive integration
await Effect.runPromise(
  runApp(component, { hooks })
)
```

### With Custom Context

```typescript
import { ReactiveContext, createReactiveHooks } from '@tuix/reactive'

// Create custom context for fine-grained control
const context = new ReactiveContext<Model, Msg>()

// Create reactive state
const count = $state(0)

// Register effect to sync
context.registerEffect(() => {
  const state = context.getState()
  if (state) {
    count.$set(state.count)
    console.log('Count changed:', state.count)
  }
})

// Create hooks with custom context
const hooks = createReactiveHooks(context)

await Effect.runPromise(
  runApp(component, { hooks })
)
```

### Using $runtimeEffect

For effects that should run after every update:

```typescript
import { $runtimeEffect, $state } from '@tuix/reactive'

const count = $state(0)

// This effect will run after each model update
$runtimeEffect(() => {
  console.log('Count is:', count())
  
  // Optional cleanup
  return () => {
    console.log('Cleaning up')
  }
})
```

## Examples

### Counter with Reactive State

```typescript
import { createReactiveHooks, $state } from '@tuix/reactive'

type Model = { count: number }
type Msg = { type: 'increment' } | { type: 'decrement' }

const component = {
  init: Effect.succeed([{ count: 0 }, []] as const),
  
  update: (msg: Msg, model: Model) => {
    const newCount = msg.type === 'increment' 
      ? model.count + 1 
      : model.count - 1
    return Effect.succeed([{ count: newCount }, []] as const)
  },
  
  view: (model: Model) => ({
    render: () => Effect.succeed(`Count: ${model.count}`)
  })
}

// Create reactive state
const reactiveCount = $state(0)

// Create context and register sync effect
const context = new ReactiveContext<Model, Msg>()
context.registerEffect(() => {
  const state = context.getState()
  if (state) {
    reactiveCount.$set(state.count)
  }
})

const hooks = createReactiveHooks(context)

await Effect.runPromise(
  runApp(component, { hooks })
)

// reactiveCount() is always in sync with model.count
```

### Todo List with Effects

```typescript
type Todo = { id: number; text: string; completed: boolean }
type Model = { todos: Todo[] }
type Msg = { type: 'toggle'; id: number }

const component = {
  init: Effect.succeed([{ todos: [] }, []] as const),
  
  update: (msg: Msg, model: Model) => {
    const todos = model.todos.map(todo =>
      todo.id === msg.id 
        ? { ...todo, completed: !todo.completed }
        : todo
    )
    return Effect.succeed([{ todos }, []] as const)
  },
  
  view: (model: Model) => ({
    render: () => Effect.succeed(
      model.todos.map(t => 
        `[${t.completed ? 'x' : ' '}] ${t.text}`
      ).join('\n')
    )
  })
}

// Track completed count
const completedCount = $state(0)

const context = new ReactiveContext<Model, Msg>()
context.registerEffect(() => {
  const state = context.getState()
  if (state) {
    const count = state.todos.filter(t => t.completed).length
    completedCount.$set(count)
  }
})

const hooks = createReactiveHooks(context)

await Effect.runPromise(
  runApp(component, { hooks })
)

// completedCount() always reflects number of completed todos
```

### Derived State

```typescript
type Model = { firstName: string; lastName: string }

const firstName = $state('')
const lastName = $state('')
const fullName = $state('')

const context = new ReactiveContext<Model, any>()
context.registerEffect(() => {
  const state = context.getState()
  if (state) {
    firstName.$set(state.firstName)
    lastName.$set(state.lastName)
    // Derive full name
    fullName.$set(`${state.firstName} ${state.lastName}`)
  }
})

const hooks = createReactiveHooks(context)
```

## Testing

All reactive integration features are fully tested:

```bash
cd packages/reactive
bun test src/runtime/hooks.test.ts
```

Tests cover:
- State synchronization
- Effect execution
- Cleanup on shutdown
- Multiple updates
- Custom contexts
- Global context

## API Reference

### ReactiveContext\<Model, Msg>

```typescript
class ReactiveContext<Model, Msg> {
  // Initialize from model
  initFromModel(model: Model): void
  
  // Get current state
  getState(): Model | null
  
  // Sync from model
  syncFromModel(model: Model): void
  
  // Register effect
  registerEffect(fn: () => void | (() => void)): void
  
  // Run all effects
  runEffects(): void
  
  // Cleanup
  cleanup(): void
}
```

### createReactiveHooks

```typescript
function createReactiveHooks<Model, Msg>(
  context?: ReactiveContext<Model, Msg>
): RuntimeHooks<Model, Msg>
```

Creates runtime hooks for reactive integration.

### createDefaultReactiveHooks

```typescript
function createDefaultReactiveHooks<Model, Msg>(): RuntimeHooks<Model, Msg>
```

Creates hooks using the global reactive context.

### getGlobalReactiveContext

```typescript
function getGlobalReactiveContext<Model, Msg>(): ReactiveContext<Model, Msg>
```

Returns the global reactive context (singleton).

### $runtimeEffect

```typescript
function $runtimeEffect(fn: () => void | (() => void)): void
```

Registers an effect to run after updates using the global context.

## Best Practices

1. **Use Custom Context for Complex Apps**
   - Provides better control and isolation
   - Easier to test

2. **Register Effects in Component Setup**
   - Effects should be registered during initialization
   - Re-register if needed after updates

3. **Always Provide Cleanup Functions**
   - Prevent memory leaks
   - Clean up subscriptions, timers, etc.

4. **Keep Effects Pure and Fast**
   - Effects run after every update
   - Avoid heavy computations

5. **Test with Different Update Patterns**
   - Rapid updates
   - Batch updates
   - Conditional updates

## Performance Considerations

- **Effect Overhead**: Effects run after each update - keep them lightweight
- **State Synchronization**: Uses $state.$set() which is O(1)
- **Cleanup Management**: Cleanups stored in array, cleaned up sequentially
- **Memory**: Each ReactiveContext maintains effect arrays

## Migration Guide

### From Direct Reactive Usage

**Before:**
```typescript
const count = $state(0)
// Manual sync needed
```

**After:**
```typescript
const context = new ReactiveContext<Model, Msg>()
const count = $state(0)

context.registerEffect(() => {
  const state = context.getState()
  if (state) count.$set(state.count)
})

const hooks = createReactiveHooks(context)
// Automatic sync via hooks
```

## Troubleshooting

### State Not Syncing

**Problem**: Reactive state doesn't update after model changes.

**Solution**: Ensure hooks are passed to runApp:
```typescript
await Effect.runPromise(
  runApp(component, { hooks }) // ← Must include hooks
)
```

### Effects Not Running

**Problem**: Registered effects don't execute.

**Solution**: Effects must be re-registered before each update if you want them to run again:
```typescript
// Register before each update
context.registerEffect(() => {
  console.log('This runs once after next update')
})
```

### Memory Leaks

**Problem**: Effects accumulate over time.

**Solution**: Always provide cleanup functions:
```typescript
context.registerEffect(() => {
  const timer = setInterval(() => {}, 1000)
  return () => clearInterval(timer) // Cleanup
})
```

## See Also

- [Runtime Hooks Documentation](../runtime/README.md)
- [Svelte 5 Runes](./src/runes/README.md)
- [Examples](./src/runtime/example.ts)
