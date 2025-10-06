# @tuix/ansi

ANSI tools and utilities for TUIX applications

## Installation

```bash
bun add @tuix/ansi
```

## Overview

This package is part of the **TUIX** framework - a performant TUI framework for Bun with JSX and reactive state management.

The ANSI package provides low-level utilities for terminal control, styling, and drawing operations including:

- **Border System**: Comprehensive box drawing with multiple styles and flexible border control
- **Color Management**: Full color support with RGB, HEX, ANSI, and adaptive color definitions
- **Effects**: Visual effects like gradients, shadows, animations, and text transformations
- **ANSI Utilities**: Core ANSI escape sequence management and terminal control

## Modules

### Border System

[📖 **Full Border Documentation**](./src/border/README.md)

Create beautiful boxes and frames with multiple border styles:

```typescript
import { renderBox, border, BorderSide } from '@tuix/ansi/border';

const box = renderBox({
  width: 20,
  height: 5,
  border: border.rounded,
  content: ['Hello World!', 'Welcome to TUIX'],
  padding: 1
});

console.log(box);
// ╭──────────────────╮
// │ Hello World!     │
// │ Welcome to TUIX  │
// │                  │
// ╰──────────────────╯
```

**Key Features:**
- Multiple border styles (thin, thick, double, rounded, ASCII, dotted, dashed)
- Flexible border side control with bitwise flags
- Box rendering with content, padding, and custom dimensions
- Custom border creation from patterns
- Unicode support with ASCII fallbacks

### Color System

Advanced color management supporting multiple color formats and terminal capabilities.

### Effects System

Visual effects and animations for enhanced terminal user interfaces.
