# JSX Scope & Plugin Spec

*Pod D: JSX & Authoring — WS4*

## Purpose

Define the scope management system and plugin registry that enable JSX-based CLI routing, command registration, and plugin lifecycle. Scopes provide a hierarchical namespace for commands and plugins; the plugin registry manages declarative and loaded plugin components; together they make JSX the primary authoring surface for CLI applications.

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────┐
│            JSXPluginRegistry             │
│  (global singleton via pluginRegistry)   │
│                                          │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │ Declarative  │  │  Loaded Plugins  │  │
│  │   Plugins    │  │  (pluginStore)   │  │
│  └──────┬──────┘  └───────┬──────────┘  │
│         │                  │             │
│         ▼                  ▼             │
│  ┌──────────────────────────────────┐   │
│  │         ScopeManager             │   │
│  │  (hierarchical scope registry)   │   │
│  │                                  │   │
│  │  Scope Tree:                     │   │
│  │    cli (root)                    │   │
│  │    ├── plugin:config             │   │
│  │    │   └── command:config set    │   │
│  │    ├── plugin:logger             │   │
│  │    └── command:dev               │   │
│  │        └── command:dev start     │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │        Command Context           │   │
│  │  Active command path + args      │   │
│  └──────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

---

## 2. Scope System

### REQ-JSX-SCP-001: ScopeDef

A scope definition describes a node in the scope hierarchy:

```typescript
interface ScopeDef {
  id: string                          // Unique identifier
  type: 'cli' | 'plugin' | 'command' | 'arg' | 'flag' | 'option' | 'component'
  name: string                        // Used in path segments
  path: string[]                      // Full path from root
  description?: string                // User-facing description
  executable?: boolean                // Can this scope be invoked?
  handler?: Handler                   // Execution handler (for commands)
  args?: Record<string, ArgDef>       // Argument definitions
  flags?: Record<string, FlagDef>     // Flag definitions
  aliases?: string[]                  // Command aliases
  metadata?: Record<string, unknown>  // Extensible metadata
  children: ScopeDef[]                // Child scopes
}
```

**Acceptance Criteria:**
- AC-SCP-001-A: Every scope MUST have a unique `id`.
- AC-SCP-001-B: `path` MUST reflect the scope's position in the hierarchy (e.g., `["dev", "start"]`).
- AC-SCP-001-C: `type` MUST be one of the enumerated values.

### REQ-JSX-SCP-002: ScopeState

Runtime state tracked per scope:

```typescript
interface ScopeState {
  def: ScopeDef
  status: 'unmounted' | 'mounted' | 'rendered' | 'executed'
  isActive: boolean
  context: Record<string, unknown>      // Persistent scope data
  transient: Record<string, unknown>    // Reset between renders
  parentId?: string
  childIds: string[]
}
```

**Acceptance Criteria:**
- AC-SCP-002-A: Status transitions MUST follow: `unmounted → mounted → rendered → executed`.
- AC-SCP-002-B: Transient state MUST be clearable via `resetTransientState`.

### REQ-JSX-SCP-003: ScopeManager

Singleton manager (`scopeManager`) for all scope operations:

| Method | Signature | Purpose |
|--------|-----------|---------|
| `registerScope` | `(def: ScopeDef) → Effect<void, ScopeError>` | Register a new scope |
| `removeScope` | `(id: string) → Effect<void, ScopeError>` | Remove scope and reparent children |
| `activateScope` | `(id: string) → Effect<void, ScopeError>` | Mark scope (and parent chain) as active |
| `deactivateScope` | `(id: string) → Effect<void, ScopeError>` | Deactivate scope and all children |
| `isScopeActive` | `(id: string) → boolean` | Check if scope or any child is active |
| `setScopeStatus` | `(id: string, status) → Effect<void, ScopeError>` | Update lifecycle status |
| `getScopeStatus` | `(id: string) → ScopeStatus \| null` | Query status |
| `setScopeContext` | `(id: string, data) → Effect<void, ScopeError>` | Merge context data |
| `getScopeContext` | `(id: string) → Record<string, unknown> \| null` | Read context |
| `setTransientState` | `(id: string, data) → Effect<void, ScopeError>` | Set transient data |
| `resetTransientState` | `(id: string) → Effect<void, ScopeError>` | Clear transient data |
| `getScopeDef` | `(id: string) → ScopeDef \| null` | Get definition |
| `getChildScopes` | `(id?: string) → ScopeDef[]` | Get children (root if no id) |
| `getParentScope` | `(id: string) → ScopeDef \| null` | Get parent |
| `getAllScopes` | `() → ScopeDef[]` | Dump all scopes |
| `fixScopePaths` | `() → void` | Rebuild paths from parent relationships |
| `linkOrphanedScopes` | `() → void` | Connect orphaned children via metadata |
| `setScopeDef` | `(def: ScopeDef) → Effect<void, ScopeError>` | Register + emit events |
| `setScopeDefSync` | `(def: ScopeDef) → void` | Synchronous variant for components |
| `markScopeRendered` | `(id: string) → void` | Mark scope and parents as rendered |
| `hasRenderedContent` | `(id: string) → boolean` | Check if scope tree has rendered |
| `setFallback` | `(fallback) → void` | Set fallback for unmatched commands |
| `getFallback` | `() → fallback \| null` | Get fallback component |
| `clear` | `() → void` | Reset all state |

**Acceptance Criteria:**
- AC-SCP-003-A: Registering a scope with an existing ID where name/type/path match MUST update the definition (idempotent).
- AC-SCP-003-B: Registering a scope with an existing ID where name/type/path differ MUST fail with `ScopeExistsError`.
- AC-SCP-003-C: Parent-child linking MUST work regardless of registration order (child before parent).
- AC-SCP-003-D: `removeScope` MUST reparent children to the removed scope's parent.
- AC-SCP-003-E: `activateScope` MUST activate the entire parent chain up to root.
- AC-SCP-003-F: `deactivateScope` MUST recursively deactivate all descendants.

### REQ-JSX-SCP-004: Parent-Child Linking

Two linking mechanisms:

1. **Metadata-based** (preferred): Child stores `_parentScopeId` in `def.metadata`. On registration, if the parent exists, link immediately.
2. **Path-based** (fallback): If no metadata parent ID, match by path prefix (parent path = child path minus last segment).
3. **Retroactive**: When a parent registers after its children, scan existing scopes and adopt children whose paths are one level deeper.

**Acceptance Criteria:**
- AC-SCP-004-A: Metadata-based linking MUST take precedence over path-based.
- AC-SCP-004-B: `linkOrphanedScopes` MUST handle cases where both mechanisms failed during initial registration.

---

## 3. Scope Error Hierarchy

### REQ-JSX-SCP-005: Error Types

```typescript
class ScopeError extends Error {
  code: string
  scopeId?: string
}

class ScopeNotFoundError extends ScopeError {
  // code: 'SCOPE_NOT_FOUND'
}

class ScopeExistsError extends ScopeError {
  // code: 'SCOPE_EXISTS'
}

class ExecutionError extends Error {
  code: string
  exitCode: ExitCode  // 0 | 1 | 2 | 3 | number
  cause?: unknown
}
```

---

## 4. JSX Scope Components

### REQ-JSX-SCP-006: `<Scope>` Component

Root scope container that registers a scope definition and provides context to children.

**Location**: `packages/jsx/src/scope/components/Scope.tsx`

### REQ-JSX-SCP-007: `<ScopeContent>` Component

Renders children only when the parent scope is active/matched.

**Location**: `packages/jsx/src/scope/components/ScopeContent.tsx`

### REQ-JSX-SCP-008: `<ScopeFallback>` Component

Renders children when no command in the parent scope matches.

**Location**: `packages/jsx/src/scope/components/ScopeFallback.tsx`

### REQ-JSX-SCP-009: Supporting Scope Components

| Component | Purpose |
|-----------|---------|
| `<ScopeProvider>` | Provides scope context to descendant components |
| `<Scoped>` | Wraps content that should only render within a specific scope |
| `<Unscoped>` | Content that renders regardless of scope |
| `<Command>` | Registers a command handler as a scope child |
| `<Plugin>` | Registers a plugin as a scope child |
| `<ScopeDebugView>` | Debug visualization of the scope tree |
| `<ScopeDebugOverlay>` | Overlay version of debug view |

### REQ-JSX-SCP-010: Scope Hooks

```typescript
// packages/jsx/src/scope/hooks/use-scope.ts
function useScope(): ScopeHookResult
```

Hook for accessing the current scope context from within a component.

### REQ-JSX-SCP-011: Scope Stores

Reactive stores for scope state:

| Store | Purpose |
|-------|---------|
| `activeRoute.store` | Currently active route path |
| `currentScope.store` | Current scope definition |
| `parentScope.store` | Parent scope reference |
| `rootScope.store` | Root scope reference |
| `scopeStack.store` | Full scope stack |

---

## 5. Plugin Registry

### REQ-JSX-SCP-012: JSXPluginRegistry

Global singleton (`pluginRegistry`) that manages plugin lifecycle and command registration.

**Declarative Plugin Operations:**

| Method | Purpose |
|--------|---------|
| `registerDeclarativePlugin(name, component, metadata?)` | Register a JSX-based plugin |
| `unregisterDeclarativePlugin(name)` | Remove a declarative plugin |
| `getDeclarativePlugin(name)` | Get plugin by name |
| `listDeclarativePlugins()` | List all declarative plugin names |
| `hasDeclarativePlugin(name)` | Check existence |

**Loaded Plugin Operations:**

| Method | Purpose |
|--------|---------|
| `registerPlugin(name, plugin, description?, version?)` | Register a loaded plugin |
| `unregisterPlugin(name)` | Remove and disable a loaded plugin |
| `getPlugin(name)` | Get plugin record |
| `listPlugins()` | List all loaded plugin names |

**Acceptance Criteria:**
- AC-SCP-012-A: Registering a plugin MUST create a scope of `type: "plugin"`.
- AC-SCP-012-B: Unregistering a plugin MUST remove its scope and emit plugin end events.
- AC-SCP-012-C: The plugin store (`pluginStore`) MUST be the backing store for loaded plugins.

### REQ-JSX-SCP-013: Command Registration

```typescript
registerCommand(
  path: string[],
  handler: Function,
  metadata?: Record<string, unknown>
): string  // Returns full path as "segment1 segment2"
```

**Behavior:**
1. Resolve full path by prepending current scope's path.
2. Create a scope of `type: "command"` with the handler.
3. Register with ScopeManager.
4. If current scope exists, add as child.
5. Emit command registered event via JSX module.

```typescript
unregisterCommand(path: string[]): void
```

Finds command scope by path match and removes from ScopeManager.

**Acceptance Criteria:**
- AC-SCP-013-A: Command path MUST be relative to the current scope context.
- AC-SCP-013-B: Full path MUST be `[...currentScope.path, ...path]`.

### REQ-JSX-SCP-014: Command Execution

```typescript
executeCommand(
  path: string[],
  args?: Record<string, string | number | boolean | undefined>,
  flags?: Record<string, string | number | boolean | undefined>
): unknown
```

**Behavior:**
1. Find command scope by exact path match.
2. Throw `Error("Command not found: ...")` if not found or handler missing.
3. Call `handler({ args, flags })`.

---

## 6. Context Management

### REQ-JSX-SCP-015: Active Command

```typescript
setActiveCommand(command: { path: string[]; args: Record<...>; flags: Record<...> } | null): void
getActiveCommand(): { path; args; flags } | null
```

Tracks the currently executing command for context-aware rendering.

### REQ-JSX-SCP-016: Context Stack

```typescript
pushContext(type: 'plugin' | 'command' | 'component', id: string, data: Record<string, unknown>): void
popContext(): null
getCurrentContext(): null
getContextStack(): []
```

**Note**: Context stack methods are currently disabled (returning null/empty). The scope hierarchy subsumes their role.

### REQ-JSX-SCP-017: Scope-Aware State

```typescript
getScopedState<T>(key: string, defaultValue?: T): T | undefined
setScopedState(key: string, value: unknown): void
```

Walks up the scope hierarchy to find/set state values. Enables parent scopes to provide configuration consumed by child components.

**Acceptance Criteria:**
- AC-SCP-017-A: `getScopedState` MUST walk from current scope up through parents.
- AC-SCP-017-B: First scope with the key set MUST win (nearest ancestor).
- AC-SCP-017-C: `setScopedState` MUST set on the current scope's metadata.

---

## 7. CLI Routing Types

### REQ-JSX-SCP-018: CLI Types

```typescript
interface ArgDef<T = unknown> {
  type: 'string' | 'number' | 'boolean'
  description?: string
  required?: boolean
  default?: T
  validate?: (value: unknown) => boolean
}

interface FlagDef {
  shortName?: string
  description?: string
  conflicts?: string[]
  dependsOn?: string[]
}

interface OptionDef<T = unknown> {
  type: 'string' | 'number' | 'boolean'
  shortName?: string
  description?: string
  required?: boolean
  default?: T
  choices?: readonly T[]
}

interface Handler {
  (args: ParsedArgs, scope: ScopeContext): Effect.Effect<ExitCode, ExecutionError>
}

interface ParsedArgs {
  command: string[]
  args: Record<string, unknown>
  flags: Set<string>
  options: Record<string, unknown>
  _: string[]    // Positional args
  __: string[]   // Everything after --
}

type ExitCode = 0 | 1 | 2 | 3 | number

interface CommandTree {
  [command: string]: CommandNode
}

interface CommandNode {
  scope?: ScopeContext
  handler?: Handler
  description?: string
  subcommands?: CommandTree
}
```

---

## 8. JSX Module Integration

### REQ-JSX-SCP-019: JSX Module Events

The ScopeManager and PluginRegistry emit events through a JSX module registered with `@tuix/core`'s global registry:

| Event Method | When Emitted |
|-------------|--------------|
| `emitPluginStart(name, scope)` | Plugin registered |
| `emitPluginEnd(name)` | Plugin unregistered |
| `emitCommandStart(path, command)` | Command execution begins |
| `emitCommandEnd(path, command, result?)` | Command execution ends |
| `emitCommandRegistered(path, scope)` | Command registered in scope tree |
| `emitScopeCreated(scope)` | Executable scope registered |

**Acceptance Criteria:**
- AC-SCP-019-A: Events MUST be emitted via Effect and wrapped in `Effect.catchAll` to prevent event failures from breaking scope operations.
- AC-SCP-019-B: If the JSX module is not yet available (module system not initialized), events MUST be silently skipped.

---

## 9. Public API Exports

### REQ-JSX-SCP-020: Exported Symbols

From `@tuix/jsx`:

| Export | Type | Source |
|--------|------|--------|
| `pluginRegistry` | `JSXPluginRegistry` | Global singleton |
| `registerPlugin` | Bound method | `registry.registerPlugin` |
| `registerCommand` | Bound method | `registry.registerCommand` |
| `executeCommand` | Bound method | `registry.executeCommand` |
| `getScopeManager` | Bound method | `registry.getScopeManager` |
| `JSXContext` | `{ registry, getScopeManager }` | Convenience object |
| `Scope` | Component | Scope container |
| `ScopeContent` | Component | Conditional content |
| `ScopeFallback` | Component | Fallback content |
| `ScopeProps`, `ScopeContentProps`, `ScopeFallbackProps` | Types | Component prop types |
| Scope types | Types | `ScopeDef`, `ScopeState`, `ScopeContext`, etc. |

---

## 10. Invariants

| ID | Invariant |
|----|-----------|
| INV-SCP-001 | Every scope has a unique ID within the ScopeManager. |
| INV-SCP-002 | Scope paths are consistent with the parent-child hierarchy. `fixScopePaths()` can repair inconsistencies. |
| INV-SCP-003 | Removing a scope reparents its children — no orphans are created. |
| INV-SCP-004 | Plugin registration always creates a corresponding scope. |
| INV-SCP-005 | Command registration paths are always relative to the current scope context. |
| INV-SCP-006 | The ScopeManager is a singleton — all components share the same scope tree. |
| INV-SCP-007 | Event emission failures never break scope operations (caught and logged). |

---

## 11. Requirement Cross-References

| REQ ID | Description | Test Cases | Related Specs |
|--------|-------------|------------|---------------|
| REQ-JSX-SCP-001 | ScopeDef | TC-JSX-SCP-001 | — |
| REQ-JSX-SCP-002 | ScopeState | TC-JSX-SCP-002 | — |
| REQ-JSX-SCP-003 | ScopeManager | TC-JSX-SCP-003 | — |
| REQ-JSX-SCP-004 | Parent-child linking | TC-JSX-SCP-004 | — |
| REQ-JSX-SCP-005 | Error types | TC-JSX-SCP-005 | — |
| REQ-JSX-SCP-006 | Scope component | TC-JSX-SCP-006 | JSX_PRIMITIVES_SPEC (REQ-JSX-PRI-017) |
| REQ-JSX-SCP-007 | ScopeContent | TC-JSX-SCP-007 | — |
| REQ-JSX-SCP-008 | ScopeFallback | TC-JSX-SCP-008 | — |
| REQ-JSX-SCP-009 | Supporting components | TC-JSX-SCP-009 | — |
| REQ-JSX-SCP-010 | Scope hooks | TC-JSX-SCP-010 | — |
| REQ-JSX-SCP-011 | Scope stores | TC-JSX-SCP-011 | — |
| REQ-JSX-SCP-012 | Plugin registry | TC-JSX-SCP-012 | — |
| REQ-JSX-SCP-013 | Command registration | TC-JSX-SCP-013 | — |
| REQ-JSX-SCP-014 | Command execution | TC-JSX-SCP-014 | — |
| REQ-JSX-SCP-015 | Active command | TC-JSX-SCP-015 | — |
| REQ-JSX-SCP-016 | Context stack | TC-JSX-SCP-016 | — |
| REQ-JSX-SCP-017 | Scope-aware state | TC-JSX-SCP-017 | — |
| REQ-JSX-SCP-018 | CLI types | TC-JSX-SCP-018 | — |
| REQ-JSX-SCP-019 | JSX module events | TC-JSX-SCP-019 | EFFECT_INTEGRATION_SPEC |
| REQ-JSX-SCP-020 | Public API | TC-JSX-SCP-020 | JSX_RUNTIME_SPEC (REQ-JSX-011) |
