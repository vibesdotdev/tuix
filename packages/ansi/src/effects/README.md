# Effects

Advanced Styling Utilities - Extended styling capabilities for terminal UI applications.

Provides advanced styling effects for terminal UI applications including shadows, glows, patterns, and special text effects. These utilities complement the core styling system with visual enhancements.

## Key Features

- **Shadow effects** (drop shadow, inner shadow)
- **Glow and highlight effects**
- **Pattern generation** (dots, stripes, checkerboard)
- **Complex border styles**
- **Special text effects**

## Available Effects

### Shadow Effects
- `createDropShadow` - Creates a drop shadow effect with configurable offset, blur, color, and opacity
- `createInnerShadow` - Creates an inner shadow effect that darkens the edges of content

### Glow Effects
- `createGlow` - Adds a colored halo effect around text using gradient characters

### Pattern Effects
- `generatePattern` - Generates various patterns (dots, stripes, checkerboard, etc.) for backgrounds or fills
- `applyPattern` - Overlays a pattern on existing content

### Border Effects
- `createStyledBorder` - Creates complex borders with different styles and configurations

### Layer Effects
- `applyLayerEffect` - Simulates layer blending modes for terminal output

### Animation Effects
- `createPulse` - Generates text that appears to pulse by varying intensity
- `createShake` - Randomly offsets characters to create a shaking appearance
- `createTypewriter` - Reveals text progressively like a typewriter
- `createWaveText` - Makes text appear to wave by varying character positions
- `createBounce` - Makes characters appear to bounce by varying vertical position

### Special Text Effects
- `createRainbowText` - Applies rainbow gradient to text
- `createNeonEffect` - Simulates neon lighting with colored glow
- `createMatrixEffect` - Creates a Matrix-style digital rain effect
- `createHologramEffect` - Creates a holographic appearance

## Usage Examples

### Basic Shadow Effect
```typescript
import { createDropShadow } from './effects/shadow'

const content = ["Hello", "World"]
const shadowConfig = {
  offset: { x: 2, y: 1 },
  blur: 0,
  color: Colors.Gray,
  opacity: 0.5
}

const shadowedContent = createDropShadow(content, shadowConfig)
```

### Glow Effect
```typescript
import { createGlow } from './effects/glow'

const content = ["Hello", "World"]
const glowConfig = {
  radius: 2,
  color: Colors.Blue,
  intensity: 0.8
}

const glowingContent = createGlow(content, glowConfig)
```

### Pattern Effect
```typescript
import { generatePattern } from './effects/pattern'

const pattern = generatePattern(10, 5, {
  type: 'checkerboard',
  foreground: Colors.White,
  background: Colors.Black,
  scale: 2
})
```

### Border Effect
```typescript
import { createStyledBorder } from './effects/border'

const content = ["Hello", "World"]
const borderStyle = {
  type: 'solid',
  width: 1,
  color: Colors.Blue
}

const borderedContent = createStyledBorder(content, borderStyle)
```

### Animation Effect
```typescript
import { createPulse } from './effects/pulse'

const pulseStyle = createPulse("Hello", 0.5) // Phase between 0 and 1