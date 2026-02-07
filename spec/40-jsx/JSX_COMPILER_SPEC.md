# JSX Compiler Spec

*Pod D: JSX & Authoring — WS4*

## Purpose

Define how JSX components are compiled into `Component<Model, Msg>` instances that run inside the MVU runtime loop. Per DEC-003, JSX MUST NOT render directly to the terminal — it always goes through MVU. The compiler bridges the gap between the ergonomic JSX authoring model (function components, runes) and the formal MVU contract (`init`/`update`/`view`/`subscriptions`).

---

## 1. Architecture

```
JSX Component (function)
        │
        ▼
┌───────────────────┐
│   JSX Compiler    │  compileToComponent() / createStatelessComponent()
│                   │
│  1. Detect mode   │  Interactive vs CLI (stateless)
│  2. Extract model │  Scan for $state runes → initial model
│  3. Build MVU     │  Generate init/update/view/subscriptions
└───────────────────┘
        │
        ▼
Component<Model, Msg>
        │
        ▼
    MVU Runtime
```

**Package**: `@tuix/jsx` (submodule `compiler/`)
**Entry**: `packages/jsx/src/compiler/index.ts`

---

## 2. Types

### REQ-JSX-CMP-001: JSXComponent

```typescript
type JSXComponent<Props = {}> = (props?: Props) => any | Promise<any>
```

A JSX component is any function that returns renderable output. It MAY be async — the compiler wraps the view phase accordingly.

**Acceptance Criteria:**
- AC-CMP-001-A: Sync components MUST be supported without Promise wrapping overhead.
- AC-CMP-001-B: Async components MUST be awaited in the view phase.

### REQ-JSX-CMP-002: CompiledComponent

```typescript
interface CompiledComponent<Model = any, Msg = any> {
  component: Component<Model, Msg>
  initialModel: Model
}
```

**Acceptance Criteria:**
- AC-CMP-002-A: `initialModel` MUST match the model embedded in `component.init`.

### REQ-JSX-CMP-003: CompileOptions

```typescript
interface CompileOptions {
  extractState?: boolean   // Scan for $state runes → model fields
  interactive?: boolean    // Override auto-detection
  debug?: boolean          // Enable debug output
}
```

---

## 3. Compilation Pipeline

### REQ-JSX-CMP-004: compileToComponent

```typescript
function compileToComponent<Model = {}, Msg = never>(
  jsxComponent: JSXComponent,
  options?: CompileOptions
): Component<Model, Msg>
```

**Pipeline Steps:**

1. **Detect interactivity** (`detectInteractive` or `options.interactive`).
2. **Extract initial model** (if `options.extractState` is true, scan for `$state` rune initializers; otherwise use `{}`).
3. **Build Component:**
   - `init`: `Effect.succeed([initialModel, []])` — no startup commands.
   - `update`: For non-interactive, identity function `(msg, model) → [model, []]`. For interactive, will dispatch messages to rune setters (future).
   - `view`: Calls the JSX component function. Async results are awaited.
   - `subscriptions`: For non-interactive, `undefined`. For interactive, returns subscription effects extracted from the component (future).

**Acceptance Criteria:**
- AC-CMP-004-A: Returned component MUST satisfy the `Component<Model, Msg>` interface from `@tuix/core`.
- AC-CMP-004-B: `init` MUST be an `Effect` that succeeds with `[model, commands[]]`.
- AC-CMP-004-C: `view(model)` MUST call the original JSX component function.
- AC-CMP-004-D: Non-interactive components MUST have `subscriptions === undefined`.

### REQ-JSX-CMP-005: createStatelessComponent

```typescript
function createStatelessComponent(
  jsxComponent: JSXComponent
): Component<{}, never>
```

Simplified shorthand for components with no state and no messages.

**Acceptance Criteria:**
- AC-CMP-005-A: Model type MUST be `{}`.
- AC-CMP-005-B: Message type MUST be `never`.
- AC-CMP-005-C: `update` MUST return the model unchanged.
- AC-CMP-005-D: `view` MUST call `jsxComponent()` with no arguments.

---

## 4. Interactivity Detection

### REQ-JSX-CMP-006: detectInteractive

```typescript
function detectInteractive(jsxComponent: JSXComponent): boolean
```

Determines whether a JSX component produces interactive output. Interactive components have:

- Event handlers (`onClick`, `onKeyPress`, `onChange`, etc.)
- Input elements (`<interactive>`, future `<input>`, `<select>`)
- Subscriptions (keyboard, timer, etc.)

**Current Status**: Returns `false` (placeholder). Full implementation requires either:
- **AST analysis**: Parse the component source for event handler patterns.
- **Runtime inspection**: Render once, walk the View tree for interactive metadata.

**Acceptance Criteria:**
- AC-CMP-006-A: MUST return `boolean`.
- AC-CMP-006-B: When `options.interactive` is provided, it MUST take precedence over auto-detection.

---

## 5. State Extraction

### REQ-JSX-CMP-007: extractModel

```typescript
function extractModel<Model>(
  jsxComponent: JSXComponent,
  options: CompileOptions
): Model
```

Extracts the initial model from a JSX component's reactive state declarations.

**Target Design** (not yet implemented):
1. Scan component body for `$state(initialValue)` calls.
2. Map each rune to a model field: `{ runeName: initialValue }`.
3. Return the assembled model object.

**Current Status**: Returns `{}` (placeholder).

**Acceptance Criteria:**
- AC-CMP-007-A: When `extractState` is false or not set, MUST return `{}`.
- AC-CMP-007-B: When `extractState` is true, MUST attempt extraction (currently returns `{}`).

---

## 6. Rune-to-MVU Mapping (Design Target)

This section defines the intended architecture for how Svelte-inspired runes map to MVU constructs. This is the primary design challenge of the compiler.

### REQ-JSX-CMP-008: $state → Model Field

Each `$state(initial)` call in a component maps to:
- A **model field** holding the current value.
- A **message variant** for updating that field.
- An **update case** that applies the new value.

```typescript
// JSX authored:
function Counter() {
  const count = $state(0)
  return <text>Count: {count()}</text>
}

// Compiler produces:
// Model = { count: 0 }
// Msg = { type: 'set_count', value: number }
// update: (model, msg) => msg.type === 'set_count' ? [{ ...model, count: msg.value }, []] : [model, []]
// view: (model) => <text>Count: {model.count}</text>
```

### REQ-JSX-CMP-009: $derived → Computed View Logic

`$derived(fn)` runes MUST be evaluated during the view phase from current model values. They do NOT generate model fields or messages.

### REQ-JSX-CMP-010: $effect → Command/Subscription

`$effect(fn)` runes map to either:
- **Commands** (one-shot side effects) if the effect runs once.
- **Subscriptions** (continuous) if the effect sets up an ongoing listener.

---

## 7. runApp Integration

### REQ-JSX-CMP-011: runApp

```typescript
// packages/jsx/src/compiler/runApp.ts
function runApp(component: Component<any, any>): Effect.Effect<void, never, AppServices>
```

Bridge function that takes a compiled component and launches it in the MVU runtime.

**Acceptance Criteria:**
- AC-CMP-011-A: MUST delegate to the runtime's component execution pipeline.
- AC-CMP-011-B: MUST provide all required `AppServices` (Terminal, Input, Renderer, Storage).

---

## 8. Invariants

| ID | Invariant |
|----|-----------|
| INV-CMP-001 | Every compiled component satisfies `Component<Model, Msg>` — no partial implementations. |
| INV-CMP-002 | `compileToComponent` never throws for valid JSXComponent input. |
| INV-CMP-003 | Stateless components (`createStatelessComponent`) have `Model = {}` and `Msg = never`. |
| INV-CMP-004 | The compiler does not execute the component during compilation — execution happens at runtime in the view phase. |
| INV-CMP-005 | Rune-to-MVU mapping preserves the one-way data flow: Model → View → Message → Update → Model. |

---

## 9. Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| `compileToComponent` | Skeleton | Produces valid component, no real state extraction |
| `createStatelessComponent` | Complete | Fully functional for CLI-style components |
| `detectInteractive` | Stub | Always returns false |
| `extractModel` | Stub | Always returns `{}` |
| Rune-to-MVU mapping | Design only | REQ-JSX-CMP-008/009/010 define target |
| `runApp` | Partial | Basic bridge exists |

---

## 10. Requirement Cross-References

| REQ ID | Description | Test Cases | Related Specs |
|--------|-------------|------------|---------------|
| REQ-JSX-CMP-001 | JSXComponent type | TC-JSX-CMP-001 | JSX_RUNTIME_SPEC |
| REQ-JSX-CMP-002 | CompiledComponent | TC-JSX-CMP-002 | — |
| REQ-JSX-CMP-003 | CompileOptions | TC-JSX-CMP-003 | — |
| REQ-JSX-CMP-004 | compileToComponent | TC-JSX-CMP-004 | RUNTIME_SPEC (Component interface) |
| REQ-JSX-CMP-005 | createStatelessComponent | TC-JSX-CMP-005 | — |
| REQ-JSX-CMP-006 | detectInteractive | TC-JSX-CMP-006 | — |
| REQ-JSX-CMP-007 | extractModel | TC-JSX-CMP-007 | — |
| REQ-JSX-CMP-008 | $state → Model | TC-JSX-CMP-008 | HOOKS_SPEC (runes integration) |
| REQ-JSX-CMP-009 | $derived → View | TC-JSX-CMP-009 | — |
| REQ-JSX-CMP-010 | $effect → Cmd/Sub | TC-JSX-CMP-010 | SUBSCRIPTIONS_SPEC |
| REQ-JSX-CMP-011 | runApp | TC-JSX-CMP-011 | RUNTIME_SPEC |
