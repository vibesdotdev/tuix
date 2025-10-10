# TUIX Architecture - Complete System Design

**Status:** DRAFT - Comprehensive reorganization plan  
**Date:** 2025-01-08  
**Purpose:** Define clear boundaries, restore MVU integration, eliminate architectural drift

---

## Executive Summary

TUIX is an **Effect-powered MVU (Model-View-Update) framework** for building terminal UIs. It was designed to provide:

1. **Elm-inspired MVU architecture** with proper separation of concerns
2. **Type-safe Effect.ts integration** for async operations and dependency injection
3. **JSX as a friendly API** over the MVU primitives
4. **Svelte 5-inspired reactivity** via runes for ergonomic state management

**Current Problem:** After monorepo split, JSX bypasses MVU entirely. Packages have unclear boundaries. Features are duplicated or incomplete.

**Solution:** Reorganize into clear layers, restore MVU as the core runtime, make JSX/reactivity proper wrappers.

---

## Core Principles

1. **MVU is the foundation** - Everything runs through Model/Update/View cycle
2. **Effect.ts everywhere** - All async operations use Effect, proper DI via Context
3. **Clear layering** - Core → Runtime → Reactivity → JSX → UI Components
4. **No bypassing** - JSX components compile to MVU, don't render directly
5. **Smart defaults** - One-shot CLI commands exit automatically, interactive TUI apps loop

---

## Package Architecture

### Layer 1: Foundation (No Dependencies)

#### **@tuix/types**
**Purpose:** Shared TypeScript types used across all packages  
**Contents:**
- Common type definitions
- Utility types
- Shared interfaces

**Status:** ✅ Keep as-is  
**Dependencies:** None

---

#### **@tuix/ansi**
**Purpose:** ANSI escape sequences, styling, colors, borders  
**Contents:**
- `style()` - Chainable style builder
- `colors` - Color constants
- `border()` - Border rendering
- Cursor movement utilities

**Status:** ✅ Keep - Core utility  
**Dependencies:** None  
**Used by:** view, ui, jsx

---

### Layer 2: Core Services (Effect-based)

#### **@tuix/core**
**Purpose:** Core framework infrastructure - services, DI, module system  
**Contents:**
- **Services:** `TerminalService`, `InputService`, `RendererService`, `StorageService`
- **Module System:** `ModuleBase`, `ModuleRegistry` for plugin architecture
- **Component Context:** DI container for MVU components
- **Error Types:** Framework error definitions
- **Types:** Core MVU types (`Component<Model, Msg>`, `View`, `Cmd`, `Sub`)

**Status:** ✅ Keep - Foundation of framework  
**Exports:**
```typescript
// Core MVU types
export interface Component<Model, Msg> {
  init: Effect<[Model, Cmd<Msg>[]], never, AppServices>
  update: (msg: Msg, model: Model) => Effect<[Model, Cmd<Msg>[]], never, AppServices>
  view: (model: Model) => View
  subscriptions?: (model: Model) => Sub<Msg>[]
}

// Services
export { TerminalService, InputService, RendererService, StorageService }

// Module system
export { ModuleBase, ModuleRegistry }
```

**Dependencies:** Effect.ts  
**Used by:** Everything

---

#### **@tuix/platform**
**Purpose:** Platform-specific implementations of core services  
**Contents:**
- Terminal I/O implementations (Node.js TTY, browser, etc.)
- Platform detection
- Service implementations (LiveServices)

**Status:** ✅ Keep - Implements core abstractions  
**Dependencies:** @tuix/core  
**Used by:** runtime

---

#### **@tuix/input**
**Purpose:** Input event parsing and management  
**Contents:**
- Keyboard event parsing
- Mouse event handling
- Key utilities (isQuit, etc.)
- ANSI sequence parsing

**Status:** ✅ Keep - Core service implementation  
**Dependencies:** @tuix/core  
**Used by:** platform, runtime

---

### Layer 3: Runtime (MVU Implementation)

#### **@tuix/runtime** ⚠️ NEEDS REORGANIZATION
**Purpose:** The MVU runtime - manages Model/Update/View loop  
**Current Contents:**
- `src/mvu/runtime/core.ts` - Runtime class
- `src/mvu/runtime/factory.ts` - runApp factory
- `src/mvu/runtime/scheduler.ts` - Frame scheduler, timers, commands
- `src/mvu/runtime/subscriptions.ts` - Subscription manager
- `src/mvu/runtime/types.ts` - Runtime types
- `src/bootstrap.ts` - Module initialization
- `src/interactive.ts` - Interactive mode helpers

**What It Should Do:**
1. **Run Components** - Execute Component<Model, Msg> with proper MVU loop
2. **Message Queue** - Central message dispatch system
3. **Command Scheduler** - Execute async commands, dispatch result messages
4. **Subscription Manager** - Handle streams of events (keyboard, timers, websockets)
5. **Render Loop** - Frame-based rendering at configurable FPS
6. **Lifecycle Management** - Init → Update Loop → Cleanup
7. **Smart Exit** - Detect non-interactive apps and exit after render

**Proposed Structure:**
```
runtime/
├── src/
│   ├── component/           # Component running
│   │   ├── init.ts         # Component initialization
│   │   ├── lifecycle.ts    # Lifecycle management
│   │   └── context.ts      # Component context/DI
│   ├── update/             # Update cycle
│   │   ├── messages.ts     # Message queue
│   │   ├── update-loop.ts  # Update execution
│   │   └── batch.ts        # Message batching
│   ├── view/               # View rendering
│   │   ├── render-loop.ts  # Frame-based rendering
│   │   ├── scheduler.ts    # Frame scheduler
│   │   └── cache.ts        # View caching
│   ├── commands/           # Command system
│   │   ├── scheduler.ts    # Command execution
│   │   ├── types.ts        # Command types
│   │   └── built-ins.ts    # Standard commands (none, batch)
│   ├── subscriptions/      # Subscription system
│   │   ├── manager.ts      # Subscription lifecycle
│   │   ├── types.ts        # Subscription types
│   │   └── built-ins.ts    # Standard subs (interval, keyboard)
│   ├── runtime.ts          # Main Runtime class
│   ├── factory.ts          # runApp factory
│   ├── types.ts            # Runtime config types
│   └── index.ts            # Public exports
└── package.json
```

**Key Primitives to Expose:**
```typescript
// Runtime execution
export function runApp<Model, Msg>(
  component: Component<Model, Msg>,
  config?: RuntimeConfig
): Effect<void, RuntimeError, AppServices>

// Runtime hooks for integration
export interface RuntimeHooks {
  beforeUpdate?: (msg: Msg, model: Model) => void
  afterUpdate?: (model: Model, msg: Msg, newModel: Model) => void
  beforeRender?: (model: Model) => void
  afterRender?: (view: View) => void
  onCommand?: (cmd: Cmd<Msg>) => void
  onSubscription?: (sub: Sub<Msg>) => void
}

// Component wrapping
export function wrapComponent<Model, Msg>(
  component: Component<Model, Msg>,
  wrapper: ComponentWrapper<Model, Msg>
): Component<Model, Msg>

// Message interception
export function interceptMessages<Msg>(
  component: Component<Model, Msg>,
  interceptor: (msg: Msg) => Msg | null
): Component<Model, Msg>
```

**Dependencies:** @tuix/core, @tuix/platform  
**Used by:** jsx, reactive  
**Status:** 🔴 CRITICAL - Needs reorganization and hook system

---

#### **@tuix/view**
**Purpose:** View primitives and layout system  
**Contents:**
- View interface implementations
- Layout primitives (vstack, hstack, flexbox)
- Text rendering
- View caching
- Lifecycle management

**Status:** ✅ Keep - Core view layer  
**Dependencies:** @tuix/core, @tuix/ansi  
**Used by:** runtime, jsx, ui

---

### Layer 4: Reactivity (Runtime Integration)

#### **@tuix/reactive** ⚠️ NEEDS REFOCUS
**Purpose:** Svelte 5-style reactivity that integrates with MVU runtime  
**Current Contents:**
- `src/runes/runes.ts` - $state, $derived, $effect
- `src/runes/jsx-lifecycle.ts` - onMount, onDestroy, etc.
- `src/state/index.ts` - Global reactive state (context, app)
- `src/events/event-bus.ts` - Event bus system

**What It Should Do:**
1. **Provide Runes** - $state, $derived, $effect as ergonomic state API
2. **Integrate with MVU** - Runes compile to Model fields and Update messages
3. **Use Runtime Hooks** - Hook into runtime's beforeUpdate/afterUpdate
4. **No Direct Rendering** - Never bypass MVU runtime

**How It Should Work:**
```typescript
// User writes this:
function Counter() {
  const count = $state(0)
  
  $effect(() => {
    console.log('Count changed:', count())
  })
  
  return { count: count() }
}

// Reactive package uses runtime hooks to:
// 1. Extract $state as Model field
// 2. Convert $state.$set() calls to Update messages
// 3. Run $effect via runtime's afterUpdate hook
// 4. Re-render via MVU cycle, not direct DOM/terminal manipulation
```

**Proposed Structure:**
```
reactive/
├── src/
│   ├── runes/
│   │   ├── state.ts        # $state implementation
│   │   ├── derived.ts      # $derived implementation
│   │   ├── effect.ts       # $effect implementation
│   │   ├── lifecycle.ts    # onMount, onDestroy (uses runtime hooks)
│   │   └── index.ts
│   ├── integration/
│   │   ├── runtime-hooks.ts    # Connect runes to MVU runtime
│   │   ├── model-mapping.ts    # Map $state to Model
│   │   ├── message-dispatch.ts # Convert state changes to messages
│   │   └── index.ts
│   ├── state/
│   │   └── global.ts       # Global reactive state (context, app)
│   ├── events/
│   │   └── event-bus.ts    # Event bus
│   └── index.ts
```

**Key Integration Points:**
```typescript
// Reactive package hooks into runtime
export function installReactiveRuntime<Model, Msg>(
  runtime: Runtime<Model, Msg>
): void {
  runtime.addHook('beforeUpdate', (msg, model) => {
    // Sync $state from model before update
  })
  
  runtime.addHook('afterUpdate', (model) => {
    // Run $effect hooks
    // Sync model changes back to $state
  })
}

// Extract reactive state for MVU
export function extractReactiveModel(
  component: () => any
): { model: Model, stateMap: Map<string, StateRune> }
```

**Dependencies:** @tuix/runtime, @tuix/core  
**Used by:** jsx  
**Status:** 🔴 CRITICAL - Remove scope management, add runtime integration

---

### Layer 5: JSX (User-Facing API)

#### **@tuix/jsx** ⚠️ NEEDS COMPLETE REWRITE
**Purpose:** JSX as a friendly wrapper over MVU + Reactivity  
**Current Problem:** Bypasses MVU entirely, renders directly to terminal

**What It Should Do:**
1. **Compile JSX to Components** - Convert JSX trees to `Component<Model, Msg>`
2. **Use Reactive Integration** - Leverage @tuix/reactive for state
3. **Provide Type-Safe Wrappers** - `<Command>`, `<Plugin>` etc. compile to proper MVU
4. **No Direct Rendering** - Always go through runtime

**Proposed Structure:**
```
jsx/
├── src/
│   ├── runtime/
│   │   ├── jsx-runtime.ts      # JSX factory functions
│   │   ├── jsx-dev-runtime.ts  # Dev mode runtime
│   │   └── types.ts            # JSX type definitions
│   ├── compiler/
│   │   ├── to-component.ts     # JSX → Component<Model, Msg>
│   │   ├── extract-state.ts    # Find all $state in tree
│   │   ├── extract-handlers.ts # Convert onClick → subscriptions
│   │   └── detect-interactive.ts # Analyze if needs continuous render
│   ├── app/
│   │   ├── Command.tsx         # <Command> wrapper
│   │   ├── Plugin.tsx          # <Plugin> wrapper
│   │   ├── Interactive.tsx     # <Interactive> explicit mode
│   │   └── runApp.ts           # Main entry point
│   ├── scope/
│   │   ├── manager.ts          # CLI routing (not runtime scopes!)
│   │   ├── types.ts
│   │   ├── stores/
│   │   └── components/
│   └── index.ts
```

**How runApp Should Work:**
```typescript
export async function runApp(
  jsxComponent: () => JSX.Element,
  config?: JSXRunConfig
): Promise<void> {
  // 1. Parse CLI args & build scope tree
  activeRouteStore.initFromArgv()
  
  // 2. Compile JSX to MVU Component
  const mvuComponent = compileToComponent(jsxComponent, {
    extractState: true,
    detectInteractive: config.interactive ?? 'auto'
  })
  
  // 3. Run with MVU runtime (NOT direct render!)
  const { runApp: mvuRunApp } = await import('@tuix/runtime')
  return Effect.runPromise(
    mvuRunApp(mvuComponent, {
      fps: isInteractive ? 60 : 1,
      exitAfterRender: !isInteractive,
      hooks: installReactiveHooks() // From @tuix/reactive
    }).pipe(Effect.provide(LiveServices))
  )
}
```

**Dependencies:** @tuix/runtime, @tuix/reactive, @tuix/view  
**Used by:** apps  
**Status:** 🔴 CRITICAL - Complete architectural rewrite needed

---

### Layer 6: UI Components (Built on JSX)

#### **@tuix/ui**
**Purpose:** High-level reusable UI components  
**Contents:**
- Forms (TextInput, Button, Checkbox, Select)
- Layout (Viewport, Flex, Box)
- Data (Table, List)
- Navigation (Tabs)
- Feedback (Spinner)

**Status:** ✅ Keep - Built on proper JSX foundation  
**Dependencies:** @tuix/jsx, @tuix/view, @tuix/ansi  
**Used by:** apps

---

### Support Packages

#### **@tuix/parser**
**Purpose:** CLI argument parsing  
**Status:** ✅ Keep - Used by scope routing  
**Dependencies:** None  
**Used by:** jsx (scope system)

#### **@tuix/logger**
**Purpose:** Structured logging  
**Status:** ✅ Keep - Useful utility  
**Dependencies:** @tuix/core  
**Used by:** runtime, debug

#### **@tuix/debug**
**Purpose:** Development tools, debug overlays  
**Status:** ✅ Keep - Development utility  
**Dependencies:** @tuix/jsx, @tuix/ui  
**Used by:** apps (dev mode)

#### **@tuix/testing**
**Purpose:** Test utilities for MVU components  
**Status:** ✅ Keep - Essential for testing  
**Dependencies:** @tuix/runtime  
**Used by:** test files

---

### Plugin Packages (Standard Plugins for Apps)

#### **@tuix/config**
**Purpose:** Plugin that adds config management to CLI apps  
**Provides:**
- Config file reading/writing (JSON/YAML/TOML)
- `<Config>` JSX component that extends app context
- Commands: `config get`, `config set`, `config list`, `config import`, `config export`
- Context extension: `context.config.get()`, `context.config.set()`

**Status:** ✅ Keep - Standard plugin for apps  
**Example Usage:**
```tsx
<Config filename="myapp.config.ts">
  <Command name="serve" component={ServeCommand} />
</Config>

// Inside ServeCommand:
const port = context.config.get('server.port', 3000)
```

**Dependencies:** @tuix/jsx, @tuix/core  
**Used by:** apps, @tuix/bin  
**Category:** Plugin

---

#### **@tuix/logger**
**Purpose:** Plugin that adds structured logging to CLI apps  
**Provides:**
- Structured logging utilities
- `<Logger>` JSX component that extends app context
- Commands: `logs view`, `logs export`, `logs clear`
- Context extension: `context.logger.info()`, `context.logger.error()`
- Log levels, transports, formatters

**Status:** ✅ Keep - Standard plugin for apps  
**Example Usage:**
```tsx
<Logger level="info" transports={[consoleTransport, fileTransport]}>
  <Command name="deploy" component={DeployCommand} />
</Logger>

// Inside DeployCommand:
context.logger.info('Starting deployment', { target: 'production' })
```

**Dependencies:** @tuix/jsx, @tuix/core  
**Used by:** apps, @tuix/bin  
**Category:** Plugin

---

#### **@tuix/process-manager**
**Purpose:** Plugin for managing long-running processes (like pm2)  
**Provides:**
- Process lifecycle management
- `<ProcessManager>` JSX component that extends app context
- Commands: `pm start`, `pm stop`, `pm restart`, `pm list`, `pm logs`
- Context extension: `context.pm.start()`, `context.pm.status()`
- Process monitoring, auto-restart, log management

**Status:** ✅ Keep - Standard plugin for apps  
**Example Usage:**
```tsx
<ProcessManager configFile="processes.json">
  <Command name="server" component={ServerCommand} />
</ProcessManager>

// Usage in terminal:
// tuix pm start server
// tuix pm logs server
```

**Dependencies:** @tuix/jsx, @tuix/core, @tuix/logger  
**Used by:** apps, @tuix/bin  
**Category:** Plugin

---

#### **@tuix/coordination**
**Purpose:** Advanced utilities for complex TUI apps with streaming data and workflows  
**Provides:**
- `WorkflowOrchestrator` - Multi-step async workflows with retry/rollback
- `EventChoreographer` - Coordinate events between plugins (e.g., process → logger)
- `EventStreamOptimizer` - Batch, throttle, deduplicate high-frequency streams
- `PerformanceMonitor` - Track throughput, response times, memory usage
- `ErrorRecoveryManager` - Circuit breakers, retry strategies, fallback handlers

**Status:** ✅ Keep as advanced utility package  
**Use Cases:**
- **Process monitoring dashboards** - Stream process output, batch UI updates
- **Real-time data streaming** - Optimize high-frequency event streams (logs, metrics)
- **Multi-step workflows** - Complex async operations with error recovery
- **Performance monitoring** - Track app performance in production

**Example Usage:**
```typescript
// Stream optimizer for log viewer
const optimizer = new EventStreamOptimizer(eventBus)
optimizer.configureBuffering('logs', { batchSize: 100, maxWait: '100ms' })
optimizer.configureThrottling('ui:update', { maxPerSecond: 30 })

// Workflow for deployment
const workflow = orchestrator.executeWorkflow('deploy', {
  steps: [
    { id: 'build', handler: buildApp },
    { id: 'test', handler: runTests },
    { id: 'deploy', handler: deployToProduction }
  ],
  retryPolicy: { maxAttempts: 3, backoff: 'exponential' }
})
```

**Dependencies:** @tuix/core, @tuix/reactive  
**Used by:** Apps with complex async workflows or streaming data  
**Category:** Advanced Utility (not a plugin, not core framework)

---

### Tooling Packages

#### **@tuix/bin**
**Purpose:** TUIX CLI binary - runs framework utilities with built-in plugins  
**Provides:**
- Binary entry point: `tuix` command
- Pre-configured with standard plugins (config, logger, pm, debug)
- Commands:
  - `tuix config get/set/list` - Config management
  - `tuix pm start/stop/list` - Process management  
  - `tuix logs view/export` - Log exploration
  - `tuix debug <app>` - Debug wrapper for user apps

**Status:** ✅ Keep - Framework CLI for plugins  
**Example Usage:**
```bash
# Use TUIX's built-in process manager
tuix pm start myapp

# View logs from managed processes
tuix logs view myapp

# Debug a user's TUIX app
tuix debug ./my-cli-app
```

**Dependencies:** All plugin packages, @tuix/jsx, @tuix/debug  
**Used by:** End users (installed globally)  
**Category:** Binary/CLI

---

## Critical Changes Needed

### 1. Runtime Reorganization

**Goal:** Clean structure, expose hooks for integration

**Actions:**
- [ ] Reorganize into component/update/view/commands/subscriptions
- [ ] Add RuntimeHooks system for reactivity integration
- [ ] Add exitAfterRender config option
- [ ] Add wrapComponent and interceptMessages utilities
- [ ] Document all primitives with examples

### 2. Reactive Runtime Integration

**Goal:** Make runes work WITH MVU, not around it

**Actions:**
- [ ] Remove all scope management (move to jsx)
- [ ] Implement runtime hook integration
- [ ] Create model extraction from $state
- [ ] Create message dispatch from state changes
- [ ] Add lifecycle hooks that use runtime hooks

### 3. JSX MVU Compilation

**Goal:** JSX compiles to Component<Model, Msg>, never renders directly

**Actions:**
- [ ] Create jsx/compiler/ module
- [ ] Implement compileToComponent()
- [ ] Implement interactive detection
- [ ] Replace current runApp with MVU-integrated version
- [ ] Add proper TypeScript types for JSX → MVU

### 4. Package Cleanup

**Actions:**
- [ ] Remove or move: config, coordination, process-manager, bin
- [ ] Keep core framework: types, ansi, core, platform, input, runtime, view, reactive, jsx, ui
- [ ] Keep tooling: parser, logger, debug, testing

---

## Success Criteria

✅ **All apps use MVU runtime** - No direct rendering  
✅ **Runes integrate cleanly** - State changes trigger updates  
✅ **JSX is a wrapper** - Compiles to Component<Model, Msg>  
✅ **Smart exit works** - CLI commands exit, TUI apps loop  
✅ **Clear boundaries** - Each package has one job  
✅ **Documented primitives** - Runtime exposes clear hooks  
✅ **Tests pass** - Existing demo apps work with new architecture

---

## Implementation Order

1. **Runtime hooks** - Add RuntimeHooks system to @tuix/runtime
2. **Reactive integration** - Connect runes to runtime hooks
3. **JSX compiler** - Build compileToComponent()
4. **Update runApp** - Use MVU runtime instead of direct render
5. **Test with demo** - Ensure config commands work
6. **Package cleanup** - Remove/move non-essential packages
7. **Documentation** - Complete API docs with examples

---

---

## Package Summary by Category

### Core Framework (Required)
- **@tuix/types** - Shared TypeScript types
- **@tuix/ansi** - Terminal styling and ANSI codes
- **@tuix/core** - Services, DI, module system, MVU types
- **@tuix/platform** - Platform-specific service implementations
- **@tuix/input** - Keyboard/mouse event handling
- **@tuix/runtime** - MVU runtime (Model/Update/View loop)
- **@tuix/view** - View primitives and layouts
- **@tuix/reactive** - Svelte 5 runes, runtime integration
- **@tuix/jsx** - JSX wrapper over MVU + reactivity
- **@tuix/ui** - High-level reusable components

### Standard Plugins (Optional but Recommended)
- **@tuix/config** - Config file management plugin
- **@tuix/logger** - Structured logging plugin
- **@tuix/process-manager** - Process lifecycle management (pm2-like)

### Advanced Utilities (Optional)
- **@tuix/coordination** - Workflow orchestration, stream optimization, performance monitoring

### Tooling
- **@tuix/bin** - TUIX CLI binary (tuix command)
- **@tuix/debug** - Debug overlays and dev tools
- **@tuix/testing** - Test utilities for MVU components
- **@tuix/parser** - CLI argument parsing

---

## Questions for Review

1. **Plugin architecture** - Do the plugin examples (Config, Logger, PM) make sense?
   - Should all plugins follow the JSX component + context extension pattern?
   - Are there other standard plugins we should provide?

2. **@tuix/bin implementation** - Current bin/tuix.ts references non-existent @tuix/cli
   - Should we create an actual CLI app using our own framework?
   - Should it be a dogfooding example of TUIX itself?

3. **Scope system** - CLI routing only, not runtime feature - correct understanding?

4. **Runtime hooks** - Is RuntimeHooks the right integration point for reactivity?

5. **Package naming** - Any renames needed?

6. **Ready to implement?** - Architecture is defined, should we begin with runtime hooks?

