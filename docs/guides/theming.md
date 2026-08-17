# Theming guide

How color, depth, and typography work in Tuix, and how to switch them at runtime.

## The rules

1. Widgets never hardcode hex. Color and background come from `theme.colors`; layered
   surfaces come from `theme.depth`.
2. One version of each widget exists; themes change it, forks do not.
3. Depth steps are 5–8% luminance apart. Dark themes inset darker than surface, outset
   lighter; light themes invert. See [VISUAL-LANGUAGE.md](../VISUAL-LANGUAGE.md).

## Built-in themes

`@tuix/themes` ships six themes, all conforming to one `ThemeColors` schema
(`primary/secondary/tertiary`, `bg/fg`, semantic `success/danger/warning/info`,
UI `border/borderSubtle/selection/highlight`, text `textDim/textBright`):

| Theme | Feel |
|-------|------|
| `vibes` | Pure black, white text, green accent (the `@tuix/ui` default) |
| `dark` | High-contrast slate with blue/violet accents |
| `light` | Daytime white with saturated brand colors |
| `nord` | Arctic blue-grey |
| `dracula` | Vibrant purple/dark |
| `gruvbox` | Warm retro groove |

Preview them with `bun packages/bin/src/bin/tuix.ts themes` (`tuix themes` once installed).

## Using themes in widgets

`useUITheme` is the hook widgets use. It reads the global theme rune, so every
consumer re-renders when the theme changes:

```tsx
import { useUITheme } from '@tuix/ui'

function Panel() {
  const { theme, depth, getColor } = useUITheme()
  return (
    <box background={depth.surface} borderColor={theme.colors.border}>
      <text fg={getColor('primary')}>Hello</text>
    </box>
  )
}
```

## Switching the theme at runtime

```tsx
import { setUITheme, resetUITheme } from '@tuix/ui'
import { nordTheme, draculaTheme } from '@tuix/themes'

setUITheme(nordTheme)   // every useUITheme consumer repaints
resetUITheme()          // back to vibes
```

## Effect-scoped theme context

Apps that run an Effect layer can use the `ThemeContext` service instead of the
global rune:

```tsx
import { ThemeProvider, useTheme } from '@tuix/themes'

;<ThemeProvider config={{ defaultTheme: 'dracula' }}>
  <MyApp />
</ThemeProvider>
```

`useTheme()` returns `{ theme, setTheme, setThemeByName, themeNames }`.

## Custom themes

A theme is data. Provide the full color schema, typography, spacing, and a five-step
depth stack:

```ts
import type { Theme } from '@tuix/themes'

export const emberTheme: Theme = {
  name: 'ember',
  description: 'Warm dark theme',
  colors: {
    primary: '#f97316',
    secondary: '#fb923c',
    tertiary: '#fdba74',
    bg: '#1c1917',
    fg: '#fafaf9',
    success: '#4ade80',
    danger: '#f87171',
    warning: '#facc15',
    info: '#60a5fa',
    border: '#44403c',
    borderSubtle: '#292524',
    selection: '#7c2d12',
    highlight: '#292524',
    textDim: '#a8a29e',
    textBright: '#ffffff',
  },
  typography: {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    borderStyle: 'rounded',
  },
  spacing: { padding: 1, margin: 1, gap: 1 },
  depth: {
    base: '#1c1917',
    surface: '#292524',
    overlay: '#44403c',
    inset: '#141210',
    outset: '#57534e',
  },
}
```

Then `setUITheme(emberTheme)`, or register it with the context
(`createThemeLayer(undefined, { ember: emberTheme })`) and select it by name.

### Depth helper

`depthOf(theme)` returns the theme's five-step stack (`base`, `surface`, `overlay`,
`inset`, `outset`). Every shipped theme defines real steps; there is no fallback
luminance computation, so a theme without steps is a type error, not a silent default.

## Status bar tones

`StatusBar` facts accept a `tone` (`muted` by default, plus `default`, `warning`,
`danger`, `success`). The tone maps to `theme.colors.*`, so a failing CI fact stays
red in every theme:

```tsx
<StatusBar
  facts={[
    { slot: 'branch', value: 'main', tone: 'default' },
    { slot: 'ci', value: 'failing', tone: 'danger' },
  ]}
/>
```
