# @tuix/telemetry

Opt-in telemetry and analytics for TUIX applications.

## Features

- 📊 Event tracking
- 🐛 Error capture and reporting
- ⚡ Performance monitoring
- 🔒 Opt-in only (privacy-first)
- 📦 HTTP and file transports
- 🎯 Sampling support
- 📝 Batching and buffering

## Installation

```bash
bun add @tuix/telemetry
```

## Usage

### Basic Setup with HTTP Transport

```tsx
import { Telemetry, createHttpTransport } from '@tuix/telemetry'

const transport = createHttpTransport({
  endpoint: 'https://analytics.example.com',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
  },
})

function App() {
  return (
    <Telemetry
      enabled={true}
      appName="my-app"
      appVersion="1.0.0"
      transport={transport}
      anonymous={false}
      userId="user-123"
      sampleRate={1.0}
      batchSize={100}
    >
      <YourApp />
    </Telemetry>
  )
}
```

### File Transport (for local logging)

```tsx
import { Telemetry, createFileTransport } from '@tuix/telemetry'

const transport = createFileTransport({
  directory: './logs/telemetry',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
})

function App() {
  return (
    <Telemetry
      enabled={true}
      appName="my-app"
      appVersion="1.0.0"
      transport={transport}
    >
      <YourApp />
    </Telemetry>
  )
}
```

### Tracking Events

```tsx
import { useDispatch } from '@tuix/runtime'

function MyComponent() {
  const dispatch = useDispatch()

  const handleClick = () => {
    dispatch({
      _tag: 'TrackEvent',
      event: {
        name: 'button_clicked',
        properties: {
          button_id: 'submit',
          page: 'checkout',
        },
        timestamp: new Date(),
      },
    })
  }

  return <Button onPress={handleClick}>Submit</Button>
}
```

### Tracking Errors

```tsx
dispatch({
  _tag: 'TrackError',
  error: {
    message: 'Failed to load data',
    stack: error.stack,
    context: {
      userId: 'user-123',
      action: 'fetch_data',
    },
    timestamp: new Date(),
  },
})
```

### Performance Monitoring

```tsx
// Start timing
dispatch({ _tag: 'StartTiming', name: 'data_fetch' })

// ... perform operation ...

// End timing
dispatch({
  _tag: 'EndTiming',
  name: 'data_fetch',
  metadata: {
    itemCount: 100,
    cacheHit: false,
  },
})
```

## Programmatic API

```typescript
import { EventCollector, createFileTransport } from '@tuix/telemetry'
import { Effect } from 'effect'

const transport = createFileTransport({ directory: './logs' })

const collector = new EventCollector(
  {
    enabled: true,
    appName: 'my-app',
    appVersion: '1.0.0',
  },
  transport
)

await Effect.runPromise(
  collector.collectEvent({
    name: 'user_login',
    properties: { method: 'oauth' },
    timestamp: new Date(),
  })
)

collector.stop()
```

## Configuration

### TelemetryProps

- `enabled?: boolean` - Enable telemetry (default: false, opt-in only)
- `appName: string` - Application name
- `appVersion: string` - Application version
- `userId?: string` - User identifier
- `anonymous?: boolean` - Anonymous mode (default: false)
- `sampleRate?: number` - Sample rate 0-1 (default: 1.0)
- `batchSize?: number` - Events per batch (default: 100)
- `flushInterval?: number` - Flush interval in ms (default: 30000)
- `transport: TelemetryTransport` - Transport implementation

### HTTP Transport Config

- `endpoint: string` - API endpoint URL
- `headers?: Record<string, string>` - Request headers
- `timeout?: number` - Request timeout in ms (default: 5000)

### File Transport Config

- `directory: string` - Log directory
- `filePattern?: string` - File name pattern (default: 'telemetry-{type}-{date}.ndjson')
- `maxFileSize?: number` - Max file size in bytes (default: 10MB)
- `maxFiles?: number` - Max files to keep (default: 10)

## Privacy & Ethics

This package is designed with privacy in mind:

- **Opt-in only**: Telemetry is disabled by default
- **Anonymous mode**: Track without user identifiers
- **Sampling**: Reduce data collection with sample rates
- **Local storage**: Use file transport for complete control
- **No automatic data**: Only tracks what you explicitly send

Always:
- Get user consent before enabling
- Be transparent about what you collect
- Provide opt-out mechanisms
- Respect user privacy

## License

MIT
