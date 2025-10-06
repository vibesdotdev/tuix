# Reactivity System

This document outlines the TUIX reactivity system, which integrates Svelte 5 Runes with an event-driven hook system for robust local and global state management.

## How Hooks Enhance Svelte 5 Runes Reactivity

### Current State

We have multiple reactivity systems:

1.  **Svelte 5 Runes** (`$state`, `$derived`, `$effect`) - Local component reactivity
2.  **Event-Driven Hooks** - Global lifecycle and cross-component communication
3.  **Scope System** - Hierarchical context management

### Integration Opportunities

#### 1. Global State Synchronization

Hooks can broadcast state changes across the entire application:

```typescript
// In runes.ts
export function $state<T>(initial: T): StateRune<T> {
  const rune = createStateRune(initial)

  // Emit state change through hooks
  rune.$set = (newValue: T) => {
    const oldValue = rune.value
    rune.value = newValue

    // Broadcast through hook system
    hooks.emit(createHookEvent('rune:stateChange', {
      runeId: rune.id,
      oldValue,
      newValue,
      source: getCurrentScope()
    }))
  }

  return rune
}
```

#### 2. Cross-Component Reactivity

Hooks enable components to react to changes in other components:

```typescript
// Component A
const count = $state(0)

// Component B can listen
hooks.on<RuneStateChangeEvent>('rune:stateChange')
  .filter(e => e.source === 'componentA')
  .subscribe(event => {
    // React to Component A's state changes
    console.log('Component A changed:', event.newValue)
  })
```

#### 3. Lifecycle Integration

Combine rune effects with hook lifecycle events:

```typescript
export function $effect(fn: () => void | (() => void)) {
  const cleanup = createEffect(fn)

  // Hook into component lifecycle
  hooks.emit(createHookEvent('rune:effectCreated', {
    componentId: getCurrentComponentId(),
    effectId: generateId()
  }))

  // Auto-cleanup on component unmount
  hooks.onBeforeUnmount
    .filter(e => e.componentId === getCurrentComponentId())
    .once(() => cleanup?.())
}
```

#### 4. Debugging and DevTools

Hooks provide a centralized point for debugging reactive flows:

```typescript
// Enable reactive debugging
hooks.on<RuneEvent>('rune:*').subscribe(event => {
  if (DEBUG_MODE) {
    console.log('[Rune]', event.type, {
      component: event.source,
      data: event.data,
      timestamp: event.timestamp
    })
  }
})
```

#### 5. Time-Travel Debugging

Hooks enable recording and replaying state changes:

```typescript
const stateHistory: StateSnapshot[] = []

hooks.on<RuneStateChangeEvent>('rune:stateChange').subscribe(event => {
  stateHistory.push({
    timestamp: event.timestamp,
    runeId: event.runeId,
    value: event.newValue
  })
})

// Replay to any point in time
function replayToTimestamp(timestamp: Date) {
  const relevantEvents = stateHistory.filter(e => e.timestamp <= timestamp)
  // Apply state changes in order
}
```

#### 6. Persistence Layer

Hooks can automatically persist rune state:

```typescript
// Auto-save state changes
hooks.on<RuneStateChangeEvent>('rune:stateChange')
  .filter(e => e.persistent === true)
  .subscribe(async event => {
    await saveToStorage(event.runeId, event.newValue)
  })

// Restore on init
hooks.onAfterInit.subscribe(async () => {
  const savedState = await loadFromStorage()
  restoreRunes(savedState)
})
```

#### 7. Validation and Constraints

Hooks can enforce global validation rules:

```typescript
// Global validation hook
hooks.on<RuneStateChangeEvent>('rune:beforeStateChange')
  .subscribe(event => {
    const validation = validateGlobalConstraints(event)
    if (!validation.valid) {
      event.preventDefault() // Cancel the state change
      hooks.emit(createHookEvent('rune:validationError', {
        runeId: event.runeId,
        error: validation.error
      }))
    }
  })
```

#### 8. Computed Dependencies

Track and optimize derived rune dependencies:

```typescript
export function $derived<T>(fn: () => T): DerivedRune<T> {
  const rune = createDerivedRune(fn)

  // Track dependencies through hooks
  hooks.emit(createHookEvent('rune:derivedCreated', {
    runeId: rune.id,
    dependencies: capturedDependencies
  }))

  // Re-compute on dependency changes
  hooks.on<RuneStateChangeEvent>('rune:stateChange')
    .filter(e => rune.dependencies.includes(e.runeId))
    .subscribe(() => rune.recompute())
}
```

### Implementation Strategy

#### Phase 1: Event Integration

*   Add hook events to all rune operations
*   Create RuneEvent types extending BaseEvent
*   Implement event filters for rune-specific events

#### Phase 2: Lifecycle Coordination

*   Sync rune lifecycle with component lifecycle
*   Auto-cleanup of effects and subscriptions
*   Proper dependency tracking

#### Phase 3: Developer Experience

*   Add debugging hooks
*   Implement time-travel debugging
*   Create DevTools integration

#### Phase 4: Advanced Features

*   Global state management
*   Persistence layer
*   Validation framework

### Benefits

1.  **Unified Reactivity Model**: Single system for local and global state
2.  **Better Debugging**: Centralized event stream for all reactive changes
3.  **Cross-Component Communication**: Easy reactive updates between components
4.  **Plugin Integration**: Plugins can hook into reactive state changes
5.  **Performance Monitoring**: Track reactive update performance
6.  **State Management**: Global state without additional libraries

### Example: Todo App with Hooks + Runes

```typescript
// todos.ts
const todos = $state<Todo[]>([])
const filter = $state<'all' | 'active' | 'completed'>('all')

// Emit on todo changes for plugins/persistence
hooks.on<RuneStateChangeEvent>('rune:stateChange')
  .filter(e => e.runeId === todos.id)
  .subscribe(event => {
    // Auto-save todos
    localStorage.setItem('todos', JSON.stringify(event.newValue))
  })

// todo-counter-plugin.ts
hooks.on<RuneStateChangeEvent>('rune:stateChange')
  .filter(e => e.source === 'todos')
  .subscribe(event => {
    const count = event.newValue.length
    updateStatusBar(`${count} todos`)
  })

// analytics-plugin.ts
hooks.on<TodoEvent>('todo:completed')
  .subscribe(event => {
    analytics.track('todo_completed', {
      todoId: event.todoId,
      timeToComplete: event.duration
    })
  })
```

This integration creates a powerful reactive system that combines the simplicity of Svelte 5 runes with the flexibility of event-driven architecture.

## Hook System Migration Guide

This guide helps you migrate from the legacy hook systems (CLIHooks, CommandHooks, PluginMiddleware) to the new unified hook system.

### Overview

The new unified hook system provides:

*   Single consistent API for all hooks
*   Event-based architecture with proper typing
*   Support for sync/async/Effect handlers
*   Composable hook filters
*   Better error handling

### Migration Examples

#### CLIHooks → UnifiedHooks

**Old:**

```typescript
const config: CLIConfig = {
  hooks: {
    beforeCommand: async (command, args) => {
      console.log('Before command:', command)
    },
    afterCommand: async (command, args, result) => {
      console.log('Command completed')
    },
    onError: (error, command, args) => {
      console.error('Command failed:', error)
    }
  }
}
```

**New:**

```typescript
import { getGlobalHooks } from 'tuix/cli/unified-hooks'

const hooks = getGlobalHooks(eventBus)

// Subscribe to hooks
hooks.onBeforeCommand.subscribe((event) => {
  console.log('Before command:', event.command)
})

hooks.onAfterCommand.subscribe((event) => {
  console.log('Command completed')
})

hooks.onError.subscribe((event) => {
  console.error('Command failed:', event.error)
})
```

#### CommandHooks → UnifiedHooks

**Old:**

```typescript
const commandHooks: CommandHooks = {
  beforeCommand: (args, context) => {
    console.log('Args:', args)
    console.log('Plugin:', context.metadata.name)
  },
  afterCommand: (args, result, context) => {
    console.log('Result:', result)
  },
  onError: (error, args, context) => {
    console.error('Error in plugin:', context.metadata.name, error)
  }
}
```

**New:**

```typescript
// Filter hooks by plugin context
hooks.onBeforeCommand
  .filter(event => event.source === 'my-plugin')
  .subscribe((event) => {
    console.log('Args:', event.args)
  })

hooks.onAfterCommand
  .filter(event => event.source === 'my-plugin')
  .subscribe((event) => {
    console.log('Result:', event.result)
  })

hooks.onError
  .filter(event => event.source === 'my-plugin')
  .subscribe((event) => {
    console.error('Error in plugin:', event.error)
  })
```

#### PluginMiddleware → UnifiedHooks

**Old:**

```typescript
const middleware: PluginMiddleware = {
  beforeCommand: (command, args) => {
    console.log('Command:', command.join(' '))
  },
  transformArgs: (args, command) => {
    return { ...args, transformed: true }
  },
  validateArgs: (args, command) => {
    if (!args.required) {
      return 'Missing required argument'
    }
    return true
  }
}
```

**New:**

```typescript
// Basic hooks
hooks.onBeforeCommand.subscribe((event) => {
  console.log('Command:', event.command.join(' '))
})

// Argument transformation - implement in command handler
hooks.onBeforeExecute.subscribe((event) => {
  // Modify args before execution
  event.args.transformed = true
})

// Validation
hooks.onBeforeValidate.subscribe((event) => {
  if (!event.args.required) {
    // Emit error event
    hooks.emit(createHookEvent('hook:onError', {
      error: new Error('Missing required argument'),
      command: event.command,
      args: event.args
    }))
  }
})
```

### Plugin Definition Updates

#### Using definePlugin()

**Old:**

```typescript
const plugin = definePlugin({
  metadata: { name: 'my-plugin', version: '1.0.0' },
  hooks: {
    beforeCommand: (command, args) => { ... }
  },
  middleware: {
    transformArgs: (args) => { ... }
  }
})
```

**New:**

```typescript
const plugin = definePlugin({
  metadata: { name: 'my-plugin', version: '1.0.0' },
  install: (context) => {
    const hooks = context.hooks

    // Register hooks
    hooks.onBeforeCommand.subscribe((event) => { ... })

    // Register transforms as hooks
    hooks.onBeforeExecute.subscribe((event) => {
      // Transform args here
    })
  }
})
```

#### Using BasePlugin

**Old:**

```typescript
class MyPlugin extends BasePlugin {
  hooks = {
    beforeCommand: (command, args) => { ... }
  }
}
```

**New:**

```typescript
class MyPlugin extends BasePlugin {
  async initialize() {
    // Get hooks from context
    const hooks = this.context.hooks

    // Subscribe to hooks
    hooks.onBeforeCommand.subscribe((event) => { ... })
  }
}
```

### Advanced Hook Usage

#### One-time Hooks

```typescript
// Execute only once
hooks.onPluginLoad.once((event) => {
  console.log('Plugin loaded:', event.pluginName)
})
```

#### Filtered Hooks

```typescript
// Only for specific commands
hooks.onBeforeCommand
  .filter(event => event.command[0] === 'deploy')
  .subscribe((event) => {
    console.log('Deploying...')
  })
```

#### Custom Hooks

```typescript
// Define custom event
interface CustomEvent extends BaseEvent {
  type: 'custom:myEvent'
  data: string
}

// Subscribe to custom hook
hooks.on<CustomEvent>('custom:myEvent').subscribe((event) => {
  console.log('Custom event:', event.data)
})

// Emit custom event
hooks.emit(createHookEvent('custom:myEvent', {
  data: 'Hello'
}))
```

#### Effect-based Hooks

```typescript
import { Effect } from 'effect'

hooks.onBeforeCommand.subscribe((event) =>
  Effect.gen(function* () {
    // Use Effect capabilities
    yield* Effect.log('Command starting:', event.command)

    // Perform async operations
    const config = yield* loadConfig()

    // Handle errors
    if (!config.valid) {
      yield* Effect.fail(new Error('Invalid config'))
    }
  })
)
```

### Deprecation Timeline

1.  **Current Release**: Both old and new APIs work, with deprecation warnings
2.  **Next Minor Release**: Old APIs will log warnings on every use
3.  **Next Major Release**: Old APIs will be removed completely

### Getting Help

If you need help migrating:

1.  Check the unified-hooks.ts source for all available hooks
2.  Use TypeScript autocomplete to explore the API
3.  Report issues at https://github.com/anthropics/tuix/issues 