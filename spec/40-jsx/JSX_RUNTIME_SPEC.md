# JSX Runtime Spec

*Pod D: JSX & Authoring — WS4*

## Purpose

Define the canonical JSX runtime that transforms JSX/TSX syntax into `View` objects consumable by the MVU runtime. JSX is the **primary user-facing API** (DEC-003); every JSX tree MUST compile to `Component<Model, Msg>` and run through the MVU loop — no direct-render bypass paths.

---

## 1. Overview

The JSX runtime sits at **L4 Authoring** and depends on:

| Dependency | Layer | Used For |
|------------|-------|----------|
| `@tuix/view` | L2 | `View`, `text`, `vstack`, `hstack`, `styledText`, `styledBox`, `flexbox`, `spacer` |
| `@tuix/ansi` | L0 | `style`, `Style`, `color`, `border`, `StyleProps` |
| `@tuix/reactive` | L3 | `$state`, `$derived`, `$effect`, `isBindableRune`, `isStateRune`, event bus |
| `@tuix/core` | L1 | `Component`, `View`, `Cmd`, `Sub`, registry, event bus |
| `effect` | External | `Effect` for typed side-effects |

**Package**: `@tuix/jsx`
**Entry point**: `packages/jsx/src/index.ts`

---

## 2. JSX Element Descriptor

### REQ-JSX-001: JSXElement Interface

All JSX factory calls produce a `JSXElement` descriptor — a lightweight POJO that is **not** a `View`. Rendering is deferred until the MVU runtime's view phase calls `render()`.

```typescript
interface JSXElement {
  $$typeof: symbol           // Symbol.for("tuix.jsx.element")
  type: string | Function    // Intrinsic tag name OR function component
  props: Record<string, any> // Resolved props (children merged, key/ref extracted)
  key: string | number | null
  ref?: unknown
  __source?: { fileName: string; lineNumber: number; columnNumber: number }
  __self?: unknown
}
```

**Acceptance Criteria:**
- AC-001-A: `$$typeof` MUST equal `Symbol.for("tuix.jsx.element")`.
- AC-001-B: `key` and `ref` MUST be extracted from props and NOT appear in `props`.
- AC-001-C: `children` prop MUST be normalized: single child → value, multiple → array.
- AC-001-D: `__source` and `__self` MUST be preserved in development builds only.

### REQ-JSX-002: JSXNode Union

Valid return types from JSX expressions:

```typescript
type JSXNode = JSXElement | string | number | boolean | null | undefined | JSXNode[]
```

**Acceptance Criteria:**
- AC-002-A: `null`, `undefined`, and `boolean` values MUST render as empty text (`text("")`).
- AC-002-B: `string` and `number` values MUST render as `text(String(value))`.
- AC-002-C: Arrays MUST be flattened and each element rendered independently.

---

## 3. Factory Functions

### REQ-JSX-003: jsx / jsxs / jsxDEV

Three entry points, all producing `JSXElement` via `createJSXElement`:

| Function | Purpose | Signature |
|----------|---------|-----------|
| `jsx` | Single-child elements | `(type, props, key?) → JSXElement` |
| `jsxs` | Static multi-child elements | `(type, props, key?) → JSXElement` |
| `jsxDEV` | Development mode with source info | `(type, props, key?, isStatic?, source?, self?) → JSXElement` |

**Acceptance Criteria:**
- AC-003-A: `jsx` and `jsxs` MUST produce identical output (distinction is for future reconciler optimization).
- AC-003-B: `jsxDEV` MUST attach `__source` and `__self` to the element when provided.
- AC-003-C: All three MUST normalize keys via `normalizeKey` (null for null/undefined/boolean; identity for string/number; String() for other types).

### REQ-JSX-004: createElement (Compatibility)

```typescript
function createElement(
  type: string | Function,
  props: Record<string, unknown> | null,
  ...children: unknown[]
): JSXElement
```

**Acceptance Criteria:**
- AC-004-A: `createElement` MUST pass rest `children` as `additionalChildren` to `createJSXElement`.
- AC-004-B: Key MUST always be `null` (no key override parameter).

---

## 4. Rendering Pipeline

### REQ-JSX-005: render() — Top-Level Entry

```typescript
function render(element: JSXNode | View): View
```

Converts any `JSXNode` or existing `View` into a concrete `View` for the MVU runtime.

**Acceptance Criteria:**
- AC-005-A: If input is already a `View` (passes `isView()`), return it unchanged.
- AC-005-B: If input is `null`/`undefined`/`boolean`, return `text("")`.
- AC-005-C: If input is a `JSXElement`, call `renderJSX(element.type, element.props)`.
- AC-005-D: If input is a string/number, return `text(String(input))`.

### REQ-JSX-006: renderJSX() — Internal Dispatcher

```typescript
function renderJSX(
  type: string | Function,
  props: Record<string, unknown> | null,
  ...children: unknown[]
): View
```

Routes to the appropriate handler:

1. **Hidden check**: If `props.hidden === true`, return `text("")`.
2. **Function component**: Call `type(componentProps)` and recursively render the result.
3. **Intrinsic element**: Dispatch via `switch(type)` to built-in handlers (see JSX_PRIMITIVES_SPEC).
4. **Unknown type**: Return `text("[${type}]")` as fallback.

**Acceptance Criteria:**
- AC-006-A: Function components MUST receive `{ ...props, children: validChildren }`.
- AC-006-B: Function component results MUST be recursively rendered: JSXElement → re-enter `renderJSX`; View → return directly; array → `ensureViewArray` then `vstack`.
- AC-006-C: Children MUST be flattened (`flat(Infinity)`) and filtered (`!= null`).
- AC-006-D: Unknown intrinsic types MUST NOT throw; they MUST produce a debug text node.

### REQ-JSX-007: renderChild() — Recursive Node Renderer

Converts a single unknown value to `View | null`:

| Input Type | Output |
|-----------|--------|
| `null`, `undefined`, `boolean` | `null` |
| Passes `isView()` | Input as-is |
| `Array` | Recursively render each element; wrap multiple in `vstack` |
| `JSXElement` | `renderJSX(element.type, element.props)` |
| Object with `.render()` method | Return as `View` |
| String/number/bigint | `text(String(value))` |

**Acceptance Criteria:**
- AC-007-A: Arrays containing a single renderable child MUST return that child unwrapped (no unnecessary vstack).
- AC-007-B: Objects with a `render` function MUST be treated as View instances.

---

## 5. Fragment

### REQ-JSX-008: Fragment Component

```typescript
const Fragment = ({ children }: { children?: React.ReactNode }) => View
```

**Acceptance Criteria:**
- AC-008-A: Zero children → `text("")`.
- AC-008-B: Single child → return as-is (no wrapper).
- AC-008-C: Multiple children → wrap in `vstack(validChildren)`.

---

## 6. Style Integration

### REQ-JSX-009: Style Resolution

Styles are resolved through a composable chain:

1. `extractStyleProps(value)` — Extract `Partial<StyleProps>` from a `Style` instance, plain object, or `{ props }` wrapper.
2. `mergeStyleProps(...inputs)` — Shallow-merge an array of style partials (later wins).
3. `buildStyle(...inputs)` — Merge then construct a `style()` instance.

**Acceptance Criteria:**
- AC-009-A: `Style` instances MUST be detected via `instanceof Style`.
- AC-009-B: Objects with a nested `props` field MUST have that `props` extracted.
- AC-009-C: `buildStyle` with no non-empty inputs MUST return `style()` (default/unstyled).

---

## 7. JSX Namespace Types

### REQ-JSX-010: IntrinsicElements Declaration

The `JSX` namespace MUST declare all supported intrinsic element types so TypeScript provides autocompletion and type checking:

```typescript
namespace JSX {
  interface Element extends JSXElement {}

  interface IntrinsicElements {
    text: { children?: unknown; style?: Style }
    box: {
      children?: unknown; style?: Style; border?: string | boolean
      borderStyle?: string; borderColor?: string
      padding?: number | PaddingObject; margin?: number
      width?: number; height?: number; minWidth?: number; minHeight?: number
      background?: string; variant?: string
    }
    vstack: { children?: unknown; gap?: number; align?: "left" | "center" | "right" }
    hstack: { children?: unknown; gap?: number; align?: "top" | "middle" | "bottom" }
    "styled-text": { children?: unknown; style?: Style }
    styledText: { children?: unknown; style?: Style }
    scope: Record<string, unknown>
    "scope-content": Record<string, unknown>
    "scope-fallback": Record<string, unknown>
  }

  interface ElementChildrenAttribute {
    children: {}
  }
}
```

**Acceptance Criteria:**
- AC-010-A: All intrinsic elements rendered in `renderJSX` MUST have a corresponding `IntrinsicElements` entry.
- AC-010-B: `ElementChildrenAttribute` MUST be declared so TSX resolves the `children` prop.
- AC-010-C: Intrinsic elements not yet in the declaration (flex, heading, code, icon, panel, card, interactive, spacer) MUST be added.

---

## 8. Exports

### REQ-JSX-011: Public API Surface

The `@tuix/jsx` package MUST export the following:

| Export | Type | Purpose |
|--------|------|---------|
| `jsx`, `jsxs`, `jsxDEV` | Function | JSX factory functions (automatic JSX transform) |
| `createElement` | Function | Classic JSX transform compatibility |
| `Fragment` | Component | Fragment grouping |
| `render` | Function | JSXNode/View → View conversion |
| `JSXElement`, `JSXNode` | Type | Core descriptor types |
| `JSX` namespace | Types | IntrinsicElements, Element |
| `pluginRegistry` | Instance | Global JSXPluginRegistry singleton |
| `registerPlugin`, `registerCommand`, `executeCommand`, `getScopeManager` | Function | Convenience bound methods |
| `JSXContext` | Object | `{ registry, getScopeManager }` |
| Event types | Types | `InteractiveEventMap`, `InteractiveMetadata`, `ViewEvent` |
| Compiler exports | Module | `compileToComponent`, `createStatelessComponent` (see JSX_COMPILER_SPEC) |
| Scope exports | Module | `Scope`, `ScopeContent`, `ScopeFallback`, types (see JSX_SCOPE_PLUGIN_SPEC) |

**Acceptance Criteria:**
- AC-011-A: All listed exports MUST be reachable from `import { ... } from '@tuix/jsx'`.
- AC-011-B: No internal helpers (`createJSXElement`, `renderJSX`, `renderChild`, `ensureViewArray`, etc.) MAY be in the public API.

---

## 9. Invariants

| ID | Invariant |
|----|-----------|
| INV-JSX-001 | Every JSXElement has `$$typeof === Symbol.for("tuix.jsx.element")`. |
| INV-JSX-002 | `render()` always returns a valid `View` — never null, never throws for valid JSXNode input. |
| INV-JSX-003 | Function components are called synchronously during the view phase. Async components require the compiler path (see JSX_COMPILER_SPEC). |
| INV-JSX-004 | JSX trees do not directly mutate terminal state. All rendering goes through the MVU runtime's `RendererService`. |
| INV-JSX-005 | The `hidden` prop is the sole mechanism for conditional visibility at the JSX level. |

---

## 10. Requirement Cross-References

| REQ ID | Description | Test Cases | Related Specs |
|--------|-------------|------------|---------------|
| REQ-JSX-001 | JSXElement interface | TC-JSX-001 | — |
| REQ-JSX-002 | JSXNode union | TC-JSX-002 | — |
| REQ-JSX-003 | jsx/jsxs/jsxDEV factories | TC-JSX-003 | — |
| REQ-JSX-004 | createElement compat | TC-JSX-004 | — |
| REQ-JSX-005 | render() entry | TC-JSX-005 | RUNTIME_SPEC (view phase) |
| REQ-JSX-006 | renderJSX dispatcher | TC-JSX-006 | JSX_PRIMITIVES_SPEC |
| REQ-JSX-007 | renderChild recursion | TC-JSX-007 | — |
| REQ-JSX-008 | Fragment | TC-JSX-008 | — |
| REQ-JSX-009 | Style integration | TC-JSX-009 | — |
| REQ-JSX-010 | IntrinsicElements types | TC-JSX-010 | JSX_PRIMITIVES_SPEC |
| REQ-JSX-011 | Public API surface | TC-JSX-011 | JSX_COMPILER_SPEC, JSX_SCOPE_PLUGIN_SPEC |
