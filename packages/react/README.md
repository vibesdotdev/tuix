# @tuix/react

React host for Tuix. Product trees stay React; layout and paint go through
`@tuix/view` and `@tuix/ansi`. This is the adapter Vibes Studio uses so
screens never import OpenTUI or Tuix JSX directly.

```tsx
import { createRoot, createCliRenderer } from '@tuix/react'

const renderer = await createCliRenderer({ width: 80, height: 24 })
const root = createRoot(renderer)
root.render(<App />)
```

Tests:

```ts
import { testRender } from '@tuix/react/test-utils'

const renderer = await testRender(<App />, { width: 80, height: 24 })
await renderer.renderOnce()
expect(renderer.captureCharFrame()).toContain('Make something real')
```
