# @tuix/storage

Key-value storage with TTL support for TUIX framework.

## Features

- **Multiple Backends**: In-memory and filesystem storage implementations
- **TTL Support**: Automatic expiration of entries with time-to-live
- **Effect Integration**: Built on Effect.ts for type-safe async operations
- **Plugin System**: JSX component integration for easy context access

## Installation

```bash
bun add @tuix/storage
```

## Usage

### In-Memory Storage

```typescript
import { Effect } from 'effect'
import { makeMemoryStorage, MemoryStorageLayer } from '@tuix/storage'

// Create storage instance
const storage = makeMemoryStorage()

// Or use as Effect layer
const program = Effect.gen(function* () {
  const storage = yield* StorageService
  
  // Set a value
  yield* storage.set('user:123', { name: 'Alice', age: 30 })
  
  // Get a value
  const user = yield* storage.get('user:123')
  console.log(user) // { name: 'Alice', age: 30 }
  
  // Set with TTL (expires in 1 hour)
  yield* storage.set('session:abc', 'active', { ttl: 3600000 })
  
  // List all keys with prefix
  const userKeys = yield* storage.keys('user:')
  
  // Delete a key
  yield* storage.delete('user:123')
  
  // Clear all keys with prefix
  yield* storage.clear('session:')
})

await Effect.runPromise(
  program.pipe(Effect.provide(MemoryStorageLayer))
)
```

### Filesystem Storage

```typescript
import { FilesystemStorageLayer } from '@tuix/storage'

const program = Effect.gen(function* () {
  const storage = yield* StorageService
  
  // Data persists to /tmp/myapp-storage
  yield* storage.set('config', { theme: 'dark' })
})

await Effect.runPromise(
  program.pipe(Effect.provide(FilesystemStorageLayer('/tmp/myapp-storage')))
)
```

### Storage Plugin (JSX Integration)

**Note**: Plugin integration will be fully implemented in Phase 4 when runtime hooks are available.

```tsx
import { Storage, useStorage } from '@tuix/storage/plugin'

function MyCommand() {
  const storage = useStorage()
  
  // Use storage in your component
  await storage.set('key', 'value')
  const value = await storage.get('key')
  
  return <Text>Value: {value}</Text>
}

export function App() {
  return (
    <Storage>
      <MyCommand />
    </Storage>
  )
}
```

## API

### Storage Interface

```typescript
interface Storage {
  get<T>(key: string): Effect<T | null, StorageError>
  set<T>(key: string, value: T, options?: { ttl?: number }): Effect<void, StorageError>
  delete(key: string): Effect<boolean, StorageError>
  has(key: string): Effect<boolean, StorageError>
  keys(prefix?: string): Effect<string[], StorageError>
  clear(prefix?: string): Effect<void, StorageError>
  entries<T>(prefix?: string): Effect<Array<StorageEntry<T>>, StorageError>
  cleanup(): Effect<number, StorageError>
}
```

### TTL (Time-To-Live)

Entries can be set with an optional TTL in milliseconds:

```typescript
// Expires in 5 minutes
await storage.set('temp-data', value, { ttl: 300000 })

// Cleanup expired entries manually
const count = await storage.cleanup()
console.log(`Removed ${count} expired entries`)
```

## Testing

All storage implementations include comprehensive test coverage:

```bash
cd packages/storage
bun test
```

## License

MIT
