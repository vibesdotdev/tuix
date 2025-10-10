# @tuix/themes

Theme system and pre-built themes for TUIX applications.

## Features

- **Pre-built Themes**: Dark, Light, Nord, and Dracula themes included
- **Custom Themes**: Easy to create and register custom themes
- **Runtime Switching**: Change themes dynamically at runtime
- **Reactive**: Integrates with TUIX reactive system
- **Type-safe**: Full TypeScript support

## Installation

```bash
bun add @tuix/themes
```

## Quick Start

### Basic Usage

```tsx
import { ThemeProvider, useTheme } from '@tuix/themes'

export default function App() {
  return (
    <ThemeProvider config={{ defaultTheme: 'dark' }}>
      <MyApp />
    </ThemeProvider>
  )
}

function MyApp() {
  const { theme, setThemeByName, themeNames } = useTheme()
  
  return (
    <box>
      <text color={theme().colors.primary}>
        Current theme: {theme().name}
      </text>
      <text color={theme().colors.text}>
        Available: {themeNames().join(', ')}
      </text>
    </box>
  )
}
```

## Pre-built Themes

Four themes are included out of the box:

### Dark Theme
High contrast dark theme with vibrant accents.

```tsx
import { darkTheme } from '@tuix/themes/themes'
```

### Light Theme
Clean light theme optimized for daytime use.

```tsx
import { lightTheme } from '@tuix/themes/themes'
```

### Nord Theme
Arctic, north-bluish color palette based on [Nord](https://www.nordtheme.com/).

```tsx
import { nordTheme } from '@tuix/themes/themes'
```

### Dracula Theme
Dark theme with vibrant colors inspired by [Dracula](https://draculatheme.com/).

```tsx
import { draculaTheme } from '@tuix/themes/themes'
```

## Creating Custom Themes

### Define a Theme

```tsx
import type { Theme } from '@tuix/themes'

const myTheme: Theme = {
  name: 'my-theme',
  description: 'My custom theme',
  colors: {
    primary: '#60a5fa',
    secondary: '#a78bfa',
    accent: '#f472b6',
    muted: '#6b7280',
    background: '#111827',
    backgroundAlt: '#1f2937',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#38bdf8',
    border: '#374151',
    selection: '#1e40af',
    highlight: '#1f2937',
    text: '#f3f4f6',
    textDim: '#9ca3af',
    textBright: '#ffffff',
  },
  typography: {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    borderStyle: 'rounded',
  },
  spacing: {
    padding: 1,
    margin: 1,
    gap: 1,
  },
}
```

### Register Custom Theme

```tsx
import { ThemeProvider } from '@tuix/themes'
import { myTheme } from './my-theme'

export default function App() {
  return (
    <ThemeProvider 
      config={{ 
        customThemes: { 
          'my-theme': myTheme 
        }
      }}
    >
      <MyApp />
    </ThemeProvider>
  )
}
```

## useTheme Hook

The `useTheme` hook provides reactive access to the current theme:

```tsx
import { useTheme } from '@tuix/themes'

function MyComponent() {
  const { theme, setTheme, setThemeByName, themeNames } = useTheme()
  
  // Access current theme
  const currentTheme = theme()
  
  // Change theme by name
  setThemeByName('nord')
  
  // Change theme by object
  setTheme(myCustomTheme)
  
  // Get available theme names
  const available = themeNames()
  
  return (
    <text color={theme().colors.primary}>
      Themed text
    </text>
  )
}
```

## ThemeProvider Component

The `ThemeProvider` wraps your application to provide theme context:

```tsx
import { ThemeProvider } from '@tuix/themes'

export default function App() {
  return (
    <ThemeProvider 
      config={{
        defaultTheme: 'dark',
        customThemes: {
          custom: myCustomTheme
        },
        allowSwitching: true
      }}
    >
      <MyApp />
    </ThemeProvider>
  )
}
```

### ThemeProvider Config

- `defaultTheme` - Default theme name to use (e.g., 'dark', 'light')
- `customThemes` - Object mapping theme names to Theme objects
- `allowSwitching` - Whether to allow runtime theme switching

## Theme Structure

### ThemeColors

All color values are hex strings (e.g., '#60a5fa').

- **Foreground**: `primary`, `secondary`, `accent`, `muted`
- **Background**: `background`, `backgroundAlt`
- **Semantic**: `success`, `warning`, `error`, `info`
- **UI Elements**: `border`, `selection`, `highlight`
- **Text**: `text`, `textDim`, `textBright`

### ThemeTypography

- `bold` - Use bold text
- `italic` - Use italic text
- `underline` - Use underlined text
- `strikethrough` - Use strikethrough text
- `borderStyle` - Border style: 'single' | 'double' | 'rounded' | 'heavy' | 'light'

### ThemeSpacing

- `padding` - Default padding size
- `margin` - Default margin size
- `gap` - Default gap size

## Effect Integration

The theme system uses Effect.ts for type-safe context management:

```tsx
import { Effect } from 'effect'
import { ThemeContext } from '@tuix/themes'

const program = ThemeContext.pipe(
  Effect.flatMap((ctx) => ctx.getCurrent()),
  Effect.map((theme) => {
    console.log('Current theme:', theme.name)
    return theme
  })
)
```

## API Reference

### Types

- `Theme` - Complete theme definition
- `ThemeColors` - Color palette
- `ThemeTypography` - Typography settings
- `ThemeSpacing` - Spacing settings
- `ThemeConfig` - Theme configuration options
- `ThemeError` - Error type for theme operations

### Context

- `ThemeContext` - Effect context for theme management
- `createThemeLayer()` - Create a theme context layer
- `ThemeContextLive` - Default theme context layer

### Components

- `ThemeProvider` - Provides theme context to children
- `withTheme()` - HOC to inject theme into component

### Hooks

- `useTheme()` - Access and update current theme

## License

MIT
