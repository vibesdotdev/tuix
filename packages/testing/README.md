# @tuix/testing

Testing utilities and harness for TUIX components and applications

## Installation

```bash
bun add @tuix/testing
# or
npm install @tuix/testing
```

## Overview

This package is part of the **TUIX** framework - a performant TUI framework for Bun with JSX and reactive state management.

### Category: Development

Development packages provide tooling for building, debugging, and testing TUIX applications.

## Usage

```typescript
import { /* exports */ } from '@tuix/testing'
```

## API Reference

- **Default**: `./src/index.ts`

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
cd packages/testing
bun test

# Run type checking
bun run typecheck
```

## Related Packages

- [@tuix/core](packages/core/README.md) - Core TUIX framework with MVU architecture, reactivity, and coordination
- [@tuix/config](packages/config/README.md) - Configuration management system with multiple sources and validation
- [@tuix/jsx-runtime](packages/jsx-runtime/README.md) - Custom JSX runtime for TUIX applications with TypeScript support
- [@tuix/runtime](packages/runtime/README.md) - Runtime system for TUIX applications with fiber scheduling
- [@tuix/process-manager](packages/process-manager/README.md) - Process management and service coordination for development workflows

## License

MIT
