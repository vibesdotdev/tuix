# @tuix/tuix

Main TUIX framework package with React-like TUI development experience

## Installation

```bash
bun add @tuix/tuix
# or
npm install @tuix/tuix
```

## Overview

This package is part of the **TUIX** framework - a performant TUI framework for Bun with JSX and reactive state management.

### Category: Ui

UI packages contain components and utilities for building user interfaces.

## Usage

```typescript
import { /* exports */ } from '@tuix/tuix'
```

## API Reference

- **Default**: `./src/index.ts`
- **./runtime**: `@tuix/core`
- **./cli**: `@tuix/cli`
- **./plugins**: `@tuix/plugins/index.ts`
- **./jsx**: `@tuix/jsx-runtime`
- **./jsx-runtime**: `@tuix/jsx-runtime`
- **./jsx-dev-runtime**: `@tuix/jsx-runtime`
- **./cli/jsx**: `@tuix/cli`
- **./debug**: `@tuix/debug`
- **./components**: `@tuix/ui/components/index.ts`
- **./components/data**: `@tuix/ui/components/data/index.ts`
- **./components/display**: `@tuix/ui/components/display/index.ts`
- **./components/display/text**: `@tuix/ui/components/display/text/index.ts`
- **./components/display/large-text**: `@tuix/ui/components/display/large-text/index.ts`
- **./components/feedback**: `@tuix/ui/components/feedback/index.ts`
- **./components/feedback/spinner**: `@tuix/ui/components/feedback/spinner/index.ts`
- **./components/forms**: `@tuix/ui/components/forms/index.ts`
- **./components/forms/text-input**: `@tuix/ui/components/forms/text-input/index.ts`
- **./components/forms/button**: `@tuix/ui/components/forms/button/index.ts`
- **./components/layout**: `@tuix/ui/components/layout/index.ts`
- **./components/layout/box**: `@tuix/ui/components/layout/box/index.ts`
- **./components/layout/flex**: `@tuix/ui/components/layout/flex/index.ts`
- **./styling**: `@tuix/styling/index.ts`
- **./process-manager**: `@tuix/process-manager`
- **./logger**: `@tuix/logger`
- **./testing**: `@tuix/testing`
- **./core**: `@tuix/core`
- **./config**: `@tuix/config`

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
cd packages/tuix
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
