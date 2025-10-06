# Tuix Framework Modules

## Core Modules

### 🎯 core
**Purpose**: Core runtime services and runes powering JSX-first applications (Effect-based MVU internals remain available when needed)
**Status**: Stable
**Documentation**: [packages/core/README.md](../packages/core/README.md)

Key Features:
- MVU architecture with Effect.ts
- View rendering primitives
- Event bus system
- Type-safe error handling
- Context system for component state
- Keyboard input processing
- Service abstractions (terminal, input, renderer, storage)

Sub-modules:
- **view**: View primitives and layout algorithms (flexbox, grid, spacer)
- **runtime**: MVU runtime and application lifecycle
- **model**: Event bus, scope management, and state handling
- **terminal**: ANSI styling, input handling, and terminal capabilities

### 🖥️ cli
**Purpose**: CLI framework for building command-line applications
**Status**: Stable
**Documentation**: [packages/cli/README.md](../packages/cli/README.md)

Key Features:
- Command routing
- Plugin system
- Configuration management
- Help generation
- Lazy loading

### 🖼️ ui
**Purpose**: Pre-built UI components for terminal applications
**Status**: Stable
**Documentation**: [packages/ui/README.md](../packages/ui/README.md)

Key Features:
- Data components (List, Table, FilterBox)
- Display components (Text, Markdown, LargeText)
- Feedback components (Modal, ProgressBar, Spinner)
- Form components (Button, TextInput, FilePicker)
- Layout components (Box, Flex, ScrollableBox, Viewport)
- Navigation components (Tabs, Help)
- System components (Exit)

### 🔤 jsx
**Purpose**: JSX runtime and terminal primitives for declarative UI development
**Status**: Stable
**Documentation**: [packages/jsx/README.md](../packages/jsx/README.md)
**Reference**: [JSX primitive catalog](docs/specs/jsx-primitives.md)

Key Features:
- JSX transformation
- Component rendering
- Props handling
- Children management
- Dev tools integration

### 🎭 styling
**Purpose**: Styling system with ANSI support
**Status**: Stable
**Documentation**: [packages/styling/README.md](../packages/styling/README.md)

Key Features:
- ANSI color support
- Gradient rendering
- Border styles
- Layout styling
- Performance optimization

### 📦 services
**Purpose**: Core services for terminal interaction
**Status**: Stable
**Documentation**: [packages/runtime/README.md](../packages/runtime/README.md)

Key Features:
- Terminal abstraction
- Input handling
- Renderer service
- Storage service
- Mouse support


### 🔬 testing
**Purpose**: Testing utilities and harnesses
**Status**: Stable
**Documentation**: [packages/testing/README.md](../packages/testing/README.md)

Key Features:
- Test harness
- Mock services
- Visual testing
- E2E utilities
- Component testing

### 🔌 plugins
**Purpose**: Plugin system and built-in plugins
**Status**: Beta
**Documentation**: (coming soon) consolidates under individual package READMEs

Key Features:
- Plugin architecture
- Lifecycle hooks
- Configuration
- Inter-plugin communication
- Hot reloading

### 📋 logger
**Purpose**: Structured logging system
**Status**: Stable
**Documentation**: [packages/logger/README.md](../packages/logger/README.md)

Key Features:
- Multiple transports
- Structured logging
- Log levels
- Performance optimized
- Bun native integration

### ⚙️ process-manager
**Purpose**: Process management and monitoring
**Status**: Stable
**Documentation**: [packages/process-manager/README.md](../packages/process-manager/README.md)

Key Features:
- Process lifecycle management
- Resource monitoring
- Auto-restart
- Log streaming
- Health checks

### 📸 screenshot
**Purpose**: Terminal screenshot capture and rendering
**Status**: Experimental
**Documentation**: [src/screenshot/README.md](src/screenshot/README.md)

Key Features:
- Terminal output capture
- Screenshot rendering
- Export utilities

### 🔍 scope
**Purpose**: Scope management for isolated execution contexts
**Status**: Experimental
**Documentation**: [src/scope/readme.md](src/scope/readme.md)

Key Features:
- Execution isolation
- Resource management
- Context propagation
- Memory boundaries
- Security features

### ⚙️ config
**Purpose**: Configuration management system
**Status**: Stable
**Documentation**: [src/config/readme.md](src/config/readme.md)

Key Features:
- Schema validation
- Environment support
- Type safety
- Live reloading
- Default values

### 🔬 debug
**Purpose**: Debugging tools and development utilities
**Status**: Stable
**Documentation**: [src/debug/README.md](src/debug/README.md)

Key Features:
- Debug toolbar and wrapper components
- Performance monitoring
- Event tracking
- State inspection
- Scope exploration
- Rich debug interface

## Module Relationships

```
┌─────────────────────────────────────────────────────┐
│                    Application                       │
├─────────────────────────────────────────────────────┤
│  JSX Runtime  │  CLI Framework  │  UI Components    │
├─────────────────────────────────────────────────────┤
│  Core (MVU + Effect.ts) │  Styling     │  Services  │
├─────────────────────────────────────────────────────┤
│  Logger       │  Process Mgr    │  Config           │
├─────────────────────────────────────────────────────┤
│  Plugins      │  Scope          │  Testing          │
├─────────────────────────────────────────────────────┤
│  Debug        │  Screenshot     │                   │
└─────────────────────────────────────────────────────┘
```

## Integration Guidelines

### Module Boundaries
- Modules communicate through well-defined interfaces
- No circular dependencies between modules
- Integration code lives in subdirectories

### Common Patterns
```typescript
// Direct usage
import { View } from '@tuix/core'

// Integration usage
import { CliView } from '@tuix/cli/components'

// Plugin usage
import { logger } from '@tuix/plugins/logger'
```

## Module Development

### Creating New Modules
1. Create a new workspace under `packages/<name>/`
2. Add required documentation files (readme.md, rules.md, etc.)
3. Define public API in `index.ts`
4. Implement core functionality
5. Add comprehensive tests
6. Update this file

### Module Standards
- Each module must have complete documentation
- All exports must be typed
- Test coverage minimum 80%
- No external dependencies without justification
- Clear separation of concerns

## Module Status Definitions

- **Stable**: Production-ready, stable API
- **Beta**: Feature-complete, API may change
- **Experimental**: Under development, API will change
- **Planning**: Design phase, not yet implemented
- **Deprecated**: Being phased out, use alternatives

## Quick Start Examples

### CLI Application
```typescript
import { cli } from '@tuix/cli'

cli.command('hello', {
  description: 'Say hello',
  action: () => console.log('Hello, world!')
})

cli.run()
```

### JSX Application
```typescript
import { render } from '@tuix/jsx'
import { Box, Text } from '@tuix/components'

function App() {
  return (
    <Box>
      <Text>Hello, JSX!</Text>
    </Box>
  )
}

render(<App />)
```

### MVU Component
```typescript
import { Component, runApp, Effect, View } from '@tuix/core'

// Define model and messages
type Model = { count: number }
type Msg = { type: 'increment' } | { type: 'decrement' }

// Create component
const counter: Component<Model, Msg> = {
  init: Effect.succeed([{ count: 0 }, []]),
  
  update: (msg, model) => {
    switch (msg.type) {
      case 'increment':
        return Effect.succeed([{ count: model.count + 1 }, []])
      case 'decrement':
        return Effect.succeed([{ count: model.count - 1 }, []])
    }
  },
  
  view: (model) => View.text(`Count: ${model.count}`)
}

// Run the app
await Effect.runPromise(runApp(counter))
```
