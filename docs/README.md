# Tuix Framework Documentation

## Framework Documentation

### Core Documentation
- **[RULES.md](./RULES.md)** - Framework-wide NEVER/ALWAYS rules
- **[STANDARDS.md](./STANDARDS.md)** - Code quality standards
- **[CONVENTIONS.md](./CONVENTIONS.md)** - File naming and organization conventions
- **[DEPENDENCIES.md](./DEPENDENCIES.md)** - Framework dependencies guide
- **[MODULES.md](./MODULES.md)** - Module system overview
- **[PLUGINS.md](./PLUGINS.md)** - Plugin system documentation

### Architecture Documentation
- **[ARCHITECTURE_AND_DATA_FLOWS.md](./ARCHITECTURE_AND_DATA_FLOWS.md)** - Core architecture and data flow patterns
- **[ADVANCED_PATTERNS_AND_INTERNALS.md](./ADVANCED_PATTERNS_AND_INTERNALS.md)** - Advanced architectural patterns and internals

### Guides
- **[AGENTS.md](./AGENTS.md)** - AI agents guide for working with the framework

### Diagrams
- **[diagrams/](./diagrams/)** - Architecture and data flow diagrams
  - **[features/](./diagrams/features/)** - Feature-specific architecture diagrams
  - **[patterns/](./diagrams/patterns/)** - Usage pattern diagrams

## Reports and Status

### Historical Reports (Archived)
These reports document past work and are kept for historical reference:

- **[COMPLIANCE_AUDIT_REPORT.md](./COMPLIANCE_AUDIT_REPORT.md)** - Final compliance audit report (January 2025 - COMPLETED)
- **[DOCUMENTATION_COMPLIANCE_SUMMARY.md](./DOCUMENTATION_COMPLIANCE_SUMMARY.md)** - Documentation compliance verification
- **[BROKEN_ITEMS_REPORT.md](./BROKEN_ITEMS_REPORT.md)** - Historical broken items report
- **[PRIORITY_TODO.md](./PRIORITY_TODO.md)** - Historical priority task list

## Getting Started with Tuix

TUIX is a JSX-first framework: author components with runes and terminal primitives, while the Effect-based runtime handles orchestration under the hood.

### Installation

Install only the packages you need—for example, the core runtime plus JSX primitives:

```bash
bun add @tuix/jsx @tuix/core @tuix/ui
```

### Basic Example

```tsx
import { jsx } from '@tuix/jsx'
import { $state } from '@tuix/core/update/reactivity/runes'

export function Greeting() {
  const name = $state('world')

  return (
    <box padding={1} border="rounded" gap={1}>
      <text>Hello, {name()}!</text>
      <text-input bind:value={name} placeholder="Your name" />
    </box>
  )
}

// See packages/runtime or packages/cli for rendering integrations.
```

## Module Documentation

Each package maintains its own documentation within its directory structure:

```
packages/<package-name>/
├── README.md       # Package overview and usage
├── src/            # Source code
└── tsconfig.json   # Package-specific build configuration
```

### Core Packages

- **[@tuix/core](../packages/core/README.md)** - Core primitives, lifecycle, and runtime.
- **[@tuix/runtime](../packages/runtime/README.md)** - Runtime systems and MVU.
- **[@tuix/jsx](../packages/jsx/README.md)** - Declarative UI development with JSX.
- **[@tuix/styling](../packages/styling/README.md)** - Colors, borders, and themes.
- **[@tuix/ui](../packages/ui/README.md)** - Pre-built UI components.

### CLI and Tooling

- **[@tuix/bin](../packages/bin/README.md)** - The TUIX CLI binary.
- **[@tuix/cli](../packages/cli/README.md)** - CLI framework and command-line tools.
- **[@tuix/config](../packages/config/README.md)** - Configuration management.
- **[@tuix/process-manager](../packages/process-manager/README.md)** - Process lifecycle management.
- **[@tuix/terminal](../packages/terminal/README.md)** - Terminal I/O and ANSI handling.

### Development and Debugging

- **[@tuix/debug](../packages/debug/README.md)** - Debugging and development tools.
- **[@tuix/logger](../packages/logger/README.md)** - Structured logging system.
- **[@tuix/testing](../packages/testing/README.md)** - Testing utilities and harnesses.

## Getting Started

1. Read **[RULES.md](./RULES.md)** first to understand framework constraints
2. Review **[STANDARDS.md](./STANDARDS.md)** for code quality expectations
3. Follow **[CONVENTIONS.md](./CONVENTIONS.md)** for consistent naming and organization
4. Explore **[MODULES.md](./MODULES.md)** to understand the module system
5. Check **[ARCHITECTURE_AND_DATA_FLOWS.md](./ARCHITECTURE_AND_DATA_FLOWS.md)** for architectural patterns

## Documentation Standards

All documentation follows these conventions:

- **UPPERCASE.md** for documentation files (README.md, ISSUES.md, etc.)
- **lowercase** path-based naming for directories
- **PascalCase** for component files
- **camelCase** for store files

See [CONVENTIONS.md](./CONVENTIONS.md) for complete naming guidelines.

## Development

### Testing

```bash
# Run package tests (example: core)
cd packages/core
bun test

# Type check a package
bun run typecheck
```

### Contributing

1. Follow the framework [RULES.md](./RULES.md)
2. Adhere to [STANDARDS.md](./STANDARDS.md) for code quality
3. Use [CONVENTIONS.md](./CONVENTIONS.md) for naming
4. Write comprehensive tests for all new features
5. Update module documentation as needed
