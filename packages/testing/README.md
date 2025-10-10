# @tuix/testing

Comprehensive testing utilities for TUIX applications, including test harness, snapshot testing, performance benchmarking, and testing CLI commands.

## Features

- 🧪 **Test Harness** - Test MVU components in isolation
- 🎭 **Mock Services** - Mock Terminal, Input, Renderer, and Storage services
- 📸 **Snapshot Testing** - Compare TUI output against saved snapshots
- ⚡ **Performance Benchmarking** - Measure render times and FPS
- 📊 **Profiling** - Track component lifecycle performance
- 🖥️ **Testing Plugin** - CLI commands for interactive testing

## Installation

```bash
bun add -d @tuix/testing
```

## Quick Start

### Basic Component Testing

```typescript
import { testComponent, createTestHarness } from '@tuix/testing'
import { test, expect } from 'bun:test'

test('counter increments', async () => {
  const tester = testComponent(CounterComponent)
  
  // Test initialization
  const [initialModel, _] = await tester.testInit()
  expect(initialModel.count).toBe(0)
  
  // Test update
  const [newModel, __] = await tester.testUpdate(
    { _tag: 'Increment' },
    initialModel
  )
  expect(newModel.count).toBe(1)
  
  // Test view
  const output = await tester.testView(newModel)
  expect(output).toContain('Count: 1')
})
```

### Snapshot Testing

```typescript
import { expectMatchSnapshot } from '@tuix/testing'
import { box, text } from '@tuix/view'

test('dashboard renders correctly', async () => {
  const view = box(
    vstack(
      text('🎯 Counter App'),
      text('Count: 0')
    )
  )
  
  // Snapshots saved to __snapshots__/
  await expectMatchSnapshot(view, 'initial dashboard')
})

// Update snapshots with:
// UPDATE_SNAPSHOTS=true bun test
```

### Performance Benchmarking

```typescript
import { benchmark, benchmarkRender } from '@tuix/testing/perf'

test('renders within 60fps budget', async () => {
  const result = await benchmarkRender(
    'large list',
    () => renderList(1000),
    { iterations: 100, warmup: 10 }
  )
  
  expect(result.stats.mean).toBeLessThan(16.67) // 60fps
  expect(result.stats.p95).toBeLessThan(20)
})

test('compares implementations', async () => {
  const results = await benchmarkCompare([
    {
      name: 'hstack',
      fn: () => hstack(...items),
      options: { iterations: 100 }
    },
    {
      name: 'vstack', 
      fn: () => vstack(...items),
      options: { iterations: 100 }
    }
  ])
  
  console.log(formatBenchmarkResult(results[0]))
})
```

### Component Profiling

```typescript
import { profileComponent, analyzeSession } from '@tuix/testing/perf'

test('profile counter lifecycle', async () => {
  const session = await profileComponent(CounterComponent, {
    includeInit: true,
    includeUpdates: [
      { _tag: 'Increment' },
      { _tag: 'Decrement' },
    ],
    includeView: true,
  })
  
  const analysis = analyzeSession(session)
  
  expect(analysis.totalDuration).toBeLessThan(100)
  expect(analysis.warnings).toHaveLength(0)
  
  // Check for slow events
  for (const event of analysis.slowestEvents) {
    console.log(`${event.name}: ${event.duration}ms`)
  }
})
```

### Mock Services

```typescript
import { 
  createMockTerminalService,
  createMockInputService,
  createMockRendererService,
  createTestLayer
} from '@tuix/testing'

test('component with services', async () => {
  const testLayer = createTestLayer()
  
  const program = Effect.gen(function* (_) {
    const terminal = yield* _(TerminalService)
    yield* _(terminal.write('Hello'))
    
    const input = yield* _(InputService)
    input.simulateKey('enter')
  })
  
  await Effect.runPromise(Effect.provide(program, testLayer))
})
```

## Testing Plugin (CLI Commands)

Add the testing plugin to your TUIX app:

```typescript
import { Testing } from '@tuix/testing/plugin'

const app = {
  plugins: [
    Testing(),
    // ... other plugins
  ],
  commands: {
    // ... your commands
  }
}
```

Available commands:

```bash
# Interactive test dashboard
tuix test dashboard

# Run benchmarks
tuix test benchmark "**/*.bench.ts" --iterations=100

# Manage snapshots
tuix test snapshot list
tuix test snapshot update "**/*.test.ts"
tuix test snapshot clean

# Profile components
tuix test profile CounterComponent --duration=5000
```

## API Reference

### Test Harness

#### `testComponent<Model, Msg>(component, options?)`

Create a test harness for an MVU component.

Returns an object with:
- `testInit()` - Test component initialization
- `testUpdate(msg, model)` - Test update function
- `testView(model)` - Test view rendering
- `testSubscriptions(model)` - Test subscriptions

#### `createTestHarness<Model, Msg>()`

Create a full test harness with service mocks and runtime.

Methods:
- `run(component)` - Start the component
- `send(msg)` - Send a message
- `stop()` - Stop the component
- `getState()` - Get current model
- Access to mock services: `terminal`, `input`, `renderer`, `storage`

### Snapshot Testing

#### `expectMatchSnapshot(value, testName?)`

Assert that a value matches its snapshot.

- Creates new snapshot if none exists (in update mode)
- Compares against existing snapshot (in check mode)
- Fails with diff if mismatch

#### `configureSnapshots(config)`

Configure snapshot testing globally:

```typescript
configureSnapshots({
  updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true',
  stripAnsi: true,
  storage: createSnapshotStorage(),
})
```

### Performance Testing

#### `benchmark(name, fn, options?)`

Run a performance benchmark.

Options:
- `iterations` - Number of runs (default: 10)
- `warmup` - Warmup runs (default: 2)
- `minDuration` - Minimum total duration (default: 0)
- `maxDuration` - Maximum total duration (default: 30000)
- `setup` - Setup function before each iteration
- `teardown` - Teardown function after each iteration

Returns `BenchmarkResult` with statistics.

#### `benchmarkRender(name, renderFn, options?)`

Benchmark a TUI component render with FPS tracking.

#### `profileComponent(component, options?)`

Profile an MVU component's lifecycle.

Options:
- `sessionId` - Profile session ID
- `includeInit` - Profile init (default: true)
- `includeUpdates` - Array of messages to profile
- `includeView` - Profile view (default: true)

Returns `ProfileSession` with event timings.

#### `analyzeSession(session)`

Analyze a profiling session for performance issues.

Returns:
- `totalDuration` - Total session time
- `eventCount` - Number of events
- `slowestEvents` - Top 5 slowest events
- `eventsByType` - Events grouped by type
- `memoryGrowth` - Memory increase during session
- `warnings` - Performance warnings

### Mock Services

#### `createMockTerminalService(env?)`

Create a mock terminal service for testing.

Testing utilities:
- `getWrites()` - Get all write calls
- `setSize(width, height)` - Change terminal size
- `isCursorHidden()` - Check cursor visibility

#### `createMockInputService()`

Create a mock input service for testing.

Testing utilities:
- `simulateKey(key)` - Simulate key press
- `simulateMouse(event)` - Simulate mouse event
- `simulateResize(width, height)` - Simulate resize

#### `createMockRendererService()`

Create a mock renderer service for testing.

Testing utilities:
- `getLastFrame()` - Get last rendered frame
- `getFrameHistory()` - Get all rendered frames
- `getRenderCount()` - Get number of renders
- `clear()` - Clear render history

#### `createMockStorageService()`

Create a mock storage service for testing.

Testing utilities:
- `get<T>(key)` - Get stored value
- `set<T>(key, value)` - Set value
- `delete(key)` - Delete key
- `list()` - List all keys
- `clear()` - Clear all storage

#### `createTestLayer(env?)`

Create a complete Effect layer with all mock services.

## Examples

### Testing a Counter Component

```typescript
import { testComponent } from '@tuix/testing'
import { test, expect } from 'bun:test'

const CounterComponent: Component<Model, Msg> = {
  init: Effect.succeed([{ count: 0 }, []]),
  
  update: (msg, model) => Effect.gen(function* (_) {
    if (msg._tag === 'Increment') {
      return [{ count: model.count + 1 }, []]
    }
    if (msg._tag === 'Decrement') {
      return [{ count: model.count - 1 }, []]
    }
    return [model, []]
  }),
  
  view: (model) => text(`Count: ${model.count}`),
}

test('counter increments and decrements', async () => {
  const tester = testComponent(CounterComponent)
  
  const [model1, _] = await tester.testInit()
  expect(model1.count).toBe(0)
  
  const [model2, __] = await tester.testUpdate({ _tag: 'Increment' }, model1)
  expect(model2.count).toBe(1)
  
  const [model3, ___] = await tester.testUpdate({ _tag: 'Decrement' }, model2)
  expect(model3.count).toBe(0)
  
  const output = await tester.testView(model3)
  expect(output).toBe('Count: 0')
})
```

### Performance Regression Testing

```typescript
import { benchmark, meetsThreshold } from '@tuix/testing/perf'

test('no performance regression', async () => {
  const result = await benchmark('render list', () => {
    renderList(100)
  }, { iterations: 50 })
  
  const check = meetsThreshold(result.metrics[0], {
    maxDuration: 20,
    minFps: 30,
  })
  
  if (!check.pass) {
    console.error('Performance regression detected:')
    check.failures.forEach(f => console.error(`  - ${f}`))
  }
  
  expect(check.pass).toBe(true)
})
```

### Visual Regression Testing

```typescript
import { expectMatchSnapshot } from '@tuix/testing'

test('no visual regressions', async () => {
  const view = Dashboard({ count: 42, user: 'Alice' })
  await expectMatchSnapshot(view, 'dashboard with user')
})
```

## Best Practices

1. **Test Component Behavior** - Test init, update, and view separately
2. **Use Snapshots for UI** - Catch visual regressions automatically
3. **Benchmark Critical Paths** - Profile rendering of large lists/views
4. **Mock External Services** - Use mock services for isolated testing
5. **Profile Lifecycle Events** - Find performance bottlenecks
6. **Set Performance Budgets** - Use thresholds to prevent regressions

## Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test path/to/test.ts

# Update snapshots
UPDATE_SNAPSHOTS=true bun test

# Run with coverage
bun test --coverage

# Watch mode
bun test --watch
```

## Directory Structure

```
packages/testing/src/
├── snapshot/          # Snapshot testing
│   ├── matcher.ts     # Test matcher
│   ├── serializer.ts  # Serialization
│   └── storage.ts     # File storage
├── perf/              # Performance testing
│   ├── benchmark.ts   # Benchmarking
│   ├── metrics.ts     # Statistics
│   └── profiler.ts    # Profiling
├── plugin/            # Testing plugin
│   ├── Testing.tsx    # Plugin component
│   └── commands/      # CLI commands
├── harness.ts         # Test harness
├── testUtils.ts       # Mock services
├── visualTest.ts      # Visual testing
└── inputAdapter.ts    # Input simulation
```

## Related Packages

- `@tuix/core` - Core types and services
- `@tuix/view` - View primitives
- `@tuix/runtime` - MVU runtime
- `@tuix/jsx` - JSX compilation

## License

MIT
