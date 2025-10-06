# TUIX Monorepo

A performant TUI framework for Bun with JSX and reactive state management.

## Overview

TUIX is a bun-native monorepo for building terminal user interfaces with a **JSX-first**, Svelte-5-inspired reactive model. The Effect-based MVU runtime still powers the system internally, but author-facing APIs revolve around declarative JSX primitives and runes. Key pillars:

- 🚀 **High Performance**: Optimized for Bun's runtime characteristics
- ⚡ **TypeScript First**: Full TypeScript support with excellent type safety
- 🎯 **JSX Primitives**: Terminal-oriented intrinsics like `<text>`, `<box>`, `<flex>`, and `<text-input>` (see [docs/specs/jsx-primitives.md](docs/specs/jsx-primitives.md))
- 🔄 **Reactive Runes**: `$state`, `$derived`, and friends for component state
- 🧩 **Modular Packages**: Each capability lives in `packages/<name>` and publishes an `@tuix/<name>` workspace package
- 🛠️ **CLI & Tooling**: Batteries-included CLI framework, process tooling, logger, and testing utilities

## Monorepo Structure

```
├── packages/              # All TUIX packages
│   ├── ansi/             # ANSI utilities and terminal control package
│   ├── cli/              # CLI framework package
│   ├── core/             # Core runtime system package
│   ├── config/           # Configuration management package
│   ├── debug/            # Debugging tools package
│   ├── jsx/              # JSX runtime package
│   ├── jsx-runtime/      # JSX runtime implementation
│   ├── logger/           # Logging framework package
│   ├── process-manager/  # Process management package
│   ├── runtime/          # Runtime system package
│   ├── styling/          # Styling system package
│   ├── terminal/         # Terminal utilities package
│   ├── testing/          # Testing utilities package
│   ├── tuix/             # Main compatibility layer
│   └── ui/               # UI components package
├── bin/                   # CLI entry point
├── docs/                  # Documentation
└── biome.json            # Code formatting/linting
```

## Quick Start

### CLI Usage

```bash
# Show help
bun run bin/index.ts help

# Show version
bun run bin/index.ts --version

# Show information
bun run bin/index.ts info
```

### Programmatic Usage

```tsx
import { jsx } from '@tuix/jsx'
import { $state } from '@tuix/core/update/reactivity/runes'

export function Counter() {
  const count = $state(0)

  return (
    <box gap={1} padding={1} border="rounded">
      <text>Count: {count()}</text>
      <button onClick={() => count.$set(count() + 1)}>Increment</button>
    </box>
  )
}

// Rendering is runtime-specific; see packages/runtime or the CLI adapter for integration examples.
```

## Development

### Prerequisites

- [Bun](https://bun.com) >= 1.0.0

### Setup

```bash
# Install dependencies
bun install

# Run tests
bun run test

# Type checking
bun run typecheck

# Format code
bun run format

# Lint code
bun run lint
```

### Building

Each workspace owns its own build/test scripts. From the repo root you can iterate quickly with Bun's workspaces:

```bash
# Example: build the core package
cd packages/core
bun run build
```

## Package Information

- **Primary Entry Points**: `@tuix/core`, `@tuix/jsx`, `@tuix/ui`
- **Version**: 1.0.0-rc.3
- **License**: MIT
- **Runtime**: Bun

## Documentation

- [Package Documentation](packages/tuix/README.md) - Detailed package information
- [ANSI Documentation](packages/ansi/README.md) - ANSI utilities and terminal control
- [CLI Documentation](packages/cli/README.md) - CLI framework guide
- [Core Documentation](packages/core/README.md) - Core system documentation

## Contributing

Please see the [Contributing Guide](CONTRIBUTING.md) for information on how to contribute to TUIX.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
