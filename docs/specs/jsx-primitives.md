# JSX Primitives Specification

This document defines the core JSX intrinsic elements supported by the TUIX runtime. Implement these primitives before refactoring components so the runtime contract stays stable.

## Design Goals

- Provide a small, predictable “terminal DOM” that covers the majority of CLI app needs.
- Map each primitive directly to an existing `@tuix/core` view builder or controller.
- Keep composites minimal: anything opinionated or themed belongs in `@tuix/jsx/components` or `@tuix/ui`.
- Accept both fluent `Style` builders and plain style objects for all `style` props.
- Keep events declarative: intrinsics expose event callbacks, the runtime wires them into MVU handlers.

## Shared Props

All primitives accept the following unless stated otherwise:

| Prop | Type | Notes |
| --- | --- | --- |
| `style` | `Style \| StyleProps` | Detect `instanceof Style` / duck-type `.props`; plain objects pass through unchanged. |
| `className` | `string` | Optional logical identifier for dev tooling. |
| `hidden` | `boolean` | Skip rendering when true. |
| `children` | `JSX.Element \| JSX.Element[] \| string` | Normal JSX children. |

### Event Props (Interactive Elements Only)

- `onClick`, `onKeyPress`, `onFocus`, `onBlur`, `onSubmit`, `onChange`, `onHover` are optional callbacks.
- Runtime must translate these into MVU events via `interactive` wrappers.

## Primitive Catalog

### Typography & Inline

| Tag | Purpose | Key Props | Runtime Mapping |
| --- | --- | --- | --- |
| `text` | Basic text node | `truncate`, `wrap`, `align` | `View.text` with optional layout transforms |
| `styled-text` | Styled text via Style builder/props | `style` (required) | `View.styledText` |
| `heading` | Semantic heading levels | `level (1-6)` | `Text` component with preset styles |
| `code` | Inline/blocks of code | `language?` | Styled `text` with monospace palette |
| `icon` | Symbol rendering | `glyph`, `color` | Maps to `text` with width awareness |

### Layout & Containers

| Tag | Purpose | Key Props | Mapping |
| --- | --- | --- | --- |
| `box` | Generic container with padding/border | `padding`, `margin`, `border`, `background`, `gap`, `direction`, `scrollable` | Wraps `StyleBuilder` + `View.box` |
| `flex` | Flexible layout | `direction`, `wrap`, `gap`, `align`, `justify` | `Flex` controller -> `hstack`/`vstack` |
| `vstack` / `hstack` | Simple stacking | `gap`, `align`, `justify` | `View.vstack` / `View.hstack` |
| `spacer` | Flexible empty space | `size` | `View.empty` + layout hints |
| `panel` | Default bordered container | `title`, `footer` | Composes `box` with presets |
| `card` | Elevated surface | same as `panel` | Preset `box` variant |
| `scrollview` | Scrollable area | `width`, `height`, `showScrollbars`, `smoothScroll` | `Viewport` store with vertical scroll |
| `viewport` | Full featured scroll region | same as `scrollview` + directional scroll | `Viewport` store (existing) |

### Interactive Controls

| Tag | Purpose | Key Props | Mapping |
| --- | --- | --- | --- |
| `interactive` | Event wrapper | `focusable`, events | Root for wiring focus/mouse/keyboard |
| `button` | Action trigger | `variant`, `size`, `disabled`, `loading`, `icon`, events | Maps to `Button` controller + `interactive` |
| `text-input` | Single-line input | `value`, `bind:value`, `placeholder`, `width`, `echoMode`, events | Existing `TextInput` store |
| `textarea` | Multi-line input | `rows`, `cols`, `wrap`, bindings | Extends `text-input` store |
| `checkbox` | Boolean toggle | `checked`, `bind:checked`, `label` | Simple interactive view |
| `toggle` | Binary switch | `on`, `bind:on`, `labels` | Variation of checkbox |
| `spinner` | Loading indicator | `type`, `color`, `size`, `text`, `speed` | Existing spinner frames |
| `modal` | Overlay container | `open`, `title`, `onClose`, `backdrop` | Wraps `box` + overlay layout |
| `tooltip` | Hover/focus hint | `content`, `placement` | Renders conditional `box` |
| `toast` | Temporary notification | `kind`, `duration`, `onDismiss` | Renders timed overlay |

### Scope & CLI Integration

| Tag | Purpose | Key Props | Mapping |
| --- | --- | --- | --- |
| `scope` | Register scope lifecycle | `type`, `name`, `path`, `layout`, `defaultContent` | Existing scope components |
| `scope-content` | Content slot inside scope | – | Existing scope component |
| `scope-fallback` | Default help/empty state | `scopeId?` | Existing fallback |
| `command` | CLI command wrapper | `name`, `description`, `handler` | CLI scope integration |
| `plugin` | Plugin entry point | `name`, `metadata` | Plugin scope registration |

## Runtime Responsibilities

1. **Style Normalization:** If `style` is a `Style` instance, use `style.props`. Plain objects pass through untouched.
2. **Child Flattening:** Flatten nested arrays, ignore `null`/`undefined`, convert bare strings to `text` nodes.
3. **Event Wiring:** Wrap interactive primitives with the `interactive` view to hook keyboard/mouse events. Ensure focus state is coordinated with rune stores.
4. **Scope Emission:** For scope-related tags, call the scope manager and emit events via `JSXModule` exactly once per render activation.
5. **Fragments:** Continue returning single child directly; wrap multiple children in `vstack` consistent with existing behavior.

## Adding New Primitives

Before adding a new intrinsic:
1. Verify it satisfies the primitive litmus test (widely useful, customizable, easier to express as a first-class primitive than via composition).
2. Document its props and runtime mapping in this file before implementation.
3. Update tests covering `packages/jsx/src/jsx-runtime.ts` to include the new tag.
4. Announce availability in `@tuix/jsx/components` if a convenience wrapper is provided.

## Relationship to Components

- **`@tuix/jsx/components`** exports composable patterns built *only* with primitives (e.g., `Tabs`, `Form`, `List`).
- **`@tuix/ui`** builds opinionated, themeable widgets on top of those components with styling presets.
- Primitive implementations must avoid importing from `@tuix/ui` to keep layering clean.

## Next Steps

1. Implement runtime cases for the primitives above (start with typography + layout + interactive staples).
2. Refactor existing JSX components to use the new tags exclusively.
3. Update documentation and examples to reflect the new primitive vocabulary.

