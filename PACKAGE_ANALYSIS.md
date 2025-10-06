# TUIX Monorepo Package Structure Analysis

**Date:** 2025-10-03
**Purpose:** Comprehensive inventory of actual code to guide monorepo migration

---

## Executive Summary

The tuix monorepo currently contains **15 packages** with significant duplication and unclear boundaries:

- ✅ **8 well-defined packages** (ansi, ui, jsx, logger, config, process-manager, parser, debug)
- ⚠️ **4 problematic packages** (terminal, core, runtime, testing) - duplicates and unclear boundaries
- ❌ **2 empty/minimal packages** (styling, types) - should be removed/merged
- 🔧 **1 entry point** (bin) - depends on everything

**Key Issues:**
- 3 separate ANSI implementations (ansi, terminal/ansi, core/terminal/ansi)
- 2 runtime implementations (runtime, core/runtime)
- Core acting as monolith, re-exporting from other packages
- Unclear separation between terminal I/O vs ANSI formatting

---

## Current Package Inventory

### ✅ Well-Defined Packages (Keep As-Is)

#### 1. @tuix/ansi - ANSI Formatting
**Location:** `packages/ansi/src/`
**Dependencies:** None
**Size:** ~2,500+ lines, 43 TypeScript files
**Purpose:** ANSI escape codes, colors, styles, borders, gradients

**Contents:**
```
/core/        - Escape sequences, strip, width calculations
/color/       - Color system, profiles, conversions, presets
/style/       - Style builder with fluent API
/border/      - Border rendering, box drawing
/gradient/    - Gradient generation (text & background)
/effects/     - Visual effects (rainbow, pulse, glow, matrix)
/parser/      - ANSI sequence parsing
/render/      - Rendering pipeline
```

**Status:** Production-ready, comprehensive, no changes needed

---

#### 2. @tuix/ui - UI Components
**Location:** `packages/ui/src/`
**Dependencies:** @tuix/core, @tuix/styling
**Purpose:** Pre-built UI component library

**Contents:**
```
/components/
  /display/     - Text, LargeText
  /data/        - FilterBox, List, Table
  /feedback/    - Modal, Spinner, ProgressBar
  /forms/       - Button, TextInput, FilePicker
  /layout/      - Box, Flex, ScrollableBox, Viewport
  /navigation/  - Tabs, Help
  /system/      - Exit
/stores/        - formStore, textInputStore, viewportStore
```

**Status:** Well-organized, clear purpose, needs JSX import fixes

---

#### 3. @tuix/jsx - JSX Runtime
**Location:** `packages/jsx/src/`
**Dependencies:** @tuix/core
**Size:** ~55KB jsx-runtime.ts

**Contents:**
```
jsx-runtime.ts  - JSX factory functions
dev.ts          - Development runtime
events.ts       - JSX event handling
```

**Status:** Clear purpose, minimal, **needs index.ts entry point**

---

#### 4. @tuix/logger - Logging System
**Location:** `packages/logger/src/`
**Dependencies:** effect
**Purpose:** Comprehensive logging with transports and formatters

**Contents:**
```
/core/          - Logger impl, events, module, presets
/formatters/    - Pretty, JSON, Compact, CLI
/transports/    - Console, File, Stream, HTTP
/components/    - LogExplorer, LiveLogDashboard
```

**Status:** Production-ready, feature-complete

---

#### 5. @tuix/config - Configuration
**Location:** `packages/config/src/`
**Dependencies:** effect
**Purpose:** Configuration management and validation

**Contents:**
```
/core/          - Loader, module, events
/sources/       - Config sources and utilities
schema.ts       - Config validation
jsxConfig.ts    - JSX config integration
```

**Status:** Well-designed, clear purpose

---

#### 6. @tuix/process-manager - Process Management
**Location:** `packages/process-manager/src/`
**Dependencies:** @tuix/core, @tuix/logger
**Purpose:** Process lifecycle and monitoring

**Contents:**
```
manager.ts      - Main process manager
module.ts       - Module integration
Plugin.tsx      - Plugin component
/components/    - ProcessMonitor, ProcessStatusView, streams
doctor.ts       - Health checking
templates.ts    - Process templates
bun-fs.ts       - Bun filesystem utilities
```

**Status:** Feature-complete, clear purpose

---

#### 7. @tuix/parser - CLI Parsing
**Location:** `packages/parser/src/`
**Dependencies:** @tuix/types
**Purpose:** Command-line argument parsing

**Contents:**
```
parser.ts       - Main parser
command.ts      - Command handling
options.ts      - Option parsing
value.ts        - Value parsing
schema.ts       - Validation
```

**Status:** Clear purpose, focused

---

#### 8. @tuix/debug - Debug Tools
**Location:** `packages/debug/src/`
**Dependencies:** @tuix/core, @tuix/logger
**Purpose:** Development and debugging tools

**Contents:**
```
/core/              - Debug enabler, patcher, store
/jsx/components/    - Rich debug UI
  - DebugWrapper, DebugToolbar, RichDebugInterface
  - Tabs: Overview, Events, Scopes, Performance, Render, Console
  - ScopeExplorer, StateInspector, EventList, PerformanceView
/jsx/stores/        - Debug wrapper store
/tea/               - TEA-based debug app
/mvu/               - MVU integration
/logger/            - Debug transport
/cli/               - CLI utilities
```

**Status:** Well-structured, feature-rich

---

### ⚠️ Problematic Packages (Need Refactoring)

#### 9. @tuix/terminal - Mostly Duplicate/Empty
**Location:** `packages/terminal/src/`
**Dependencies:** @tuix/core
**Claimed Purpose:** Terminal I/O and ANSI handling

**Actual Contents:**
```
/ansi/          - DUPLICATE of @tuix/ansi (3,046 lines) ❌
/input/         - Key event types and utilities (533 lines) ✅
  - keys.ts     - Comprehensive keyboard handling
  - KeyType enum, KeyEvent interface
  - ANSI_SEQUENCES map
  - Key parsing utilities
/capabilities/  - EMPTY DIRECTORY ❌
index.ts        - Exports constants/errors/types (DON'T EXIST) ❌
```

**Issues:**
- Duplicate ANSI code (should use @tuix/ansi)
- Empty capabilities directory
- Missing constants.ts, errors.ts, types.ts
- Only valuable code is input/keys.ts (533 lines)

**Recommendation:**
- DELETE package
- Move input/keys.ts to @tuix/core/src/input/
- Remove duplicate ANSI code

---

#### 10. @tuix/core - Monolithic, Re-exports, Duplicates
**Location:** `packages/core/src/`
**Dependencies:** @effect/schema, effect
**Claimed Purpose:** Foundational TUI functionality

**Actual Contents:**
```
/terminal/
  /ansi/        - DUPLICATE of @tuix/ansi ❌
  /input/       - Key handling (keys.ts - 533 lines)
  /output/      - String width utilities
/runtime/       - MVU runtime (duplicated in @tuix/runtime?)
  /mvu/         - MVU pattern implementation
  /modules/     - Module system
  bootstrap.ts  - Bootstrap logic
/services/      - Service interfaces + implementations
  /live/        - Terminal, Input, Renderer, Storage
/input/         - Focus manager, mouse, routing
/view/          - View primitives, layouts, caching
/model/         - Event bus, scope management
  /scope/jsx/   - React-like scope components
/update/
  /reactivity/  - Svelte-like runes ($state, $derived, $effect)
/coordination/  - Orchestration, choreography, streaming
/context/       - Component context
/types/         - Type system, schemas, errors
constants.ts
errors.ts
```

**Re-exports from @tuix/ansi (lines 222-296):**
```typescript
export { color, colors, Colors, ... } from '@tuix/ansi/color'
export { Style, style, styles, ... } from '@tuix/ansi/style'
export { border, borderPresets, ... } from '@tuix/ansi/border'
export { stripAnsi, hasAnsi, ... } from '@tuix/ansi/core'
export { ansi } from '@tuix/ansi'
```

**Issues:**
- Contains duplicate ANSI code while re-exporting from @tuix/ansi
- Massive scope - runtime, services, view, reactivity, coordination
- Should consumers import from @tuix/ansi directly?

**Recommendations:**
- Remove /terminal/ansi/ directory (duplicate)
- Consider removing ANSI re-exports (force direct imports)
- Possibly split: platform services, runtime, view, reactivity

---

#### 11. @tuix/runtime - Duplicate of Core Runtime
**Location:** `packages/runtime/src/`
**Dependencies:** @tuix/core, effect
**Claimed Purpose:** Runtime systems and MVU

**Actual Contents:**
```
/mvu/runtime/   - MVU runtime (DUPLICATE of core/runtime/mvu)
/module/        - Module registry and base
bootstrap.ts    - Bootstrap (imports from @tuix/core)
interactive.ts  - Interactive mode
```

**Issues:**
- Nearly identical to packages/core/src/runtime/
- bootstrap.ts imports from @tuix/core while core's uses relative imports
- Unclear why separate from core

**Recommendations:**
- Option A: Merge into @tuix/core, delete package
- Option B: Keep separate, ensure no duplication with core

---

#### 12. @tuix/testing - Old Import Paths
**Location:** `packages/testing/src/`
**Dependencies:** None listed
**Purpose:** Testing utilities

**Actual Contents:**
```
harness.ts      - Test harness
e2eHarness.ts   - E2E testing (requires node-pty)
inputAdapter.ts - Input simulation
visualTest.ts   - Visual testing
testUtils.ts    - Utilities
```

**Issues:**
- Imports from old monolith structure:
  - `../services/input`
  - `../core/keys`
  - `../core/runtime`
  - `../core/services/impl/terminal`
- Missing node-pty dependency
- All relative imports broken after package split

**Recommendations:**
- Update all imports to use @tuix/* packages
- Add node-pty dependency
- Ensure tests work with new structure

---

### ❌ Empty/Minimal Packages (Remove/Merge)

#### 13. @tuix/styling - Empty Placeholder
**Location:** `packages/styling/src/`
**Dependencies:** None
**Contents:** Only a placeholder comment

**Recommendation:** DELETE (or merge functionality into @tuix/ansi if needed)

---

#### 14. @tuix/types - Minimal Types
**Location:** `packages/types/src/`
**Dependencies:** None
**Contents:**
```
cli.ts    - CLI types
index.ts  - Main exports (only CLI types)
```

**Recommendation:** MERGE into @tuix/core/src/types/

---

### 🔧 Entry Point

#### 15. @tuix/bin - CLI Entry
**Location:** `packages/bin/`
**Dependencies:** ALL packages
**Purpose:** CLI entry point and demo app

**Contents:**
```
/bin/
  tuix.ts   - CLI entry
  app.tsx   - Demo app
```

**Status:** Keep as-is, ensure it works after migration

---

## Duplication Analysis

### ANSI Code Triplication

**Three nearly identical implementations:**

| Location | Files | Size | Status |
|----------|-------|------|--------|
| packages/ansi/src/ | 43 | ~2,500 lines | ✅ CANONICAL |
| packages/terminal/src/ansi/ | 17 | ~3,046 lines | ❌ DUPLICATE |
| packages/core/src/terminal/ansi/ | 21 | Similar | ❌ DUPLICATE |

**Differences:**
- `packages/ansi` - Most complete, includes effects
- `packages/terminal/src/ansi` - Has codes/, different render structure
- `packages/core/src/terminal/ansi` - Has border, color, effects, types.ts

**Impact:**
- 7 files import from `@tuix/core/terminal/...`
- 32 files use relative imports to `../core/...`

**Action:** Delete terminal/ansi and core/terminal/ansi, update imports to @tuix/ansi

---

### Runtime Duplication

**Two implementations:**

| Location | Purpose | Dependencies |
|----------|---------|--------------|
| packages/core/src/runtime/ | Original | Relative imports |
| packages/runtime/src/ | Package | Imports from @tuix/core |

**Key Difference:**
- runtime/src/bootstrap.ts imports from @tuix/core
- core/src/runtime/bootstrap.ts uses relative imports
- Otherwise functionally identical

**Action:** Decide to merge or clearly separate responsibilities

---

## Functional Area Mapping

Based on actual code, these are the distinct capabilities:

### 1. ANSI & Terminal Styling (Visual Output)
- ANSI escape sequences
- Colors, gradients, effects
- Borders, box drawing
- Style builder
- Text rendering

**Location:** `@tuix/ansi` (duplicated in terminal/core)

---

### 2. Terminal I/O (Device Interaction)
- Reading from stdin/stdout
- Terminal capabilities detection
- Raw mode management
- TTY control

**Location:** **MOSTLY MISSING** - only key definitions exist

---

### 3. Input Handling (User Events)
- Keyboard events and parsing
- Mouse events
- Focus management
- Hit testing & routing

**Location:** Split between `terminal/src/input/keys.ts` and `core/src/input/`

---

### 4. MVU Runtime (Application Execution)
- MVU pattern implementation
- Message loop
- Command execution
- Subscription management
- Bootstrap and lifecycle

**Location:** Duplicated in `core/src/runtime/` and `runtime/src/`

---

### 5. View System (Rendering)
- View primitives
- Layout engine (flexbox, grid, box)
- View caching
- String width calculations

**Location:** `core/src/view/`

---

### 6. Service Layer (Infrastructure)
- Terminal service
- Input service
- Renderer service
- Storage service

**Location:** `core/src/services/`

---

### 7. UI Components (High-level)
- Pre-built components
- Component stores
- Layout components

**Location:** `ui/src/`

---

### 8. Reactivity System (State Management)
- Runes ($state, $derived, $effect)
- Scope management
- JSX integration
- Component context

**Location:** `core/src/update/reactivity/` and `core/src/model/scope/`

---

### 9. Coordination (Advanced Patterns)
- Orchestration
- Choreography
- Stream optimization
- Error recovery
- Performance monitoring

**Location:** `core/src/coordination/`

---

### 10. Supporting Utilities
- Logger, Config, Process Manager
- Parser, Testing, Debug

**Location:** Individual packages (all well-defined)

---

## Terminal vs ANSI Distinction

### What is ANSI?
ANSI is purely **formatting and styling** - escape codes for visual output.

**ANSI Concerns:**
- Escape sequences (`\x1b[31m` for red)
- Color management
- Text styling (bold, italic, underline)
- Borders and box drawing
- Gradients and effects
- Strip ANSI codes
- Calculate visual width

**Current State:** Well-implemented in `@tuix/ansi` ✅

---

### What is Terminal I/O?
Terminal I/O is **device interaction** - reading input, writing output, managing state.

**Terminal Concerns:**
- Reading from stdin (raw bytes)
- Writing to stdout/stderr
- Entering/exiting raw mode
- Terminal capability detection
- TTY configuration
- Signal handling (SIGWINCH, SIGINT)
- Alternate screen buffer
- Cursor position queries

**Current State:** **MOSTLY MISSING** - only key definitions exist ❌

---

### Current Confusion
The `@tuix/terminal` package doesn't provide real terminal I/O:
- Has duplicate ANSI code (formatting, not I/O)
- Has input key definitions (parsing, not reading)
- Has empty capabilities directory
- Missing actual stdin/stdout/TTY management

Terminal I/O likely lives in `@tuix/core/src/services/` (TerminalService, InputService)

---

## Proposed Package Structure

### Option A: Minimum Viable (11 packages)

**Keep:**
1. @tuix/ansi - ANSI formatting
2. @tuix/core - Runtime, types, services, input, view, reactivity, coordination
3. @tuix/ui - Components
4. @tuix/jsx - JSX runtime
5. @tuix/logger - Logging
6. @tuix/config - Config
7. @tuix/process-manager - Process management
8. @tuix/parser - CLI parsing
9. @tuix/testing - Testing
10. @tuix/debug - Debug tools
11. @tuix/bin - CLI

**Delete:**
- @tuix/terminal (move input/keys.ts to core)
- @tuix/runtime (merge into core)
- @tuix/styling (empty)
- @tuix/types (merge into core)

**Refactor @tuix/core:**
```
@tuix/core
├── /runtime/        - MVU runtime (merge from @tuix/runtime)
├── /services/       - Terminal, Input, Renderer, Storage
├── /input/          - Focus, mouse, keys (merge from @tuix/terminal)
├── /view/           - View system, layouts
├── /model/          - Events, scope
├── /update/         - Reactivity
├── /coordination/   - Advanced patterns
├── /context/        - Component context
└── /types/          - Type system (merge @tuix/types)

Remove:
  /terminal/         - Delete (duplicate ANSI)
```

---

### Option B: Cleaner Architecture (15 packages)

Split @tuix/core into focused packages:

1. **@tuix/platform** - Terminal I/O primitives
   - Terminal service (stdin/stdout/raw mode)
   - Input service (reading input)
   - Renderer service (output buffering)
   - Storage service

2. **@tuix/runtime** - MVU Runtime (keep, de-duplicate)
   - MVU pattern
   - Bootstrap
   - Module system
   - Message loop

3. **@tuix/view** - View System
   - View primitives
   - Layout engine
   - View caching

4. **@tuix/input** - Input Handling
   - Key parsing (from terminal)
   - Focus management
   - Mouse hit testing

5. **@tuix/reactive** - Reactivity
   - Runes system
   - Scope management
   - JSX integration

6. **@tuix/coordination** - Advanced Patterns
   - Orchestration
   - Choreography
   - Stream optimization

7. **@tuix/core** - Types & Foundation
   - Type system
   - Error types
   - Constants
   - Schemas

Plus existing 8 good packages = 15 total

---

## Recommended Actions

### Immediate (Phase 1)

1. ✅ **Delete duplicate ANSI code**
   - Remove `packages/terminal/src/ansi/`
   - Remove `packages/core/src/terminal/ansi/`
   - Update all imports to `@tuix/ansi`

2. ✅ **Delete empty packages**
   - Delete `@tuix/styling`
   - Merge `@tuix/types` into `@tuix/core/src/types/`

3. ✅ **Consolidate terminal package**
   - Move `packages/terminal/src/input/` to `packages/core/src/input/`
   - Delete `@tuix/terminal` package

4. ✅ **Fix @tuix/jsx entry point**
   - Create index.ts or update package.json

### Medium Priority (Phase 2)

5. **Resolve runtime duplication**
   - Decide: merge into core or keep separate
   - Ensure no code duplication

6. **Fix @tuix/testing imports**
   - Update relative `../core/` imports to `@tuix/*`
   - Add node-pty dependency

7. **Fix @tuix/ui JSX imports**
   - Remove react/jsx-dev-runtime imports
   - Use @tuix/jsx runtime

8. **Refactor @tuix/core exports**
   - Remove ANSI re-exports
   - Let consumers import from @tuix/ansi directly

### Long-term (Phase 3)

9. **Consider splitting @tuix/core**
   - Only if it becomes too large
   - Extract platform, view, reactivity as separate packages

10. **Document package boundaries**
    - Clear README for each package
    - Architectural decision records

---

## Summary

**Good News:**
- 8 packages are well-designed and production-ready
- Core functionality is solid
- Clear functional areas exist

**Issues to Fix:**
- Eliminate ANSI triplication
- Remove empty packages (styling, types)
- Fix terminal package (delete or rebuild)
- Resolve runtime duplication
- Update broken import paths

**Estimated Work:**
- Phase 1 (Critical): 1-2 days
- Phase 2 (Stabilization): 2-3 days
- Phase 3 (Polish): 1-2 days
- **Total: 4-7 days of focused work**

The codebase has excellent bones - it just needs architectural cleanup to match the well-organized code that exists.
