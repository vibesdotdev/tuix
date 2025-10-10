# Testing Plugin

**Status:** ⚠️ Partial Implementation

The testing plugin provides CLI commands for testing TUIX applications. Currently, the commands provide UI shells but core functionality is not yet implemented.

## Available Commands

### `tuix test dashboard`
Interactive test dashboard for running and monitoring tests.

**Status:** 🔨 UI Complete, Core Not Implemented

**What Works:**
- UI layout and navigation
- Test file list rendering
- Status indicators

**Not Yet Implemented:**
- Actual test file discovery
- Running tests
- Collecting test results
- Keyboard navigation

**To Implement:**
```typescript
// In dashboard.tsx, line 44
const testFiles = glob.sync('**/*.test.ts', { cwd: process.cwd() })

// In dashboard.tsx, line 84
case 'RunTests':
  // Use Bun.spawn or similar to run: bun test <file>
  // Parse output for pass/fail
  // Update testResults map
```

---

### `tuix test benchmark`
Run performance benchmarks matching a pattern.

**Status:** 🔨 UI Complete, Core Not Implemented

**What Works:**
- Command argument parsing
- Results display formatting

**Not Yet Implemented:**
- Benchmark file discovery
- Running benchmark files
- Collecting performance metrics

**To Implement:**
```typescript
// In benchmark.tsx, line 61
case 'Start':
  const files = glob.sync(model.props.pattern, { cwd: process.cwd() })
  for (const file of files) {
    const benchmarkModule = await import(file)
    const result = await benchmarkModule.default()
    results.push(result)
  }
```

---

### `tuix test snapshot`
Manage test snapshots (list, update, clean).

**Status:** 🔨 UI Complete, Core Not Implemented

**What Works:**
- Command argument parsing
- Action selection (list/update/clean)
- Results display

**Not Yet Implemented:**
- Snapshot file discovery
- Reading snapshot metadata
- Update/clean operations

**To Implement:**
```typescript
// In snapshot.tsx, line 73
case 'Load':
  const snapshotDirs = glob.sync('**/__snapshots__', { cwd: process.cwd() })
  const snapshots: SnapshotInfo[] = []
  
  for (const dir of snapshotDirs) {
    const files = readdirSync(dir)
    for (const file of files) {
      const stats = statSync(join(dir, file))
      // Parse .snap file to count tests
      snapshots.push({
        testFile: file.replace('.snap', '.test.ts'),
        snapshotFile: join(dir, file),
        testCount: countTestsInSnapshot(join(dir, file)),
        size: stats.size,
        modified: stats.mtime,
      })
    }
  }
  
  return [{ ...model, status: 'ready', snapshots }, []]
```

---

### `tuix test profile`
Profile component performance.

**Status:** 🔨 UI Complete, Core Not Implemented

**What Works:**
- Command argument parsing
- Profile results display

**Not Yet Implemented:**
- Component loading
- Profiling execution
- Session analysis

**To Implement:**
```typescript
// In profile.tsx, line 61
case 'Start':
  const componentPath = model.props.component
  const componentModule = await import(componentPath)
  const component = componentModule.default
  
  const session = await profileComponent(component, {
    includeInit: true,
    includeView: true,
  })
  
  return [{ ...model, status: 'complete', session }, []]
```

---

## Implementation Priority

### High Priority
1. **Dashboard test discovery and execution** - Most useful command
2. **Snapshot list/update** - Needed for snapshot workflow

### Medium Priority
3. **Benchmark runner** - Performance testing support
4. **Profile execution** - Debugging performance

### Low Priority
5. **Keyboard navigation** - UX improvement
6. **Watch mode** - Development workflow enhancement

---

## Usage (When Implemented)

```bash
# Interactive test dashboard
tuix test dashboard

# Run benchmarks
tuix test benchmark "**/*.bench.ts" --iterations=100

# Manage snapshots
tuix test snapshot list
tuix test snapshot update
tuix test snapshot clean

# Profile a component
tuix test profile ./src/components/Counter.tsx --duration=5000
```

---

## Current Workarounds

Until these commands are implemented, use the testing utilities directly:

```typescript
// Instead of: tuix test dashboard
// Use: bun test --watch

// Instead of: tuix test benchmark
import { benchmark } from '@tuix/testing/perf'
const result = await benchmark('my test', () => { /* ... */ })

// Instead of: tuix test snapshot list
// Use: find . -name "*.snap"

// Instead of: tuix test profile
import { profileComponent } from '@tuix/testing/perf'
const session = await profileComponent(MyComponent)
```

---

## Contributing

If you'd like to implement these commands, see the TODOs in:
- `commands/dashboard.tsx` (lines 44, 84, 169)
- `commands/benchmark.tsx` (line 61)
- `commands/snapshot.tsx` (line 73)
- `commands/profile.tsx` (line 61)

Each TODO includes context about what needs to be implemented.

---

**Last Updated:** 2025-10-09
