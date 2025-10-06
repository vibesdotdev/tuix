# @tuix/config

Configuration management system with multiple sources and validation

## Installation

```bash
bun add @tuix/config
# or
npm install @tuix/config
```

## Overview

This package is part of the **TUIX** framework - a performant TUI framework for Bun with JSX and reactive state management.

### Category: Core

Core packages provide the fundamental architecture and runtime for TUIX applications.

## Usage

```typescript
import { /* exports */ } from '@tuix/config'
```

## API Reference

- **Default**: `./src/index.ts`

## Examples

```typescript
import { defineConfig, loadConfig } from '@tuix/config'

// Define configuration
const config = defineConfig({
  name: 'my-app',
  logger: {
    level: 'info',
    format: 'pretty'
  }
})

// Load configuration
const loaded = await loadConfig('my-app')
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
cd packages/config
bun test

# Run type checking
bun run typecheck
```

## Related Packages

- [@tuix/core](packages/core/README.md) - Core TUIX framework with MVU architecture, reactivity, and coordination
- [@tuix/jsx-runtime](packages/jsx-runtime/README.md) - Custom JSX runtime for TUIX applications with TypeScript support
- [@tuix/runtime](packages/runtime/README.md) - Runtime system for TUIX applications with fiber scheduling
- [@tuix/process-manager](packages/process-manager/README.md) - Process management and service coordination for development workflows
- [@tuix/terminal](packages/terminal/README.md) - Terminal I/O abstraction and ANSI rendering capabilities

## License

MIT
