# @tuix/docs

Documentation generation and interactive help system for TUIX applications.

## Features

- **Auto-generate Docs**: Extract documentation from JSX Command and Plugin components
- **Multiple Formats**: Generate Markdown, plain text help, or JSON
- **Interactive Explorer**: Browse commands with keyboard navigation
- **Type-safe**: Full TypeScript support with Effect.ts integration

## Installation

```bash
bun add @tuix/docs
```

## Quick Start

### Extract Documentation

```tsx
import { extractAppDoc } from '@tuix/docs'

const MyApp = () => (
  <Command name="hello" description="Say hello">
    <text>Hello, world!</text>
  </Command>
)

const docs = extractAppDoc(MyApp, 'myapp', '1.0.0')
```

### Generate Markdown

```tsx
import { generateAppMarkdown } from '@tuix/docs'
import { Effect } from 'effect'

const markdown = Effect.runSync(generateAppMarkdown(docs))
console.log(markdown)
```

### Interactive Help Explorer

```tsx
import { HelpExplorer } from '@tuix/docs'

function HelpCommand() {
  const docs = extractAppDoc(MyApp, 'myapp', '1.0.0')
  
  return (
    <HelpExplorer 
      docs={docs} 
      showPlugins={true}
    />
  )
}
```

## Documentation Extraction

### Command Documentation

Extract docs from Command components:

```tsx
import { extractCommandDoc } from '@tuix/docs'

const MyCommand = () => (
  <Command 
    name="deploy"
    description="Deploy the application"
    usage={['deploy <environment>', 'deploy --help']}
    args={[
      { name: 'environment', description: 'Target environment', required: true, choices: ['dev', 'prod'] }
    ]}
    options={[
      { short: '-f', long: '--force', description: 'Force deployment' },
      { long: '--dry-run', description: 'Simulate deployment' }
    ]}
    examples={[
      { description: 'Deploy to production', command: 'deploy prod' },
      { description: 'Dry run', command: 'deploy --dry-run prod' }
    ]}
  >
    {/* command implementation */}
  </Command>
)

const doc = extractCommandDoc(MyCommand)
```

### Plugin Documentation

Extract docs from Plugin components:

```tsx
import { extractPluginDoc } from '@tuix/docs'

const MyPlugin = () => (
  <Plugin name="database" description="Database management">
    <Command name="migrate" description="Run migrations">
      {/* ... */}
    </Command>
    <Command name="seed" description="Seed database">
      {/* ... */}
    </Command>
  </Plugin>
)

const doc = extractPluginDoc(MyPlugin)
```

### App Documentation

Extract docs from entire app:

```tsx
import { extractAppDoc } from '@tuix/docs'

const App = () => (
  <>
    <Command name="start" description="Start server" />
    <Command name="stop" description="Stop server" />
    
    <Plugin name="database">
      <Command name="migrate" description="Run migrations" />
    </Plugin>
  </>
)

const doc = extractAppDoc(App, 'myapp', '1.0.0')
```

## Documentation Generation

### Markdown

Generate full markdown documentation:

```tsx
import { generateAppMarkdown, generateCommandMarkdown, generatePluginMarkdown } from '@tuix/docs'

// Full app docs
const appMarkdown = Effect.runSync(generateAppMarkdown(appDoc))

// Single command
const cmdMarkdown = Effect.runSync(generateCommandMarkdown(commandDoc))

// Single plugin
const pluginMarkdown = Effect.runSync(generatePluginMarkdown(pluginDoc))
```

Example output:

```markdown
# myapp

Version: 1.0.0

## Table of Contents

### Commands
- [start](#start)
- [stop](#stop)

## start

Start the server

### Usage

start [options]

### Options

- **-p, --port**  Port to listen on
  Default: `3000`
```

### Help Text

Generate terminal help text:

```tsx
import { generateAppHelp, generateCommandHelp } from '@tuix/docs'

// App help
const appHelp = Effect.runSync(generateAppHelp(appDoc))

// Command help
const cmdHelp = Effect.runSync(generateCommandHelp(commandDoc))
```

Example output:

```
myapp v1.0.0
A test application

AVAILABLE COMMANDS:
  start  Start the server
  stop   Stop the server

PLUGINS:
  database  Database management (2 commands)

Use "<command> --help" for more information about a command.
```

## Interactive Help Explorer

The `HelpExplorer` component provides an interactive TUI for browsing documentation:

```tsx
import { HelpExplorer } from '@tuix/docs'

function HelpCommand() {
  const docs = extractAppDoc(MyApp, 'myapp', '1.0.0')
  
  return (
    <HelpExplorer 
      docs={docs}
      showPlugins={true}
      initialCommand="start"
    />
  )
}
```

### Keyboard Controls

- **↑/↓ or j/k**: Navigate commands
- **Enter/Space**: View command details
- **Esc/Backspace**: Back to list
- **q**: Quit

## Documentation Types

### CommandDoc

```typescript
interface CommandDoc {
  name: string
  description?: string
  usage?: string[]
  args?: ArgDoc[]
  options?: OptionDoc[]
  related?: string[]
  examples?: ExampleDoc[]
}
```

### ArgDoc

```typescript
interface ArgDoc {
  name: string
  description?: string
  required?: boolean
  default?: string
  choices?: string[]
}
```

### OptionDoc

```typescript
interface OptionDoc {
  short?: string       // e.g., '-v'
  long: string         // e.g., '--verbose'
  description?: string
  takesValue?: boolean
  default?: string
}
```

### ExampleDoc

```typescript
interface ExampleDoc {
  description: string
  command: string
}
```

### PluginDoc

```typescript
interface PluginDoc {
  name: string
  description?: string
  commands: CommandDoc[]
}
```

### AppDoc

```typescript
interface AppDoc {
  name: string
  description?: string
  version?: string
  commands: CommandDoc[]
  plugins: PluginDoc[]
}
```

## Complete Example

```tsx
import { extractAppDoc, generateAppMarkdown, HelpExplorer } from '@tuix/docs'
import { Effect } from 'effect'

// Define app with documentation
const MyApp = () => (
  <>
    <Command 
      name="serve"
      description="Start development server"
      usage={['serve [options]']}
      options={[
        { short: '-p', long: '--port', description: 'Port', default: '3000' },
        { short: '-h', long: '--host', description: 'Host', default: 'localhost' }
      ]}
      examples={[
        { description: 'Start on default port', command: 'serve' },
        { description: 'Custom port', command: 'serve -p 8080' }
      ]}
    >
      {/* implementation */}
    </Command>
    
    <Command name="help" description="Show help">
      <HelpExplorer 
        docs={extractAppDoc(MyApp, 'myapp', '1.0.0')}
        showPlugins={true}
      />
    </Command>
  </>
)

// Generate documentation
const docs = extractAppDoc(MyApp, 'myapp', '1.0.0')
const markdown = Effect.runSync(generateAppMarkdown(docs))

// Save to file
await Bun.write('docs/README.md', markdown)
```

## Effect Integration

All documentation operations use Effect.ts for type-safe error handling:

```tsx
import { Effect } from 'effect'
import { generateAppMarkdown } from '@tuix/docs'

const program = Effect.gen(function* (_) {
  const docs = yield* extractAppDoc(MyApp)
  const markdown = yield* generateAppMarkdown(docs)
  return markdown
})

const result = await Effect.runPromise(program)
```

## API Reference

### Extraction

- `extractCommandDoc(component)` - Extract docs from Command
- `extractPluginDoc(component)` - Extract docs from Plugin
- `extractAppDoc(component, name?, version?)` - Extract docs from app

### Generation

- `generateCommandMarkdown(doc)` - Generate command markdown
- `generatePluginMarkdown(doc)` - Generate plugin markdown
- `generateAppMarkdown(doc)` - Generate app markdown
- `generateCommandHelp(doc)` - Generate command help text
- `generateAppHelp(doc)` - Generate app help text

### Components

- `<HelpExplorer>` - Interactive help browser

## License

MIT
