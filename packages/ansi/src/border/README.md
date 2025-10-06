# Border System

A comprehensive border system for drawing boxes and frames in terminal applications. Provides various border styles, utilities for working with partial borders, and box rendering capabilities.

## Features

- **Multiple Border Styles**: Thin, thick, double, rounded, ASCII, dotted, and dashed borders
- **Flexible Border Sides**: Control which sides of a border to draw using bitwise flags
- **Box Rendering**: Complete box rendering with content, padding, and custom dimensions
- **Custom Patterns**: Create custom borders from pattern strings
- **Unicode Support**: Full support for Unicode box drawing characters with ASCII fallbacks

## Quick Start

```typescript
import { border, borderPresets, renderBox, BorderSide } from '@tuix/ansi/border';

// Simple box with thin borders
const box = renderBox({
  width: 10,
  height: 4,
  border: border.thin,
  content: ['Hello', 'World!']
});
console.log(box);
// ┌────────┐
// │Hello   │
// │World!  │
// └────────┘
```

## Border Styles

### Available Styles

| Style | Description | Example |
|-------|-------------|---------|
| `thin` | Single thin lines | `┌─┐│ │└─┘` |
| `thick` | Single thick lines | `┏━┓┃ ┃┗━┛` |
| `double` | Double lines | `╔═╗║ ║╚═╝` |
| `rounded` | Rounded corners | `╭─╮│ │╰─╯` |
| `ascii` | ASCII compatible | `+-+| |+-+` |
| `dotted` | Dotted style | `···: :···` |
| `dashed` | Dashed lines | `┌╌┐╎ ╎└╌┘` |

### Using Border Styles

```typescript
import { border } from '@tuix/ansi/border';

// Access individual border styles
const thinBorder = border.thin;
const thickBorder = border.thick;
const asciiBorder = border.ascii;
```

## Border Presets

Pre-configured border styles for common use cases:

```typescript
import { borderPresets } from '@tuix/ansi/border';

// Common presets
const box = borderPresets.box;              // Thin borders, all sides
const roundedBox = borderPresets.roundedBox; // Rounded borders, all sides
const heavyBox = borderPresets.heavyBox;     // Thick borders, all sides
const horizontal = borderPresets.horizontal; // Top and bottom only
const vertical = borderPresets.vertical;     // Left and right only
```

## Border Sides

Control which sides of a border to draw using the `BorderSide` enum:

```typescript
import { BorderSide, combineSides, hasSide } from '@tuix/ansi/border';

// Individual sides
BorderSide.Top     // Top border only
BorderSide.Right   // Right border only
BorderSide.Bottom  // Bottom border only
BorderSide.Left    // Left border only
BorderSide.All     // All sides
BorderSide.None    // No borders

// Combine multiple sides
const topAndBottom = BorderSide.Top | BorderSide.Bottom;
const leftAndRight = BorderSide.Left | BorderSide.Right;

// Utility functions
const combined = combineSides(BorderSide.Top, BorderSide.Right);
const hasTop = hasSide(combined, BorderSide.Top); // true
```

## Box Rendering

### Basic Box

```typescript
import { renderBox, border, BorderSide } from '@tuix/ansi/border';

const box = renderBox({
  width: 8,
  height: 4,
  border: border.thin
});
// ┌──────┐
// │      │
// │      │
// └──────┘
```

### Box with Content

```typescript
const contentBox = renderBox({
  width: 12,
  height: 5,
  border: border.rounded,
  content: [
    'Line 1',
    'Line 2',
    'Line 3'
  ]
});
// ╭──────────╮
// │Line 1    │
// │Line 2    │
// │Line 3    │
// ╰──────────╯
```

### Box with Padding

```typescript
const paddedBox = renderBox({
  width: 14,
  height: 4,
  border: border.double,
  content: ['Padded'],
  padding: 2
});
// ╔════════════╗
// ║  Padded    ║
// ║            ║
// ╚════════════╝
```

### Partial Borders

```typescript
// Only top and bottom borders
const horizontal = renderBox({
  width: 10,
  height: 3,
  border: border.thin,
  sides: BorderSide.Top | BorderSide.Bottom
});
// ────────
//         
// ────────
```

## Custom Borders

### From Pattern String

Create custom borders from a pattern string:

```typescript
import { fromPattern } from '@tuix/ansi/border';

// Pattern format: "TL T TR L C R BL B BR"
const customBorder = fromPattern("* - * | + | * - *");
const box = renderBox({
  width: 8,
  height: 3,
  border: customBorder
});
// *------*
// |      |
// *------*
```

### Custom Border Style

```typescript
import { borderStyle, getBorderFromStyle } from '@tuix/ansi/border';

const style = borderStyle('thick', {
  sides: BorderSide.Top | BorderSide.Bottom,
  color: { type: 'ansi', value: 'red' } // Optional color
});

const borderChars = getBorderFromStyle(style);
```

## Utility Functions

### Side Management

```typescript
import { hasSide, combineSides, removeSide } from '@tuix/ansi/border';

// Check if a side is present
const sides = BorderSide.Top | BorderSide.Right;
const hasTop = hasSide(sides, BorderSide.Top); // true

// Combine multiple sides
const combined = combineSides(
  BorderSide.Top,
  BorderSide.Bottom,
  BorderSide.Left
);

// Remove a side
const withoutTop = removeSide(BorderSide.All, BorderSide.Top);
```

### Border Creation

```typescript
import { borderStyle, getBorderFromStyle } from '@tuix/ansi/border';

// Create a border style configuration
const style = borderStyle('rounded', {
  sides: BorderSide.All
});

// Get the actual border characters
const borderChars = getBorderFromStyle(style);
```

## Advanced Usage

### Responsive Boxes

```typescript
function createResponsiveBox(content: string[], maxWidth: number) {
  const longestLine = Math.max(...content.map(line => line.length));
  const width = Math.min(longestLine + 4, maxWidth); // +4 for padding and borders
  
  return renderBox({
    width,
    height: content.length + 2, // +2 for top and bottom borders
    border: border.thin,
    content,
    padding: 1
  });
}
```

### Nested Boxes

```typescript
// Create boxes within boxes by manipulating content
const innerBox = renderBox({
  width: 8,
  height: 3,
  border: border.dotted
}).split('\n');

const outerBox = renderBox({
  width: 14,
  height: 7,
  border: border.double,
  content: [
    '',
    ...innerBox.map(line => `  ${line}  `),
    ''
  ]
});
```

## API Reference

### Types

```typescript
interface Border {
  readonly topLeft: string;
  readonly topRight: string;
  readonly bottomLeft: string;
  readonly bottomRight: string;
  readonly horizontal: string;
  readonly vertical: string;
  readonly cross?: string;
  readonly horizontalDown?: string;
  readonly horizontalUp?: string;
  readonly verticalLeft?: string;
  readonly verticalRight?: string;
}

interface BorderStyle {
  readonly type: 'thin' | 'thick' | 'double' | 'rounded' | 'ascii' | 'dotted';
  readonly sides?: BorderSide;
  readonly color?: Color;
}

interface BoxOptions {
  readonly width: number;
  readonly height: number;
  readonly border: Border;
  readonly sides?: BorderSide;
  readonly content?: string[];
  readonly padding?: number;
}
```

### Functions

- `borderStyle(type, options?)` - Create a border style configuration
- `getBorderFromStyle(style)` - Get border characters from a style
- `hasSide(sides, side)` - Check if a side is included
- `combineSides(...sides)` - Combine multiple border sides
- `removeSide(sides, side)` - Remove a side from border sides
- `fromPattern(pattern)` - Create border from pattern string
- `renderBox(options)` - Render a complete box

## Examples

### Progress Bar with Border

```typescript
function createProgressBar(progress: number, width: number = 20) {
  const filled = Math.floor((progress / 100) * (width - 2));
  const empty = width - 2 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  
  return renderBox({
    width: width + 2,
    height: 3,
    border: border.thin,
    content: [bar]
  });
}

console.log(createProgressBar(65, 20));
```

### Information Panel

```typescript
function createInfoPanel(title: string, items: Record<string, string>) {
  const content = [
    title,
    '─'.repeat(title.length),
    ...Object.entries(items).map(([key, value]) => `${key}: ${value}`)
  ];
  
  const maxWidth = Math.max(...content.map(line => line.length));
  
  return renderBox({
    width: maxWidth + 4,
    height: content.length + 2,
    border: border.double,
    content,
    padding: 1
  });
}
```

This border system provides everything you need to create beautiful terminal interfaces with flexible, customizable borders and boxes.