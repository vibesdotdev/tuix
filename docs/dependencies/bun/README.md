# Bun Native APIs

This document outlines the standard practice of using Bun's native APIs over Node.js equivalents within the Tuix framework. Adherence to these standards is mandatory.

## File System

- **Rule**: ALWAYS use `Bun.file()` for file I/O instead of `node:fs`.
- **Reason**: `Bun.file()` is significantly faster and more memory-efficient than Node.js's `fs` module. It also provides a more modern and ergonomic API.

### Examples

**Reading a file:**

```typescript
// Good
const pkg = await Bun.file('package.json').json()

// Bad
import { readFile } from 'node:fs/promises'
const content = await readFile('package.json', 'utf-8')
const pkg = JSON.parse(content)
```

**Checking if a file exists:**

```typescript
// Good
const exists = await Bun.file('README.md').exists()

// Bad
import { access } from 'node:fs/promises'
try {
  await access('README.md')
  // ...
} catch {
  // ...
}
```

## Directory Scanning

- **Rule**: ALWAYS use `Bun.Glob` for directory scanning and file matching.
- **Reason**: `Bun.Glob` is a fast and efficient way to find files that match a pattern, and it avoids the need to recursively walk directories manually.

### Example

```typescript
// Good
const glob = new Bun.Glob('*.{tsx,jsx}')
for await (const file of glob.scan('.')) {
  console.log(file)
}

// Bad
import { readdir } from 'node:fs/promises'
// ... manual recursive implementation
``` 