# @tuix/update

Update checker and notification system for TUIX applications.

## Features

- 🔍 Multiple update sources: NPM, GitHub Releases, Custom URL
- 📦 Automatic caching to reduce API calls
- 🎨 Customizable notification banner
- ⚡ Opt-in auto-check on startup
- 🔔 Breaking change detection

## Installation

```bash
bun add @tuix/update
```

## Usage

### NPM Registry

```tsx
import { Updater } from '@tuix/update'

function App() {
  return (
    <Updater
      packageName="@tuix/core"
      currentVersion="1.0.0"
      autoCheck={true}
      showBanner={true}
      bannerPosition="top"
    >
      <YourApp />
    </Updater>
  )
}
```

### GitHub Releases

```tsx
import { Updater } from '@tuix/update'

function App() {
  return (
    <Updater
      githubRepo="owner/repo"
      currentVersion="1.0.0"
      autoCheck={true}
    >
      <YourApp />
    </Updater>
  )
}
```

### Custom URL

```tsx
import { Updater } from '@tuix/update'

function App() {
  return (
    <Updater
      customUrl="https://example.com/version.json"
      currentVersion="1.0.0"
      autoCheck={true}
    >
      <YourApp />
    </Updater>
  )
}
```

Expected JSON format for custom URL:

```json
{
  "version": "1.2.0",
  "releaseNotesUrl": "https://example.com/releases/1.2.0",
  "publishedAt": "2025-01-15T10:00:00Z"
}
```

## Programmatic API

```typescript
import { createNpmChecker } from '@tuix/update'
import { Effect } from 'effect'

const checker = createNpmChecker({
  packageName: '@tuix/core',
  currentVersion: '1.0.0',
  cacheDuration: 3600000, // 1 hour
})

const result = await Effect.runPromise(checker.check())

if (result.version.updateAvailable) {
  console.log(`Update available: ${result.version.latest}`)
  if (result.version.isBreaking) {
    console.log('⚠️  This is a breaking change!')
  }
}
```

## Configuration

### UpdaterProps

- `packageName?: string` - NPM package name
- `githubRepo?: string` - GitHub repository (owner/repo)
- `customUrl?: string` - Custom update URL
- `currentVersion: string` - Current application version
- `checkInterval?: number` - Check interval in ms (default: 1 hour)
- `cacheDuration?: number` - Cache duration in ms (default: 1 hour)
- `showBanner?: boolean` - Show notification banner (default: true)
- `bannerPosition?: 'top' | 'bottom'` - Banner position (default: 'top')
- `autoCheck?: boolean` - Auto-check on startup (default: true)
- `dismissDuration?: number` - Auto-dismiss duration in ms (default: 0 = never)

## License

MIT
