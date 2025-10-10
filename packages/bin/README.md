# @tuix/bin - TUIX CLI

The official TUIX command-line interface showcasing the framework's capabilities with modern, clean UI.

## Features

- ✨ **Modern UI** - Clean panels with rounded borders, vibes theme (black, white, green)
- 🎨 **Theme-aware** - All components use the vibes theme automatically
- 📊 **Live Dashboard** - Real-time system metrics with progress bars
- 📚 **Interactive Help** - Browse commands with keyboard navigation
- 🔌 **Plugin Integration** - Config, Logger, Process Manager, Testing, and more
- 🚀 **Fast** - Built with Bun for maximum performance

## Installation

```bash
bun add @tuix/bin
```

Or install globally:

```bash
bun add -g @tuix/bin
```

## Usage

### Welcome Screen

```bash
tuix
```

Shows the welcome screen with quick start guide.

### Version Information

```bash
tuix version
```

Displays version, build info, and system details in a beautiful panel.

### Interactive Help

```bash
tuix help
```

Browse all available commands with keyboard navigation:
- ↑/↓ or j/k: Navigate
- Enter: View details
- Esc/q: Back/Quit

### System Dashboard

```bash
tuix dashboard
```

Live system status with:
- Service health indicators
- CPU and memory usage
- Runtime information
- Auto-updating metrics

### Plugin Commands

All plugin commands are available through the TUIX CLI:

```bash
# Config management
tuix config get <key>
tuix config set <key> <value>
tuix config list

# Logging
tuix logs view
tuix logs clear
tuix logs export

# Process management
tuix pm list
tuix pm start <name>
tuix pm stop <name>
tuix pm restart <name>

# Testing
tuix test
tuix test dashboard
tuix test watch
```

## Architecture

The TUIX CLI dogfoods our own framework to demonstrate best practices:

### Theme Integration

```tsx
<ThemeProvider config={{ defaultTheme: 'vibes' }}>
  <YourApp />
</ThemeProvider>
```

### Modern Components

All commands use the new modern components:

- **Panel** - Main containers with rounded borders
- **Header** - Page headers with title/subtitle
- **Badge** - Status indicators
- **StatusIndicator** - Service health with pulse animation
- **Divider** - Visual separators
- **ProgressBar** - Resource usage meters

### Plugin Composition

```tsx
<ConfigPlugin>
  <LoggerPlugin>
    <ProcessManagerPlugin>
      <TestingPlugin>
        <Command name="..." component={...} />
      </TestingPlugin>
    </ProcessManagerPlugin>
  </LoggerPlugin>
</ConfigPlugin>
```

## Vibes Theme

The TUIX CLI uses the custom "vibes" theme:

- **Background**: Almost black (`#0a0a0a`)
- **Text**: Pure white (`#ffffff`)
- **Primary**: Modern green (`#22c55e`)
- **Borders**: Rounded, subtle dark gray
- **Aesthetic**: Clean, modern, professional

## Development

### Running from Source

```bash
cd packages/bin
bun run src/bin/tuix.ts
```

### Adding Commands

1. Create command component in `src/commands/`
2. Import and add to `src/app.tsx`
3. Follow the existing patterns

Example:

```tsx
// src/commands/mycommand.tsx
import { Panel, Header } from '@tuix/ui'

export function MyCommand(): JSX.Element {
  return (
    <Panel title="My Command" variant="primary" rounded>
      <Header title="Hello!" subtitle="Custom command" />
      <text>Command content here</text>
    </Panel>
  )
}

// src/app.tsx
import { MyCommand } from './commands/mycommand'

<Command 
  name="mycommand"
  description="My custom command"
  component={MyCommand}
/>
```

## Examples

### Version Command

```tsx
<Panel title="TUIX Framework" variant="primary" rounded>
  <Header 
    title="TUIX v1.0.0"
    subtitle="Modern Terminal UI Framework"
    badge={<Badge variant="success" label="Stable" />}
  />
  
  <Divider />
  
  <box flexDirection="column" gap={1}>
    <text>Runtime: Bun {Bun.version}</text>
    <text>Platform: {process.platform}</text>
  </box>
</Panel>
```

### Dashboard Command

```tsx
<StatusIndicator status="active" label="Service" pulse />

<ProgressBar 
  value={75} 
  label="CPU Usage" 
  showPercentage
  variant="success"
/>
```

## Best Practices

1. **Use Theme Variants** - `variant="primary"` instead of hardcoded colors
2. **Round All Borders** - Use `rounded` prop on panels
3. **Consistent Spacing** - Use theme spacing values
4. **Semantic Colors** - Use success/warning/error variants
5. **Responsive Layout** - Use flexbox from @tuix/view

## CLI Structure

```
packages/bin/
├── src/
│   ├── app.tsx           # Main app with plugin composition
│   ├── index.ts          # Public exports
│   ├── bin/
│   │   └── tuix.ts       # CLI entry point
│   └── commands/
│       ├── welcome.tsx   # Welcome screen
│       ├── version.tsx   # Version info
│       ├── help.tsx      # Interactive help
│       └── dashboard.tsx # Status dashboard
├── package.json
├── tsconfig.json
└── README.md
```

## Contributing

The TUIX CLI is the perfect example of framework usage. When adding features:

1. Follow the modern UI patterns
2. Use theme-aware components
3. Maintain clean, readable code
4. Add comprehensive documentation

## License

MIT

---

**Built with TUIX** - Showcasing the power of modern terminal UIs ✨
