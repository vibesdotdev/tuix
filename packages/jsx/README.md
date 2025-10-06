@tuix/jsx

Custom JSX runtime for TUIX applications with TypeScript support

## Installation

```bash
bun add @tuix/jsx-runtime
# or
npm install @tuix/jsx-runtime
```

## Overview

This package is part of the **TUIX** framework - a performant TUI framework for Bun with JSX and reactive state management.

### Category: Core

Core packages provide the fundamental architecture and runtime for TUIX applications.

## Usage

```typescript
import { /* exports */ } from '@tuix/jsx-runtime'
```

## API Reference

- **Default**: `./src/index.ts`
- **./jsx-dev-runtime**: `./src/dev.ts`

## Examples

See tests and documentation for usage examples.

## Development

This package is part of the TUIX monorepo. For development:

```bash
# Clone the monorepo
git clone https://github.com/cinderlink/tuix.git
cd tuix

# Install dependencies
bun install

# Run tests for this package
cd packages/jsx-runtime
bun test

# Run type checking
bun run typecheck
```

## Related Packages

- [@tuix/core](packages/core/README.md) - Core TUIX framework with MVU architecture, reactivity, and coordination
- [@tuix/config](packages/config/README.md) - Configuration management system with multiple sources and validation
- [@tuix/runtime](packages/runtime/README.md) - Runtime system for TUIX applications with fiber scheduling
- [@tuix/process-manager](packages/process-manager/README.md) - Process management and service coordination for development workflows
- [@tuix/terminal](packages/terminal/README.md) - Terminal I/O abstraction and ANSI rendering capabilities

## License

MIT
