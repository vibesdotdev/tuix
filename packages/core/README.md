# @tuix/core

Core TUIX framework with MVU architecture, reactivity, and coordination

## Installation

```bash
bun add @tuix/core
# or
npm install @tuix/core
```

## Overview

This package is part of the **TUIX** framework - a performant TUI framework for Bun with JSX and reactive state management.

### Category: Core

Core packages provide the fundamental architecture and runtime for TUIX applications.

## Usage

```typescript
import { /* exports */ } from '@tuix/core'
```

## API Reference

- **Default**: `./src/index.ts`

## Examples

```typescript
import { render, Component } from '@tuix/core'

// Create a simple TUI component
const App = () => (
  <box direction="vertical">
    <text>Hello, TUIX!</text>
  </box>
)

// Render to terminal
render(App)
```

## Development

This package is part of the TUIX monorepo. For development:

```bash
# Clone the monorepo
git clone https://github.com/cinderlink/tuix.git
cd tuix

# Install dependencies
bun install

# Run tests for this package
cd packages/core
bun test

# Run type checking
bun run typecheck
```

## Related Packages

- [@tuix/config](packages/config/README.md) - Configuration management system with multiple sources and validation
- [@tuix/jsx-runtime](packages/jsx-runtime/README.md) - Custom JSX runtime for TUIX applications with TypeScript support
- [@tuix/runtime](packages/runtime/README.md) - Runtime system for TUIX applications with fiber scheduling
- [@tuix/process-manager](packages/process-manager/README.md) - Process management and service coordination for development workflows
- [@tuix/terminal](packages/terminal/README.md) - Terminal I/O abstraction and ANSI rendering capabilities

## License

MIT
