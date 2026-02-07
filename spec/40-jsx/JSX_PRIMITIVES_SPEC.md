# JSX Primitives Spec

*Pod D: JSX & Authoring — WS4*

## Purpose

Define every built-in (intrinsic) JSX element, its props contract, rendering behavior, and event semantics. These are the terminal-native building blocks that JSX authors use to compose UIs. All primitives render through the `renderJSX` switch in the JSX runtime (REQ-JSX-006) and ultimately produce `@tuix/view` `View` objects.

---

## 1. Primitive Catalog

| Intrinsic | View Mapping | Category |
|-----------|-------------|----------|
| `<text>` | `text()` / `styledText()` | Content |
| `<styled-text>` / `<styledText>` | `styledText()` | Content |
| `<heading>` | `styledText()` with level presets | Content |
| `<code>` | `styledText()` with code styling | Content |
| `<icon>` | `styledText()` with glyph | Content |
| `<box>` | `styledBox()` | Container |
| `<panel>` | `styledBox()` via `<box>` delegation | Container |
| `<card>` | `styledBox()` via `<box>` delegation | Container |
| `<vstack>` | `vstack()` | Layout |
| `<hstack>` | `hstack()` | Layout |
| `<flex>` | `flexbox()` | Layout |
| `<spacer>` | `spacer()` | Layout |
| `<interactive>` | View + `INTERACTIVE_METADATA` symbol | Interactive |
| `<scope>` | `Scope()` | Routing |
| `<scope-content>` | `ScopeContent()` | Routing |
| `<scope-fallback>` | `ScopeFallback()` | Routing |

---

## 2. Content Primitives

### REQ-JSX-PRI-001: `<text>`

Renders inline text content, optionally styled.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `JSXNode` | — | Text content (strings, numbers, nested elements) |
| `style` | `Style \| Partial<StyleProps>` | none | ANSI style to apply |

**Rendering Rules:**
1. If all children resolve to text (string/number/bigint), produce a single `text()` or `styledText()` call.
2. If children contain non-text nodes, render each child via `ensureViewArray` and wrap multiple in `vstack`.

**Acceptance Criteria:**
- AC-PRI-001-A: `<text>Hello</text>` → `text("Hello")`.
- AC-PRI-001-B: `<text style={style({ bold: true })}>Bold</text>` → `styledText("Bold", style({ bold: true }))`.
- AC-PRI-001-C: `<text>{42}</text>` → `text("42")`.

### REQ-JSX-PRI-002: `<styled-text>` / `<styledText>`

Always applies styling, even for empty content.

**Props:** Same as `<text>`.

**Rendering Rules:**
1. Extract text content (default to `""`).
2. Always call `styledText(content, buildStyle(styleProps))`.

**Acceptance Criteria:**
- AC-PRI-002-A: Both tag names (`styled-text`, `styledText`) MUST produce identical output.

### REQ-JSX-PRI-003: `<heading>`

Renders text with preset heading styles by level.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `JSXNode` | — | Heading content |
| `level` | `1-6` | `1` | Heading hierarchy level |
| `style` | `Style \| Partial<StyleProps>` | level preset | Override/extend preset |

**Level Presets:**

| Level | bold | underline | foreground | faint |
|-------|------|-----------|------------|-------|
| 1 | true | true | white | — |
| 2 | true | — | white | — |
| 3 | true | — | gray | — |
| 4 | true | — | — | — |
| 5 | — | — | gray | — |
| 6 | — | — | gray | true |

**Acceptance Criteria:**
- AC-PRI-003-A: Level MUST be clamped to [1, 6].
- AC-PRI-003-B: User `style` MUST merge ON TOP of the level preset (user wins on conflict).

### REQ-JSX-PRI-004: `<code>`

Renders inline code with code-specific styling.

**Props:** Same as `<text>`.

**Base Style:**
```typescript
{ foreground: color.green, background: color.black }
```

**Acceptance Criteria:**
- AC-PRI-004-A: User `style` MUST merge on top of code base style.

### REQ-JSX-PRI-005: `<icon>`

Renders a single glyph/emoji character.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `glyph` | `string` | — | Icon character (takes precedence over children) |
| `children` | `JSXNode` | — | Fallback icon content |
| `style` | `Style \| Partial<StyleProps>` | none | Styling |

**Acceptance Criteria:**
- AC-PRI-005-A: If `glyph` is provided, it MUST take precedence over children.
- AC-PRI-005-B: If neither `glyph` nor children resolve to text, render `""`.

---

## 3. Container Primitives

### REQ-JSX-PRI-006: `<box>`

Renders a styled box with optional border, padding, and dimensions.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `JSXNode` | — | Box content |
| `style` | `Style \| Partial<StyleProps>` | none | Content area styling |
| `border` | `string \| boolean` | none | Border preset name or enable flag |
| `borderStyle` | `string` | — | Alias for `border` |
| `borderColor` | `string` | — | Maps to `borderForeground` |
| `borderBackground` | `string` | — | Border background color |
| `background` | `string` | — | Content background color |
| `padding` | `number \| PaddingObject` | none | Inner spacing |
| `width` | `number` | — | Fixed width |
| `height` | `number` | — | Fixed height |
| `minWidth` | `number` | — | Minimum width |
| `minHeight` | `number` | — | Minimum height |
| `variant` | `string` | — | Alias for `border` |

**PaddingObject:**
```typescript
{ top?: number; right?: number; bottom?: number; left?: number }
// Also supports: { vertical?: number; horizontal?: number }
```

**Border Presets:**

| Value | Resolves To |
|-------|------------|
| `true`, `"true"`, `"single"`, `"thin"` | `border.thin` |
| `"double"` | `border.double` |
| `"rounded"` | `border.rounded` |
| `"thick"` | `border.thick` |
| `"ascii"` | `border.ascii` |
| `false`, `"false"`, `"none"` | No border |

**Acceptance Criteria:**
- AC-PRI-006-A: Children MUST be rendered via `ensureViewArray` and passed to `styledBox`.
- AC-PRI-006-B: `border`, `borderStyle`, and `variant` MUST all resolve through `resolveBorderPreset`.
- AC-PRI-006-C: Numeric `padding` MUST expand to `{ top: n, right: n, bottom: n, left: n }`.
- AC-PRI-006-D: `background` and `borderColor` MUST be injected into the style.

### REQ-JSX-PRI-007: `<panel>`

Sugar for `<box>` with opinionated defaults.

**Defaults Applied:**
- `border`: `"rounded"`
- `padding`: `1`
- `background`: `color.black`
- `borderForeground`: `color.gray`

**Acceptance Criteria:**
- AC-PRI-007-A: `<panel>` MUST delegate to `renderJSX("box", mergedProps)`.
- AC-PRI-007-B: User props MUST override defaults.

### REQ-JSX-PRI-008: `<card>`

Sugar for `<box>` with card-specific defaults.

**Defaults Applied:**
- `border`: `"thin"`
- `padding`: `{ top: 1, bottom: 1, left: 2, right: 2 }`
- `background`: `color.black`
- `borderForeground`: `color.gray`

**Acceptance Criteria:**
- AC-PRI-008-A: `<card>` MUST delegate to `renderJSX("box", mergedProps)`.

---

## 4. Layout Primitives

### REQ-JSX-PRI-009: `<vstack>`

Vertical stack — children rendered top-to-bottom.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `JSXNode` | — | Child elements |

**Acceptance Criteria:**
- AC-PRI-009-A: Output MUST be `vstack(...ensureViewArray(children))`.

### REQ-JSX-PRI-010: `<hstack>`

Horizontal stack — children rendered left-to-right.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `JSXNode` | — | Child elements |

**Acceptance Criteria:**
- AC-PRI-010-A: Output MUST be `hstack(...ensureViewArray(children))`.

### REQ-JSX-PRI-011: `<flex>`

Full CSS Flexbox-inspired layout.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `JSXNode` | — | Child elements |
| `direction` | `"row" \| "column" \| "row-reverse" \| "column-reverse"` | `"row"` | Main axis direction |
| `justify` / `justifyContent` | `"start" \| "center" \| "end" \| "space-between" \| "space-around" \| "space-evenly"` | `"start"` | Main axis alignment |
| `align` / `alignItems` | `"start" \| "center" \| "end" \| "stretch" \| "baseline"` | `"start"` | Cross axis alignment |
| `wrap` | `boolean \| "wrap" \| "nowrap" \| "wrap-reverse"` | `"nowrap"` | Wrapping behavior |
| `gap` | `number` | — | Gap between all items |
| `rowGap` | `number` | — | Gap between rows |
| `columnGap` | `number` | — | Gap between columns |
| `padding` | `number \| PaddingObject` | — | Inner padding |

**Enum Mappings:**

Direction values map to `FlexDirection` enum; justify values to `JustifyContent`; align values to `AlignItems`; wrap values to `FlexWrap`. Both CSS-style (`flex-start`, `space-between`) and shorthand (`start`, `between`) forms are accepted.

**Acceptance Criteria:**
- AC-PRI-011-A: Output MUST be `flexbox(ensureViewArray(children), flexProps)`.
- AC-PRI-011-B: Both `justify`/`justifyContent` and `align`/`alignItems` prop names MUST work.

### REQ-JSX-PRI-012: `<spacer>`

Flexible spacing element.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number` | `1` | Fixed size in columns/rows |
| `flex` | `number` | `0` | Flex grow factor |

**Acceptance Criteria:**
- AC-PRI-012-A: Output MUST be `spacer({ size, flex })`.

---

## 5. Interactive Primitive

### REQ-JSX-PRI-013: `<interactive>`

Wraps content with event-handling metadata. Does NOT render differently — it attaches a hidden `Symbol.for("tuix.interactive")` property to the resulting View.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `JSXNode` | — | Content to make interactive |
| `focusable` | `boolean` | `true` | Whether element can receive focus |
| `disabled` | `boolean` | `false` | Disables all interaction |
| `className` | `string` | — | CSS-like class for theming |
| `role` | `string` | — | Accessibility role hint |
| `tooltip` | `string` | — | Tooltip text |
| `onClick` | `(event: ViewEvent) => unknown` | — | Click handler |
| `onFocus` | `(event: ViewEvent) => unknown` | — | Focus handler |
| `onBlur` | `(event: ViewEvent) => unknown` | — | Blur handler |
| `onMouseEnter` | `(event: ViewEvent) => unknown` | — | Mouse enter handler |
| `onMouseLeave` | `(event: ViewEvent) => unknown` | — | Mouse leave handler |
| `onHover` | `(event: ViewEvent) => unknown` | — | Hover handler |
| `onChange` | `(value: unknown, event: ViewEvent) => unknown` | — | Value change handler |
| `onSubmit` | `(value: unknown, event: ViewEvent) => unknown` | — | Submit handler |
| `onKeyPress` | `(key: string, event: ViewEvent) => unknown` | — | Key press handler |

**Rendering Rules:**
1. Render children to a single View (empty → `text("")`, single → identity, multiple → `vstack`).
2. If `disabled`, set `focusable = false` and skip `onClick`.
3. Attach interactive metadata via `Object.defineProperty` with `enumerable: false`.

**Acceptance Criteria:**
- AC-PRI-013-A: Metadata MUST be non-enumerable (not visible in `JSON.stringify` or `Object.keys`).
- AC-PRI-013-B: When `disabled === true`, `onClick` handler MUST be suppressed.
- AC-PRI-013-C: `focusable` MUST default to `true` unless `disabled`.

---

## 6. Event Bridge

### REQ-JSX-PRI-014: Event Types

```typescript
interface ViewEvent {
  readonly view: View
  readonly data?: Record<string, unknown>
}

interface InteractiveEventMap {
  readonly onClick?: (event: ViewEvent) => unknown
  readonly onFocus?: (event: ViewEvent) => unknown
  readonly onBlur?: (event: ViewEvent) => unknown
  readonly onMouseEnter?: (event: ViewEvent) => unknown
  readonly onMouseLeave?: (event: ViewEvent) => unknown
  readonly onHover?: (event: ViewEvent) => unknown
  readonly onChange?: (value: unknown, event: ViewEvent) => unknown
  readonly onSubmit?: (value: unknown, event: ViewEvent) => unknown
  readonly onKeyPress?: (key: string, event: ViewEvent) => unknown
}

interface InteractiveMetadata extends InteractiveEventMap {
  readonly focusable?: boolean
  readonly disabled?: boolean
  readonly className?: string
  readonly role?: string
  readonly tooltip?: string
  readonly value?: unknown
  readonly placeholder?: string
  readonly echoMode?: string
  readonly multiline?: boolean
}
```

### REQ-JSX-PRI-015: Event Emission

```typescript
function emitEvent(
  view: View,
  event: keyof InteractiveEventMap,
  payload?: unknown,
  info?: Record<string, unknown>
): void
```

**Dispatch Rules:**
- `onChange`, `onSubmit`: Call as `handler(payload, viewEvent)`.
- `onKeyPress`: Call as `handler(payload /*string key*/, viewEvent)`.
- All others: Call as `handler(viewEvent)`.
- All handlers are wrapped in `Effect.runSync(Effect.sync(() => ...))`.

**Acceptance Criteria:**
- AC-PRI-015-A: `emitEvent` on a View without metadata MUST be a no-op (no throw).
- AC-PRI-015-B: `emitEvent` with a missing handler key MUST be a no-op.
- AC-PRI-015-C: All handler invocations MUST be wrapped in Effect for error isolation.

### REQ-JSX-PRI-016: Metadata Access

```typescript
function attachMetadata(view: View, metadata: InteractiveMetadata): View
function getMetadata(view: View): InteractiveMetadata | undefined
```

**Acceptance Criteria:**
- AC-PRI-016-A: `attachMetadata` MUST use `Object.defineProperty` with `enumerable: false, configurable: false, writable: false`.
- AC-PRI-016-B: `getMetadata` on a non-interactive View MUST return `undefined`.

---

## 7. Routing Primitives

### REQ-JSX-PRI-017: `<scope>`, `<scope-content>`, `<scope-fallback>`

These are JSX wrappers for the Scope system. They delegate to the scope components defined in JSX_SCOPE_PLUGIN_SPEC.

**Acceptance Criteria:**
- AC-PRI-017-A: `<scope>` MUST call `Scope({ ...props, children })`.
- AC-PRI-017-B: `<scope-content>` MUST call `ScopeContent({ ...props, children })`.
- AC-PRI-017-C: `<scope-fallback>` MUST call `ScopeFallback({ ...props, children })`.

---

## 8. Helper Utilities

### REQ-JSX-PRI-018: ensureViewArray

```typescript
function ensureViewArray(children: unknown[]): View[]
```

Maps each child through `renderChild`, filtering nulls. Used by all container/layout primitives.

### REQ-JSX-PRI-019: toTextContent

```typescript
function toTextContent(children: unknown[]): string | null
```

Attempts to collapse children to a single string. Returns `null` if any child is not text-coercible.

### REQ-JSX-PRI-020: joinViews

```typescript
function joinViews(views: View[], gap?: number): View
```

Joins views horizontally with optional gap spacing. Default gap: 1.

---

## 9. Requirement Cross-References

| REQ ID | Description | Test Cases | Related Specs |
|--------|-------------|------------|---------------|
| REQ-JSX-PRI-001 | `<text>` | TC-JSX-PRI-001 | JSX_RUNTIME_SPEC (REQ-JSX-006) |
| REQ-JSX-PRI-002 | `<styled-text>` | TC-JSX-PRI-002 | — |
| REQ-JSX-PRI-003 | `<heading>` | TC-JSX-PRI-003 | — |
| REQ-JSX-PRI-004 | `<code>` | TC-JSX-PRI-004 | — |
| REQ-JSX-PRI-005 | `<icon>` | TC-JSX-PRI-005 | — |
| REQ-JSX-PRI-006 | `<box>` | TC-JSX-PRI-006 | — |
| REQ-JSX-PRI-007 | `<panel>` | TC-JSX-PRI-007 | — |
| REQ-JSX-PRI-008 | `<card>` | TC-JSX-PRI-008 | — |
| REQ-JSX-PRI-009 | `<vstack>` | TC-JSX-PRI-009 | — |
| REQ-JSX-PRI-010 | `<hstack>` | TC-JSX-PRI-010 | — |
| REQ-JSX-PRI-011 | `<flex>` | TC-JSX-PRI-011 | — |
| REQ-JSX-PRI-012 | `<spacer>` | TC-JSX-PRI-012 | — |
| REQ-JSX-PRI-013 | `<interactive>` | TC-JSX-PRI-013 | — |
| REQ-JSX-PRI-014 | Event types | TC-JSX-PRI-014 | — |
| REQ-JSX-PRI-015 | Event emission | TC-JSX-PRI-015 | RUNTIME_SPEC (input handling) |
| REQ-JSX-PRI-016 | Metadata access | TC-JSX-PRI-016 | — |
| REQ-JSX-PRI-017 | Scope routing elements | TC-JSX-PRI-017 | JSX_SCOPE_PLUGIN_SPEC |
| REQ-JSX-PRI-018 | ensureViewArray | TC-JSX-PRI-018 | — |
| REQ-JSX-PRI-019 | toTextContent | TC-JSX-PRI-019 | — |
| REQ-JSX-PRI-020 | joinViews | TC-JSX-PRI-020 | — |
