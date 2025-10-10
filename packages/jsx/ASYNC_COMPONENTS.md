# Async Components in TUIX

## Overview

TUIX supports async components at the view level. The runtime automatically handles `Promise<View>` results from view functions, allowing components to perform async operations during rendering.

## What Works: Pure Async Operations

Async components can use `await` for operations that **don't require Effect services**:

```tsx
// ✅ WORKS: Async operations without services
async function MyComponent() {
  // Regular Promise-based APIs work fine
  const data = await fetch('https://api.example.com/data').then(r => r.json())
  
  return (
    <vstack>
      <text>{data.message}</text>
    </vstack>
  )
}
```

## What Doesn't Work: Effect Service Access

Async components **cannot** create new Effect execution contexts with `Effect.runPromise`:

```tsx
// ❌ DOESN'T WORK: Services not available in render
async function ConfigGet() {
  const program = Effect.gen(function* (_) {
    const storage = yield* _(StorageService)  // Service not found!
    return yield* _(storage.get('key'))
  })
  
  // This runs outside the runtime's service context
  const value = await Effect.runPromise(program.pipe(Effect.provide(LiveServices)))
  
  return <text>{value}</text>
}
```

**Why this fails:**
- `Effect.runPromise` creates a separate execution context
- Services like `StorageService` are only available within the MVU runtime's context
- The runtime provides services to `init`, `update`, and `subscriptions` - not to render functions

## The Proper MVU Pattern: Load Data in Init

For components that need Effect services, use the **proper MVU pattern**:

1. **Load data in `init`** (which has service access)
2. **Store data in model**
3. **Render synchronously from model**

```tsx
import { Effect } from 'effect'
import { Component } from '@tuix/core/types'
import { StorageService } from '@tuix/storage'

interface ConfigModel {
  value: string | null
  loading: boolean
}

type ConfigMsg = { _tag: 'Loaded'; value: string }

const ConfigGetComponent: Component<ConfigModel, ConfigMsg> = {
  // Init has access to services
  init: Effect.gen(function* (_) {
    const storage = yield* _(StorageService)
    const value = yield* _(storage.get('config.key'))
    
    return [{
      value,
      loading: false
    }, []] as const
  }),

  update: (msg, model) => Effect.succeed([model, []] as const),

  // View renders synchronously from model
  view: (model) => {
    if (model.loading) {
      return <text>Loading...</text>
    }
    
    return <text>Value: {model.value}</text>
  }
}
```

## Runtime Implementation

The runtime handles async views automatically:

```typescript
// In runtime/src/mvu/runtime/core.ts
const viewResultOrPromise = view(state.model)

// Handle async views
const viewResult = viewResultOrPromise instanceof Promise
  ? yield* _(Effect.promise(() => viewResultOrPromise))
  : viewResultOrPromise
```

## Type Support

The `Component` type allows async view functions:

```typescript
export interface Component<Model, Msg> {
  readonly view: (model: Model) => View | Promise<View>
  // ... other properties
}
```

## Summary

**Async Components:**
- ✅ Can use `await` for regular Promises (fetch, setTimeout, etc.)
- ✅ Runtime automatically handles `Promise<View>` results
- ❌ Cannot use `Effect.runPromise` to access services
- ❌ Cannot run Effects that require runtime services

**For Service-Based Operations:**
- Use proper MVU pattern
- Load data in `init` (async with service access)
- Store in model
- Render synchronously from model

This ensures proper Effect service management and follows the MVU architecture.
