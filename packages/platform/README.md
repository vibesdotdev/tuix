# @tuix/platform

Public delivery surface for Live Effect services (terminal, input, renderer, storage), capability detection, and graphics encode/decode.

## Ownership (v1 honesty)

| Layer | Owns |
|-------|------|
| **@tuix/core** | Service Tags, pure capabilities/graphics/CPR/DA protocol, **physical Live implementations** under `services/live` |
| **@tuix/platform** | **Public app-facing facade**: re-exports Live Layers + pure helpers so apps depend on one package |

Platform does **not** duplicate Live I/O. Apps should import from `@tuix/platform` for LiveServices; tests may provide fakes via the same Tags.

## Exports

- `PLATFORM_VERSION`
- `LiveServices`, `TerminalServiceLive`, `InputServiceLive`, `RendererServiceLive`, `StorageServiceLive`
- Service Tags: `TerminalService`, `InputService`, `RendererService`, `StorageService`
- Capabilities: `detectCapabilities`, `selectGraphicsProtocol`, CPR + DA (`parsePrimaryDA`, `probeFromEnv`, `mergeProbeResults`)
- Graphics: `encodeGraphics` / `decodeGraphics` (sixel, kitty, iterm2)
- `writeGraphicsLive` helper

## Usage

```ts
import { LiveServices } from '@tuix/platform'
import { Effect } from 'effect'

await Effect.runPromise(myProgram.pipe(Effect.provide(LiveServices)))
```

## Capability detection

1. Env heuristics (`TERM`, `COLORTERM`, `TERM_PROGRAM`, …)
2. Optional pure DA parse (`parsePrimaryDA`) when a response buffer is available
3. `TUIX_PROBE_SIXEL|KITTY|ITERM|MOUSE|TRUECOLOR=0|1` overrides (CI / force)

Live startup uses (1)+(3). Full interactive DA round-trip is optional and does not block the pure decision path.
