# @tuix/reactive

Reactivity system with Svelte-like runes, scope management, and JSX lifecycle.

## Status

🚧 **Under Construction** - This package is being created as part of the @tuix/core split refactoring (Phase 6).

## Purpose

Provides reactive state management for TUIX applications:

- **Runes** - `$state`, `$derived`, `$effect` (Svelte-inspired)
- **Scopes** - Scope management and lifecycle
- **Events** - Event bus for inter-component communication
- **JSX Integration** - React-like hooks and lifecycle for JSX components

## Installation

```bash
bun add @tuix/reactive
```

## Usage

Coming soon after Phase 6 migration.

## Migration Source

Code will be consolidated from:
- `@tuix/core/src/update/reactivity/` - Runes implementation
- `@tuix/core/src/model/scope/` - Scope management
- `@tuix/core/src/model/events/` - Event bus

## Dependencies

- `@tuix/core` - Core types and foundation
- `effect` - Effect system for reactive operations
