# @tuix/input

Keyboard, mouse, and focus management for terminal input.

## Status

🚧 **Under Construction** - This package is being created as part of the @tuix/core split refactoring (Phase 4).

## Purpose

Provides comprehensive input handling for TUIX applications:

- **Keyboard** - Key event parsing, shortcuts, bindings
- **Mouse** - Mouse event handling, hit testing
- **Focus** - Focus management and routing

## Installation

```bash
bun add @tuix/input
```

## Usage

Coming soon after Phase 4 migration.

## Migration Source

Code will be consolidated from:
- `@tuix/core/src/input/` - Focus management, routing
- `@tuix/terminal/src/input/` - Keyboard event definitions
- `@tuix/core/src/terminal/input/` - Key utilities

## Dependencies

- `@tuix/core` - Core types and foundation
- `effect` - Effect system for input handling
