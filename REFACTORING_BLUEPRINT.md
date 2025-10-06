# TUIX Core Package Split - Comprehensive Blueprint

**Generated:** 2025-10-03
**Status:** Draft
**Version:** 1.0

## Executive Summary

This blueprint outlines the comprehensive refactoring plan to split the monolithic `@tuix/core` package (156 files) into focused, single-responsibility packages. The refactoring will create 7 new packages while consolidating duplicate code and improving the overall architecture.

### Current State
- **@tuix/core**: 156 TypeScript files across 13 top-level directories
- Duplicate ANSI code exists in `@tuix/core/terminal/ansi`, `@tuix/terminal/ansi`, and `@tuix/ansi`
- Duplicate runtime code in `@tuix/core/runtime` and `@tuix/runtime`
- Mixed concerns: platform services, runtime logic, view primitives, input handling, and coordination all in core

### Target Architecture
```
@tuix/core (NEW)        - Core types, errors, constants, schemas, context
@tuix/platform          - Terminal, input, renderer, storage services
@tuix/runtime           - MVU runtime, bootstrap, module system (CONSOLIDATE)
@tuix/view              - View primitives, layouts, caching
@tuix/input             - Keyboard, mouse, focus management
@tuix/reactive          - Runes, scopes, JSX lifecycle
@tuix/coordination      - Orchestration, choreography, streams
```

---

## Part 1: File Inventory and Mapping

### 1.1 Current @tuix/core Directory Structure

```
packages/core/src/
├── constants.ts (2,520 bytes)
├── errors.ts (2,729 bytes)
├── types.ts (406 bytes)
├── index.ts (8,543 bytes)
├── integration.test.ts
├── README.md
├── context/ (3 files)
├── coordination/ (17 files)
├── input/ (10 files)
├── model/ (24 files)
├── runtime/ (14 files)
├── services/ (21 files)
├── terminal/ (25 files)
├── types/ (13 files)
├── update/ (6 files)
└── view/ (18 files)
```

### 1.2 Complete File Mapping to Target Packages

#### **@tuix/core (NEW FOCUSED PACKAGE)**
**Purpose:** Foundation types, errors, constants, schemas, and context abstractions

```
FROM packages/core/src/:
├── constants.ts                              → @tuix/core/constants.ts
├── errors.ts                                 → @tuix/core/errors.ts
├── types.ts                                  → @tuix/core/types.ts
├── types/
│   ├── core.ts                              → @tuix/core/types/core.ts
│   ├── guards.ts                            → @tuix/core/types/guards.ts
│   ├── messages.ts                          → @tuix/core/types/messages.ts
│   ├── schemas.ts                           → @tuix/core/types/schemas.ts
│   ├── values.ts                            → @tuix/core/types/values.ts
│   ├── index.ts                             → @tuix/core/types/index.ts
│   └── errors/                              → @tuix/core/types/errors/
│       ├── base.ts
│       ├── boundary.ts
│       ├── index.ts
│       ├── recovery.ts
│       ├── types.ts
│       └── utils.ts
├── context/
│   ├── component.ts                         → @tuix/core/context/component.ts
│   ├── component.test.ts                    → @tuix/core/context/component.test.ts
│   └── index.ts                             → @tuix/core/context/index.ts
└── model/context/                           → @tuix/core/model/context/
    └── [all files]

TOTAL: ~20 files
```

#### **@tuix/platform (NEW PACKAGE)**
**Purpose:** Platform services - terminal, input, renderer, storage

```
FROM packages/core/src/services/:
├── terminal.ts                              → @tuix/platform/services/terminal.ts
├── input.ts                                 → @tuix/platform/services/input.ts
├── renderer.ts                              → @tuix/platform/services/renderer.ts
├── storage.ts                               → @tuix/platform/services/storage.ts
├── module.ts                                → @tuix/platform/services/module.ts
├── index.ts                                 → @tuix/platform/services/index.ts
├── events/
│   └── types.ts                             → @tuix/platform/services/events/types.ts
└── live/
    ├── terminal.ts                          → @tuix/platform/live/terminal.ts
    ├── terminal.test.ts                     → @tuix/platform/live/terminal.test.ts
    ├── input.ts                             → @tuix/platform/live/input.ts
    ├── input.test.ts                        → @tuix/platform/live/input.test.ts
    ├── renderer.ts                          → @tuix/platform/live/renderer.ts
    ├── renderer.test.ts                     → @tuix/platform/live/renderer.test.ts
    ├── storage.ts                           → @tuix/platform/live/storage.ts
    ├── index.ts                             → @tuix/platform/live/index.ts
    └── storage/
        ├── cache.ts                         → @tuix/platform/live/storage/cache.ts
        ├── config.ts                        → @tuix/platform/live/storage/config.ts
        ├── file.ts                          → @tuix/platform/live/storage/file.ts
        ├── index.ts                         → @tuix/platform/live/storage/index.ts
        ├── state.ts                         → @tuix/platform/live/storage/state.ts
        └── transaction.ts                   → @tuix/platform/live/storage/transaction.ts

FROM packages/core/src/terminal/:
├── capabilities/                            → @tuix/platform/terminal/capabilities/
├── output/                                  → @tuix/platform/terminal/output/
│   └── string/
│       ├── width.ts
│       └── width.test.ts
└── input/
    ├── keys.ts                              → MOVE TO @tuix/input/keyboard/keys.ts
    └── index.ts                             → MOVE TO @tuix/input/keyboard/index.ts

ACTIONS:
- DELETE packages/core/src/terminal/ansi/ (duplicate of @tuix/ansi)
- KEEP terminal capabilities and output utilities in platform

TOTAL: ~25 files
```

#### **@tuix/runtime (CONSOLIDATE EXISTING)**
**Purpose:** MVU runtime, bootstrap, module system, fibers, scheduler

```
CONSOLIDATE:
FROM packages/core/src/runtime/:
├── bootstrap.ts                             → MERGE → @tuix/runtime/bootstrap.ts
├── interactive.ts                           → @tuix/runtime/interactive.ts
├── index.ts                                 → UPDATE @tuix/runtime/index.ts
├── module/
│   ├── base.ts                              → MERGE → @tuix/runtime/module/base.ts
│   └── registry.ts                          → MERGE → @tuix/runtime/module/registry.ts
└── mvu/                                     → MERGE → @tuix/runtime/mvu/
    ├── index.ts
    ├── runtime.ts
    ├── runtime.test.ts
    └── runtime/
        ├── core.ts
        ├── factory.ts
        ├── index.ts
        ├── scheduler.ts
        ├── subscriptions.ts
        └── types.ts

WITH packages/runtime/src/:
├── bootstrap.ts                             (COMPARE & MERGE)
├── interactive.ts                           (COMPARE & MERGE)
├── module/
│   ├── base.ts                              (COMPARE & MERGE)
│   └── registry.ts                          (COMPARE & MERGE)
└── mvu/                                     (COMPARE & MERGE)

KEEP FROM packages/runtime/src/:
├── bun/                                     → @tuix/runtime/bun/
├── fiber/                                   → @tuix/runtime/fiber/
└── scheduler/                               → @tuix/runtime/scheduler/

TOTAL: ~20 files after merge
```

#### **@tuix/view (NEW PACKAGE)**
**Purpose:** View primitives, layouts, caching, lifecycle

```
FROM packages/core/src/view/:
├── primitives/
│   ├── view.ts                              → @tuix/view/primitives/view.ts
│   └── view.test.ts                         → @tuix/view/primitives/view.test.ts
├── layout/
│   ├── box.ts                               → @tuix/view/layout/box.ts
│   ├── box.test.ts                          → @tuix/view/layout/box.test.ts
│   ├── dynamic-layout.ts                    → @tuix/view/layout/dynamic-layout.ts
│   ├── flexbox.ts                           → @tuix/view/layout/flexbox.ts
│   ├── flexbox.test.ts                      → @tuix/view/layout/flexbox.test.ts
│   ├── grid.ts                              → @tuix/view/layout/grid.ts
│   ├── index.ts                             → @tuix/view/layout/index.ts
│   ├── join.ts                              → @tuix/view/layout/join.ts
│   ├── positioning.ts                       → @tuix/view/layout/positioning.ts
│   ├── spacer.ts                            → @tuix/view/layout/spacer.ts
│   └── types.ts                             → @tuix/view/layout/types.ts
├── cache/
│   └── view-cache.ts                        → @tuix/view/cache/view-cache.ts
├── lifecycle/
│   └── lifecycle-manager.ts                 → @tuix/view/lifecycle/lifecycle-manager.ts
├── performance/
│   └── optimized-renderer.ts                → @tuix/view/performance/optimized-renderer.ts
├── coordination/
│   └── component-coordinator.ts             → @tuix/view/coordination/component-coordinator.ts
├── view-cache.ts                            → @tuix/view/view-cache.ts
├── viewport/                                → @tuix/view/viewport/
│   └── [all files]
└── index.ts                                 → @tuix/view/index.ts

TOTAL: ~18 files
```

#### **@tuix/input (NEW PACKAGE)**
**Purpose:** Keyboard, mouse, focus management

```
FROM packages/core/src/input/:
├── constants.ts                             → @tuix/input/constants.ts
├── errors.ts                                → @tuix/input/errors.ts
├── types.ts                                 → @tuix/input/types.ts
├── index.ts                                 → @tuix/input/index.ts
├── focus/
│   ├── manager.ts                           → @tuix/input/focus/manager.ts
│   └── manager.test.ts                      → @tuix/input/focus/manager.test.ts
└── mouse/
    ├── hitTest.ts                           → @tuix/input/mouse/hitTest.ts
    ├── hitTest.test.ts                      → @tuix/input/mouse/hitTest.test.ts
    ├── router.ts                            → @tuix/input/mouse/router.ts
    └── router.test.ts                       → @tuix/input/mouse/router.test.ts

FROM packages/core/src/terminal/input/:
├── keys.ts                                  → @tuix/input/keyboard/keys.ts
└── index.ts                                 → @tuix/input/keyboard/index.ts

FROM packages/terminal/src/input/:
├── keys.ts                                  → COMPARE & MERGE → @tuix/input/keyboard/keys.ts
└── index.ts                                 → COMPARE & MERGE → @tuix/input/keyboard/index.ts

TOTAL: ~12 files
```

#### **@tuix/reactive (NEW PACKAGE)**
**Purpose:** Runes, scopes, JSX lifecycle

```
FROM packages/core/src/update/reactivity/:
├── runes.ts                                 → @tuix/reactive/runes.ts
├── jsx-lifecycle.ts                         → @tuix/reactive/jsx-lifecycle.ts
├── events.ts                                → @tuix/reactive/events.ts
├── module.ts                                → @tuix/reactive/module.ts
├── index.ts                                 → @tuix/reactive/index.ts
└── components/
    └── reactive-component.ts                → @tuix/reactive/components/reactive-component.ts

FROM packages/core/src/model/scope/:
├── manager.ts                               → @tuix/reactive/scope/manager.ts
├── manager.test.ts                          → @tuix/reactive/scope/manager.test.ts
├── types.ts                                 → @tuix/reactive/scope/types.ts
├── index.ts                                 → @tuix/reactive/scope/index.ts
└── jsx/
    ├── components/
    │   ├── index.ts                         → @tuix/reactive/scope/jsx/components/index.ts
    │   └── Unscoped.tsx                     → @tuix/reactive/scope/jsx/components/Unscoped.tsx
    ├── hooks/
    │   ├── index.ts                         → @tuix/reactive/scope/jsx/hooks/index.ts
    │   ├── use-scope.ts                     → @tuix/reactive/scope/jsx/hooks/use-scope.ts
    │   └── use-scope.test.ts                → @tuix/reactive/scope/jsx/hooks/use-scope.test.ts
    └── stores/
        ├── currentScope.store.ts            → @tuix/reactive/scope/jsx/stores/currentScope.store.ts
        ├── index.ts                         → @tuix/reactive/scope/jsx/stores/index.ts
        ├── parentScope.store.ts             → @tuix/reactive/scope/jsx/stores/parentScope.store.ts
        └── rootScope.store.ts               → @tuix/reactive/scope/jsx/stores/rootScope.store.ts

FROM packages/core/src/model/events/:
├── event-bus.ts                             → @tuix/reactive/events/event-bus.ts
├── event-bus.test.ts                        → @tuix/reactive/events/event-bus.test.ts
├── channels.ts                              → @tuix/reactive/events/channels.ts
├── channels.test.ts                         → @tuix/reactive/events/channels.test.ts
└── index.ts                                 → @tuix/reactive/events/index.ts

TOTAL: ~24 files
```

#### **@tuix/coordination (NEW PACKAGE)**
**Purpose:** Orchestration, choreography, streams, performance monitoring

```
FROM packages/core/src/coordination/:
├── choreography.ts                          → @tuix/coordination/choreography.ts
├── choreography.test.ts                     → @tuix/coordination/choreography.test.ts
├── constants.ts                             → @tuix/coordination/constants.ts
├── errorRecovery.ts                         → @tuix/coordination/errorRecovery.ts
├── errorRecovery.test.ts                    → @tuix/coordination/errorRecovery.test.ts
├── errors.ts                                → @tuix/coordination/errors.ts
├── index.ts                                 → @tuix/coordination/index.ts
├── integrationPatterns.ts                   → @tuix/coordination/integrationPatterns.ts
├── integrationPatterns.test.ts              → @tuix/coordination/integrationPatterns.test.ts
├── module.ts                                → @tuix/coordination/module.ts
├── orchestrator.ts                          → @tuix/coordination/orchestrator.ts
├── orchestrator.test.ts                     → @tuix/coordination/orchestrator.test.ts
├── performanceMonitor.ts                    → @tuix/coordination/performanceMonitor.ts
├── performanceMonitor.test.ts               → @tuix/coordination/performanceMonitor.test.ts
├── streamOptimizer.ts                       → @tuix/coordination/streamOptimizer.ts
├── streamOptimizer.test.ts                  → @tuix/coordination/streamOptimizer.test.ts
└── types.ts                                 → @tuix/coordination/types.ts

TOTAL: 17 files
```

#### **FILES TO DELETE (Duplicates)**

```
DELETE FROM packages/core/src/:
└── terminal/ansi/                           ← DUPLICATE of @tuix/ansi package
    ├── border/
    ├── color/
    ├── core/
    ├── effects/
    ├── gradient/
    ├── render/
    ├── style/
    ├── events.ts
    ├── index.ts
    ├── module.ts
    ├── parser.ts
    └── types.ts

COMPARE AND DELETE FROM packages/terminal/src/:
└── ansi/                                    ← COMPARE with @tuix/ansi, delete if duplicate

KEEP ONLY:
@tuix/ansi package as the single source of truth for all ANSI functionality
```

#### **FILES NEEDING MERGE/COMPARISON**

```
RUNTIME FILES (packages/core/src/runtime vs packages/runtime/src):
- bootstrap.ts (DIFFERS - need to merge)
- module/registry.ts (DIFFERS - need to merge)
- All other files appear identical

INPUT FILES (packages/core/src/terminal/input vs packages/terminal/src/input):
- keys.ts (need to compare)
- index.ts (need to compare)

ANSI FILES:
- Compare packages/core/src/terminal/ansi with @tuix/ansi
- Compare packages/terminal/src/ansi with @tuix/ansi
- Keep only @tuix/ansi as canonical source
```

---

## Part 2: Package Specifications

### 2.1 @tuix/core (NEW)

**package.json:**
```json
{
  "name": "@tuix/core",
  "version": "2.0.0",
  "description": "Core types, errors, constants, and schemas for TUIX",
  "type": "module",
  "main": "./src/index.ts",
  "module": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./types": {
      "types": "./src/types/index.ts",
      "import": "./src/types/index.ts"
    },
    "./errors": {
      "types": "./src/types/errors/index.ts",
      "import": "./src/types/errors/index.ts"
    },
    "./context": {
      "types": "./src/context/index.ts",
      "import": "./src/context/index.ts"
    },
    "./*": {
      "types": "./src/*",
      "import": "./src/*"
    }
  },
  "dependencies": {
    "effect": "^3.17.14",
    "@effect/schema": "^0.75.5",
    "zod": "^4.1.11"
  }
}
```

**Exports:**
```typescript
// Core types
export * from './types'
export * as Schemas from './types/schemas'

// Error system
export {
  TerminalError,
  InputError,
  RenderError,
  StorageError,
  ConfigError,
  ComponentError,
  ApplicationError,
  ValidationError,
  ErrorUtils,
  withErrorBoundary,
  withRecovery,
  RecoveryStrategies,
} from './types/errors'

// Context
export {
  ComponentContext,
  ComponentContextRef,
  useComponentContext,
  withComponentContext,
  type ComponentContextValue,
} from './context'

// Constants
export * from './constants'

// Re-exports
export { Effect, Context, Layer, Stream, Queue, Ref } from 'effect'
export { z as Schema } from 'zod'
```

**Dependencies:**
- `effect` - Core effect system
- `@effect/schema` - Schema validation
- `zod` - Runtime validation

**Dependents:**
- ALL other @tuix packages

---

### 2.2 @tuix/platform (NEW)

**package.json:**
```json
{
  "name": "@tuix/platform",
  "version": "1.0.0",
  "description": "Platform services for TUIX - terminal, input, renderer, storage",
  "type": "module",
  "main": "./src/index.ts",
  "module": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./services": {
      "types": "./src/services/index.ts",
      "import": "./src/services/index.ts"
    },
    "./live": {
      "types": "./src/live/index.ts",
      "import": "./src/live/index.ts"
    },
    "./*": {
      "types": "./src/*",
      "import": "./src/*"
    }
  },
  "dependencies": {
    "@tuix/core": "workspace:*",
    "@tuix/ansi": "workspace:*",
    "effect": "^3.17.14"
  }
}
```

**Exports:**
```typescript
// Service interfaces
export * from './services/terminal'
export * from './services/input'
export * from './services/renderer'
export * from './services/storage'
export * from './services/module'

// Live implementations
export * from './live'

// Event types
export * from './services/events/types'
```

**Dependencies:**
- `@tuix/core` - Core types and errors
- `@tuix/ansi` - ANSI utilities
- `effect` - Effect system

**Dependents:**
- `@tuix/runtime`
- `@tuix/view`

---

### 2.3 @tuix/runtime (CONSOLIDATED)

**package.json:**
```json
{
  "name": "@tuix/runtime",
  "version": "2.0.0",
  "description": "MVU runtime, bootstrap, and module system for TUIX",
  "type": "module",
  "main": "./src/index.ts",
  "module": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./mvu": {
      "types": "./src/mvu/index.ts",
      "import": "./src/mvu/index.ts"
    },
    "./module": {
      "types": "./src/module/base.ts",
      "import": "./src/module/base.ts"
    },
    "./*": {
      "types": "./src/*",
      "import": "./src/*"
    }
  },
  "dependencies": {
    "@tuix/core": "workspace:*",
    "@tuix/platform": "workspace:*",
    "effect": "^3.17.14"
  }
}
```

**Exports:**
```typescript
// MVU Runtime
export { Runtime, runApp } from './mvu/runtime'
export type { RuntimeConfig, SystemMsg } from './mvu/runtime'

// Bootstrap
export { bootstrap } from './bootstrap'

// Interactive mode
export { Interactive } from './interactive'

// Module system
export { ModuleBase, getGlobalRegistry } from './module'

// Bun runtime
export * from './bun'

// Fiber management
export * from './fiber'

// Scheduler
export * from './scheduler'
```

**Dependencies:**
- `@tuix/core` - Core types
- `@tuix/platform` - Platform services
- `effect` - Effect system

**Dependents:**
- `@tuix/coordination`
- Applications using MVU

---

### 2.4 @tuix/view (NEW)

**package.json:**
```json
{
  "name": "@tuix/view",
  "version": "1.0.0",
  "description": "View primitives, layouts, and caching for TUIX",
  "type": "module",
  "main": "./src/index.ts",
  "module": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./primitives": {
      "types": "./src/primitives/index.ts",
      "import": "./src/primitives/index.ts"
    },
    "./layout": {
      "types": "./src/layout/index.ts",
      "import": "./src/layout/index.ts"
    },
    "./cache": {
      "types": "./src/cache/index.ts",
      "import": "./src/cache/index.ts"
    },
    "./*": {
      "types": "./src/*",
      "import": "./src/*"
    }
  },
  "dependencies": {
    "@tuix/core": "workspace:*",
    "@tuix/ansi": "workspace:*",
    "effect": "^3.17.14"
  }
}
```

**Exports:**
```typescript
// View primitives
export * from './primitives/view'

// Layout system
export * from './layout'
export { spacer } from './layout/spacer'

// Caching
export * from './cache/view-cache'
export * as ViewCache from './view-cache'

// Lifecycle
export * from './lifecycle/lifecycle-manager'

// Performance
export * from './performance/optimized-renderer'

// Coordination
export * from './coordination/component-coordinator'
```

**Dependencies:**
- `@tuix/core` - Core types
- `@tuix/ansi` - ANSI utilities for rendering
- `effect` - Effect system

**Dependents:**
- `@tuix/ui`
- Applications building views

---

### 2.5 @tuix/input (NEW)

**package.json:**
```json
{
  "name": "@tuix/input",
  "version": "1.0.0",
  "description": "Input handling for TUIX - keyboard, mouse, focus",
  "type": "module",
  "main": "./src/index.ts",
  "module": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./keyboard": {
      "types": "./src/keyboard/index.ts",
      "import": "./src/keyboard/index.ts"
    },
    "./mouse": {
      "types": "./src/mouse/index.ts",
      "import": "./src/mouse/index.ts"
    },
    "./focus": {
      "types": "./src/focus/index.ts",
      "import": "./src/focus/index.ts"
    },
    "./*": {
      "types": "./src/*",
      "import": "./src/*"
    }
  },
  "dependencies": {
    "@tuix/core": "workspace:*",
    "effect": "^3.17.14"
  }
}
```

**Exports:**
```typescript
// Types
export type {
  MouseEvent,
  MouseEventType,
  MouseButton,
  ComponentBounds,
  HitTestResult,
  MouseRegion,
  KeyEvent,
  KeyEventType,
  FocusableComponent,
  FocusEventType,
  FocusDirection,
  FocusTrapMode,
  InputState,
} from './types'

// Keyboard
export { KeyUtils } from './keyboard/keys'
export type { KeyType } from './keyboard/keys'

// Focus Management
export {
  FocusService,
  FocusServiceLive,
  focusable,
  withFocus,
} from './focus/manager'

// Mouse Handling
export {
  HitTestService,
  HitTestServiceLive,
  createBounds,
  mouseEventHitsComponent,
  createHitTestService,
} from './mouse/hitTest'

export {
  MouseRouterService,
  MouseRouterServiceLive,
  clickHandler,
  pressReleaseHandler,
  coordinateHandler,
} from './mouse/router'

// Errors
export * from './errors'

// Constants
export * from './constants'
```

**Dependencies:**
- `@tuix/core` - Core types and errors
- `effect` - Effect system

**Dependents:**
- `@tuix/platform`
- `@tuix/runtime`
- Applications handling input

---

### 2.6 @tuix/reactive (NEW)

**package.json:**
```json
{
  "name": "@tuix/reactive",
  "version": "1.0.0",
  "description": "Reactive system for TUIX - runes, scopes, events, JSX lifecycle",
  "type": "module",
  "main": "./src/index.ts",
  "module": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./runes": {
      "types": "./src/runes.ts",
      "import": "./src/runes.ts"
    },
    "./scope": {
      "types": "./src/scope/index.ts",
      "import": "./src/scope/index.ts"
    },
    "./events": {
      "types": "./src/events/index.ts",
      "import": "./src/events/index.ts"
    },
    "./*": {
      "types": "./src/*",
      "import": "./src/*"
    }
  },
  "dependencies": {
    "@tuix/core": "workspace:*",
    "effect": "^3.17.14"
  }
}
```

**Exports:**
```typescript
// Runes
export { $state, $derived, $effect } from './runes'

// JSX Lifecycle
export * from './jsx-lifecycle'

// Scope System
export { scopeManager } from './scope/manager'
export * from './scope/types'
export * from './scope/jsx/components'
export * from './scope/jsx/hooks'
export * from './scope/jsx/stores'

// Event Bus
export { EventBus, getGlobalEventBus } from './events/event-bus'
export type { BaseEvent, EventHandler } from './events/event-bus'
export * from './events/channels'

// Reactive components
export * from './components/reactive-component'

// Module
export { ReactivityModule } from './module'
```

**Dependencies:**
- `@tuix/core` - Core types
- `effect` - Effect system

**Dependents:**
- `@tuix/jsx`
- `@tuix/runtime`
- `@tuix/coordination`

---

### 2.7 @tuix/coordination (NEW)

**package.json:**
```json
{
  "name": "@tuix/coordination",
  "version": "1.0.0",
  "description": "Coordination patterns for TUIX - orchestration, choreography, streams",
  "type": "module",
  "main": "./src/index.ts",
  "module": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./*": {
      "types": "./src/*",
      "import": "./src/*"
    }
  },
  "dependencies": {
    "@tuix/core": "workspace:*",
    "@tuix/runtime": "workspace:*",
    "@tuix/reactive": "workspace:*",
    "effect": "^3.17.14"
  }
}
```

**Exports:**
```typescript
// Types
export * from './types'

// Errors
export * from './errors'

// Constants
export * from './constants'

// Choreography
export { EventChoreographer } from './choreography'

// Orchestration
export { WorkflowOrchestrator } from './orchestrator'

// Stream Optimization
export { EventStreamOptimizer } from './streamOptimizer'

// Performance Monitoring
export { PerformanceMonitor } from './performanceMonitor'

// Error Recovery
export { ErrorRecoveryManager } from './errorRecovery'

// Integration Patterns
export { IntegrationPatterns } from './integrationPatterns'

// Module
export { CoordinationModule } from './module'
```

**Dependencies:**
- `@tuix/core` - Core types
- `@tuix/runtime` - Module system
- `@tuix/reactive` - Event bus
- `effect` - Effect system

**Dependents:**
- Complex applications
- Multi-module orchestration

---

## Part 3: Dependency Graph

### 3.1 Visual Dependency Graph

```
                    ┌─────────────┐
                    │   effect    │
                    │    zod      │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  @tuix/core │ ◄───────────┐
                    │             │             │
                    │ Types       │             │
                    │ Errors      │             │
                    │ Schemas     │             │
                    │ Context     │             │
                    └──────┬──────┘             │
                           │                    │
              ┌────────────┼────────────┐       │
              │            │            │       │
       ┌──────▼──────┐ ┌──▼─────┐ ┌───▼───────▼──┐
       │  @tuix/ansi │ │@tuix/  │ │  @tuix/input │
       │             │ │platform│ │              │
       │ Colors      │ │        │ │ Keyboard     │
       │ Styles      │ │Terminal│ │ Mouse        │
       │ Borders     │ │Renderer│ │ Focus        │
       └──────┬──────┘ │Storage │ └───────┬──────┘
              │        └───┬────┘         │
              │            │              │
              └──────┬─────┴────┬─────────┘
                     │          │
              ┌──────▼──────┐   │
              │  @tuix/view │   │
              │             │   │
              │ Primitives  │   │
              │ Layouts     │   │
              │ Cache       │   │
              └──────┬──────┘   │
                     │          │
              ┌──────▼──────────▼─────┐
              │   @tuix/reactive      │
              │                       │
              │ Runes                 │
              │ Scopes                │
              │ Events                │
              │ JSX Lifecycle         │
              └──────┬────────────────┘
                     │
              ┌──────▼──────┐
              │ @tuix/      │
              │ runtime     │
              │             │
              │ MVU         │
              │ Bootstrap   │
              │ Modules     │
              └──────┬──────┘
                     │
              ┌──────▼────────┐
              │  @tuix/       │
              │  coordination │
              │               │
              │ Orchestration │
              │ Choreography  │
              │ Streams       │
              └───────────────┘
                     │
              ┌──────▼──────┐
              │   @tuix/jsx │
              └─────────────┘
                     │
              ┌──────▼──────┐
              │   @tuix/ui  │
              └─────────────┘
```

### 3.2 Dependency Matrix

| Package          | Depends On                                              |
|------------------|---------------------------------------------------------|
| @tuix/core       | effect, zod, @effect/schema                             |
| @tuix/ansi       | (no dependencies)                                       |
| @tuix/platform   | @tuix/core, @tuix/ansi, effect                          |
| @tuix/input      | @tuix/core, effect                                      |
| @tuix/view       | @tuix/core, @tuix/ansi, effect                          |
| @tuix/reactive   | @tuix/core, effect                                      |
| @tuix/runtime    | @tuix/core, @tuix/platform, effect                      |
| @tuix/coordination | @tuix/core, @tuix/runtime, @tuix/reactive, effect     |
| @tuix/jsx        | @tuix/core, @tuix/reactive                              |
| @tuix/ui         | @tuix/core, @tuix/view, @tuix/ansi                      |

### 3.3 Circular Dependency Analysis

**NONE DETECTED** - The architecture is designed to be acyclic:
- Core has no TUIX dependencies
- Platform, Input, View, Reactive all depend only on Core
- Runtime depends on Core + Platform
- Coordination depends on Core + Runtime + Reactive
- UI depends on Core + View + ANSI

---

## Part 4: Import Migration Guide

### 4.1 Breaking Changes Summary

All imports from `@tuix/core` will need to be updated to specific packages:

| Old Import                          | New Import                        |
|-------------------------------------|-----------------------------------|
| `@tuix/core/types`                  | `@tuix/core/types`                |
| `@tuix/core/errors`                 | `@tuix/core/errors`               |
| `@tuix/core/constants`              | `@tuix/core/constants`            |
| `@tuix/core/context`                | `@tuix/core/context`              |
| `@tuix/core/services/*`             | `@tuix/platform/services/*`       |
| `@tuix/core/runtime/*`              | `@tuix/runtime/*`                 |
| `@tuix/core/view/*`                 | `@tuix/view/*`                    |
| `@tuix/core/input/*`                | `@tuix/input/*`                   |
| `@tuix/core/update/reactivity/*`    | `@tuix/reactive/*`                |
| `@tuix/core/model/scope/*`          | `@tuix/reactive/scope/*`          |
| `@tuix/core/model/events/*`         | `@tuix/reactive/events/*`         |
| `@tuix/core/coordination/*`         | `@tuix/coordination/*`            |
| `@tuix/core/terminal/input/*`       | `@tuix/input/keyboard/*`          |

### 4.2 Detailed Import Mapping

#### Core Types and Errors (UNCHANGED)
```typescript
// BEFORE & AFTER (no change)
import { Component, View, Update, Command } from '@tuix/core'
import { TerminalError, ApplicationError } from '@tuix/core'
import { Effect, Context, Layer } from '@tuix/core'
```

#### Platform Services
```typescript
// BEFORE
import { TerminalService, InputService, RendererService } from '@tuix/core/services'
import { TerminalServiceLive } from '@tuix/core/services/live'

// AFTER
import { TerminalService, InputService, RendererService } from '@tuix/platform/services'
import { TerminalServiceLive } from '@tuix/platform/live'
```

#### Runtime
```typescript
// BEFORE
import { Runtime, runApp } from '@tuix/core/runtime/mvu/runtime'
import { RuntimeConfig } from '@tuix/core/runtime/mvu/runtime'

// AFTER
import { Runtime, runApp, RuntimeConfig } from '@tuix/runtime'
```

#### View System
```typescript
// BEFORE
import * as View from '@tuix/core/view/primitives/view'
import { spacer } from '@tuix/core/view/layout/spacer'
import * as ViewCache from '@tuix/core/view/view-cache'

// AFTER
import * as View from '@tuix/view/primitives'
import { spacer } from '@tuix/view/layout'
import * as ViewCache from '@tuix/view/cache'
```

#### Input Handling
```typescript
// BEFORE
import { FocusService } from '@tuix/core/input/focus/manager'
import { HitTestService } from '@tuix/core/input/mouse/hitTest'
import { KeyUtils } from '@tuix/core/terminal/input/keys'

// AFTER
import { FocusService } from '@tuix/input/focus'
import { HitTestService } from '@tuix/input/mouse'
import { KeyUtils } from '@tuix/input/keyboard'
```

#### Reactive System
```typescript
// BEFORE
import { $state, $derived, $effect } from '@tuix/core/update/reactivity/runes'
import { scopeManager } from '@tuix/core/model/scope/manager'
import { EventBus } from '@tuix/core/model/events/event-bus'

// AFTER
import { $state, $derived, $effect } from '@tuix/reactive/runes'
import { scopeManager } from '@tuix/reactive/scope'
import { EventBus } from '@tuix/reactive/events'
```

#### Coordination
```typescript
// BEFORE
import { WorkflowOrchestrator } from '@tuix/core/coordination/orchestrator'
import { EventChoreographer } from '@tuix/core/coordination/choreography'

// AFTER
import { WorkflowOrchestrator, EventChoreographer } from '@tuix/coordination'
```

### 4.3 ANSI Consolidation

```typescript
// BEFORE (multiple sources)
import { color } from '@tuix/core/terminal/ansi/color'
import { style } from '@tuix/terminal/ansi/style'
import { stripAnsi } from '@tuix/ansi/core'

// AFTER (single source)
import { color } from '@tuix/ansi/color'
import { style } from '@tuix/ansi/style'
import { stripAnsi } from '@tuix/ansi/core'
```

### 4.4 Automated Migration Script

Create a migration script to automate import updates:

```typescript
// migrate-imports.ts
const replacements = [
  {
    pattern: /from ['"]@tuix\/core\/services/g,
    replacement: `from '@tuix/platform/services`
  },
  {
    pattern: /from ['"]@tuix\/core\/runtime/g,
    replacement: `from '@tuix/runtime`
  },
  {
    pattern: /from ['"]@tuix\/core\/view/g,
    replacement: `from '@tuix/view`
  },
  {
    pattern: /from ['"]@tuix\/core\/input/g,
    replacement: `from '@tuix/input`
  },
  {
    pattern: /from ['"]@tuix\/core\/update\/reactivity/g,
    replacement: `from '@tuix/reactive`
  },
  {
    pattern: /from ['"]@tuix\/core\/model\/scope/g,
    replacement: `from '@tuix/reactive\/scope`
  },
  {
    pattern: /from ['"]@tuix\/core\/model\/events/g,
    replacement: `from '@tuix/reactive\/events`
  },
  {
    pattern: /from ['"]@tuix\/core\/coordination/g,
    replacement: `from '@tuix/coordination`
  },
  {
    pattern: /from ['"]@tuix\/core\/terminal\/input/g,
    replacement: `from '@tuix/input\/keyboard`
  },
  {
    pattern: /from ['"]@tuix\/core\/terminal\/ansi/g,
    replacement: `from '@tuix/ansi`
  },
  {
    pattern: /from ['"]@tuix\/terminal\/ansi/g,
    replacement: `from '@tuix/ansi`
  },
]

// Apply to all .ts and .tsx files
```

---

## Part 5: Execution Plan

### 5.1 Phase 1: Preparation (Week 1)

**Step 1.1: Backup and Branch**
- [ ] Create feature branch: `refactor/split-core-package`
- [ ] Commit current state
- [ ] Document all current package.json dependencies

**Step 1.2: Create New Package Directories**
```bash
mkdir -p packages/platform/src
mkdir -p packages/view/src
mkdir -p packages/input/src
mkdir -p packages/reactive/src
mkdir -p packages/coordination/src
```

**Step 1.3: Initialize Package.json Files**
- [ ] Create package.json for @tuix/platform
- [ ] Create package.json for @tuix/view
- [ ] Create package.json for @tuix/input
- [ ] Create package.json for @tuix/reactive
- [ ] Create package.json for @tuix/coordination
- [ ] Update workspaces in root package.json

### 5.2 Phase 2: ANSI Consolidation (Week 1)

**Step 2.1: Verify @tuix/ansi is Complete**
- [ ] Compare @tuix/ansi with packages/core/src/terminal/ansi
- [ ] Compare @tuix/ansi with packages/terminal/src/ansi
- [ ] Identify any missing functionality
- [ ] Add missing functionality to @tuix/ansi

**Step 2.2: Remove Duplicate ANSI Code**
- [ ] Delete packages/core/src/terminal/ansi/
- [ ] Delete packages/terminal/src/ansi/ (if duplicate)
- [ ] Update all imports to use @tuix/ansi

**Step 2.3: Test ANSI Consolidation**
- [ ] Run all ANSI tests
- [ ] Verify no broken imports
- [ ] Check visual output in examples

### 5.3 Phase 3: Runtime Consolidation (Week 1-2)

**Step 3.1: Compare Runtime Files**
- [ ] Diff packages/core/src/runtime/bootstrap.ts with packages/runtime/src/bootstrap.ts
- [ ] Diff packages/core/src/runtime/module/registry.ts with packages/runtime/src/module/registry.ts
- [ ] Identify differences and create merge plan

**Step 3.2: Merge Runtime Files**
- [ ] Merge bootstrap.ts (keep best of both)
- [ ] Merge module/registry.ts (keep best of both)
- [ ] Copy remaining files from core/runtime to @tuix/runtime
- [ ] Update @tuix/runtime/index.ts exports

**Step 3.3: Delete Duplicate Runtime Files**
- [ ] Delete packages/core/src/runtime/
- [ ] Update imports in coordination module

**Step 3.4: Test Runtime Consolidation**
- [ ] Run all runtime tests
- [ ] Test MVU examples
- [ ] Verify module registration works

### 5.4 Phase 4: Move Input System (Week 2)

**Step 4.1: Move Input Files**
- [ ] Copy packages/core/src/input/ → packages/input/src/
- [ ] Copy packages/core/src/terminal/input/ → packages/input/src/keyboard/
- [ ] Compare with packages/terminal/src/input/, merge if needed
- [ ] Create packages/input/src/index.ts

**Step 4.2: Update Input Imports**
- [ ] Find all imports of @tuix/core/input
- [ ] Update to @tuix/input
- [ ] Find all imports of @tuix/core/terminal/input
- [ ] Update to @tuix/input/keyboard

**Step 4.3: Test Input System**
- [ ] Run input tests
- [ ] Test focus management
- [ ] Test mouse handling
- [ ] Test keyboard events

### 5.5 Phase 5: Move View System (Week 2)

**Step 5.1: Move View Files**
- [ ] Copy packages/core/src/view/ → packages/view/src/
- [ ] Create packages/view/src/index.ts
- [ ] Update exports

**Step 5.2: Update View Imports**
- [ ] Find all imports of @tuix/core/view
- [ ] Update to @tuix/view
- [ ] Update @tuix/ui dependencies

**Step 5.3: Test View System**
- [ ] Run view tests
- [ ] Test layout primitives
- [ ] Test view caching
- [ ] Test rendering

### 5.6 Phase 6: Move Reactive System (Week 2-3)

**Step 6.1: Move Reactive Files**
- [ ] Copy packages/core/src/update/reactivity/ → packages/reactive/src/
- [ ] Copy packages/core/src/model/scope/ → packages/reactive/src/scope/
- [ ] Copy packages/core/src/model/events/ → packages/reactive/src/events/
- [ ] Create packages/reactive/src/index.ts

**Step 6.2: Update Reactive Imports**
- [ ] Find all imports of @tuix/core/update/reactivity
- [ ] Update to @tuix/reactive
- [ ] Find all imports of @tuix/core/model/scope
- [ ] Update to @tuix/reactive/scope
- [ ] Find all imports of @tuix/core/model/events
- [ ] Update to @tuix/reactive/events

**Step 6.3: Test Reactive System**
- [ ] Run reactive tests
- [ ] Test runes ($state, $derived, $effect)
- [ ] Test scope management
- [ ] Test event bus

### 5.7 Phase 7: Move Platform Services (Week 3)

**Step 7.1: Move Platform Files**
- [ ] Copy packages/core/src/services/ → packages/platform/src/services/
- [ ] Copy packages/core/src/terminal/capabilities/ → packages/platform/src/terminal/capabilities/
- [ ] Copy packages/core/src/terminal/output/ → packages/platform/src/terminal/output/
- [ ] Create packages/platform/src/index.ts

**Step 7.2: Update Platform Imports**
- [ ] Find all imports of @tuix/core/services
- [ ] Update to @tuix/platform/services
- [ ] Update @tuix/runtime dependencies

**Step 7.3: Test Platform Services**
- [ ] Run service tests
- [ ] Test terminal service
- [ ] Test input service
- [ ] Test renderer service
- [ ] Test storage service

### 5.8 Phase 8: Move Coordination System (Week 3)

**Step 8.1: Move Coordination Files**
- [ ] Copy packages/core/src/coordination/ → packages/coordination/src/
- [ ] Create packages/coordination/src/index.ts

**Step 8.2: Update Coordination Imports**
- [ ] Find all imports of @tuix/core/coordination
- [ ] Update to @tuix/coordination

**Step 8.3: Test Coordination System**
- [ ] Run coordination tests
- [ ] Test choreography
- [ ] Test orchestration
- [ ] Test stream optimization

### 5.9 Phase 9: Update Core Package (Week 3-4)

**Step 9.1: Clean Core Package**
- [ ] Delete packages/core/src/coordination/
- [ ] Delete packages/core/src/input/
- [ ] Delete packages/core/src/model/ (except context)
- [ ] Delete packages/core/src/runtime/
- [ ] Delete packages/core/src/services/
- [ ] Delete packages/core/src/terminal/
- [ ] Delete packages/core/src/update/
- [ ] Delete packages/core/src/view/

**Step 9.2: Update Core Exports**
- [ ] Update packages/core/src/index.ts
- [ ] Keep only types, errors, constants, context
- [ ] Remove all re-exports of moved modules

**Step 9.3: Update Core Package.json**
- [ ] Update version to 2.0.0
- [ ] Update description
- [ ] Remove dependencies on moved modules

### 5.10 Phase 10: Update All Dependent Packages (Week 4)

**Step 10.1: Update Package Dependencies**
- [ ] Update @tuix/jsx dependencies
- [ ] Update @tuix/ui dependencies
- [ ] Update @tuix/terminal dependencies
- [ ] Update all example app dependencies

**Step 10.2: Run Migration Script**
- [ ] Create and run automated import migration script
- [ ] Manually review and fix edge cases

**Step 10.3: Update Package Exports**
- [ ] Verify all package.json exports are correct
- [ ] Test import paths work correctly

### 5.11 Phase 11: Testing and Validation (Week 4)

**Step 11.1: Run All Tests**
- [ ] Run tests for @tuix/core
- [ ] Run tests for @tuix/platform
- [ ] Run tests for @tuix/runtime
- [ ] Run tests for @tuix/view
- [ ] Run tests for @tuix/input
- [ ] Run tests for @tuix/reactive
- [ ] Run tests for @tuix/coordination
- [ ] Run integration tests

**Step 11.2: Test Example Applications**
- [ ] Test all example apps
- [ ] Verify no runtime errors
- [ ] Verify no import errors
- [ ] Check visual output

**Step 11.3: TypeScript Compilation**
- [ ] Run typecheck on all packages
- [ ] Fix any type errors
- [ ] Verify no circular dependencies

### 5.12 Phase 12: Documentation and Release (Week 5)

**Step 12.1: Update Documentation**
- [ ] Update README for each package
- [ ] Update migration guide
- [ ] Update architecture documentation
- [ ] Update API documentation

**Step 12.2: Create Migration Guide**
- [ ] Document breaking changes
- [ ] Provide migration examples
- [ ] Create automated migration tools

**Step 12.3: Release**
- [ ] Tag releases for all packages
- [ ] Publish to npm (if applicable)
- [ ] Update changelog
- [ ] Announce breaking changes

---

## Part 6: Risk Analysis and Mitigation

### 6.1 Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Breaking existing imports | HIGH | Create automated migration script, comprehensive testing |
| Circular dependencies | MEDIUM | Careful dependency planning, use dependency graph |
| Runtime merge conflicts | MEDIUM | Manual review of both versions, comprehensive testing |
| Missing functionality after split | MEDIUM | Thorough inventory, test coverage |
| Performance regression | LOW | Benchmark before/after |

### 6.2 Rollback Plan

If critical issues are discovered:
1. Keep the original `@tuix/core` package as `@tuix/core-legacy`
2. Create a compatibility shim package that re-exports from new packages
3. Allow gradual migration over multiple releases

### 6.3 Testing Strategy

**Unit Tests:**
- Maintain 100% test coverage during migration
- Run tests after each file move

**Integration Tests:**
- Test inter-package communication
- Verify service dependencies work

**End-to-End Tests:**
- Run all example applications
- Manual testing of interactive features

---

## Part 7: Success Metrics

### 7.1 Package Size Metrics

**Before:**
- @tuix/core: 156 files

**After:**
- @tuix/core: ~20 files (87% reduction)
- @tuix/platform: ~25 files
- @tuix/runtime: ~20 files
- @tuix/view: ~18 files
- @tuix/input: ~12 files
- @tuix/reactive: ~24 files
- @tuix/coordination: ~17 files

**Total: 136 files (20 files saved by removing duplicates)**

### 7.2 Code Quality Metrics

- [ ] Zero circular dependencies
- [ ] All tests passing
- [ ] TypeScript compilation with no errors
- [ ] No duplicate code between packages
- [ ] Clear separation of concerns

### 7.3 Developer Experience Metrics

- [ ] Clearer import paths
- [ ] Easier to find functionality
- [ ] Smaller bundle sizes for apps (tree-shaking)
- [ ] Faster TypeScript compilation (smaller scope)
- [ ] Better IDE autocomplete (focused packages)

---

## Appendix A: File Counts by Package

| Package | Files | Percentage |
|---------|-------|------------|
| @tuix/core (new) | 20 | 12.8% |
| @tuix/platform | 25 | 16.0% |
| @tuix/runtime | 20 | 12.8% |
| @tuix/view | 18 | 11.5% |
| @tuix/input | 12 | 7.7% |
| @tuix/reactive | 24 | 15.4% |
| @tuix/coordination | 17 | 10.9% |
| **TOTAL** | **136** | **87.2% of original** |

---

## Appendix B: Import Examples

### Before (Monolithic)
```typescript
import { Component, View } from '@tuix/core'
import { TerminalService } from '@tuix/core/services'
import { Runtime, runApp } from '@tuix/core/runtime/mvu/runtime'
import { FocusService } from '@tuix/core/input/focus/manager'
import { $state, $derived } from '@tuix/core/update/reactivity/runes'
import { WorkflowOrchestrator } from '@tuix/core/coordination/orchestrator'
```

### After (Focused Packages)
```typescript
import { Component, View } from '@tuix/core'
import { TerminalService } from '@tuix/platform'
import { Runtime, runApp } from '@tuix/runtime'
import { FocusService } from '@tuix/input'
import { $state, $derived } from '@tuix/reactive'
import { WorkflowOrchestrator } from '@tuix/coordination'
```

---

## Appendix C: Quick Reference

### Package Responsibility Matrix

| Concern | Package | Key Exports |
|---------|---------|-------------|
| Types, Errors, Schemas | @tuix/core | Component, View, Update, errors |
| ANSI utilities | @tuix/ansi | color, style, border, gradient |
| Terminal I/O | @tuix/platform | TerminalService, InputService |
| Rendering | @tuix/platform | RendererService |
| Storage | @tuix/platform | StorageService |
| Keyboard handling | @tuix/input | KeyUtils, KeyEvent |
| Mouse handling | @tuix/input | HitTestService, MouseRouter |
| Focus management | @tuix/input | FocusService |
| MVU Runtime | @tuix/runtime | Runtime, runApp |
| Module system | @tuix/runtime | ModuleBase, registry |
| View primitives | @tuix/view | text, vstack, hstack, box |
| Layouts | @tuix/view | flexbox, grid, spacer |
| View caching | @tuix/view | ViewCache |
| Reactivity (runes) | @tuix/reactive | $state, $derived, $effect |
| Scopes | @tuix/reactive | scopeManager |
| Events | @tuix/reactive | EventBus |
| Orchestration | @tuix/coordination | WorkflowOrchestrator |
| Choreography | @tuix/coordination | EventChoreographer |
| Stream optimization | @tuix/coordination | EventStreamOptimizer |

---

## Conclusion

This blueprint provides a complete roadmap for splitting @tuix/core into focused, single-responsibility packages. The refactoring will:

1. **Eliminate duplicate code** (ANSI, runtime, input)
2. **Improve maintainability** (smaller, focused packages)
3. **Enable better tree-shaking** (import only what you need)
4. **Clarify architecture** (clear separation of concerns)
5. **Speed up development** (faster TypeScript compilation, better IDE support)

**Estimated Timeline:** 5 weeks
**Estimated Effort:** 1 full-time developer

The execution plan is designed to be incremental and safe, with testing at each phase to catch issues early. The automated migration script will help update existing code, and the detailed import mapping ensures no functionality is lost.
