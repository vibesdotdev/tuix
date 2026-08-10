# Architecture overview

Tuix is a **Bun-native**, **JSX-primary** terminal UI framework. State and side effects run through an **Effect-powered MVU** loop.

## Layers (dependency flows downward)

| Layer | Packages |
|-------|----------|
| Foundation | `core`, `ansi`, `input`, `platform`, `storage` |
| Runtime | `view`, `runtime`, `reactive` |
| Authoring | `jsx`, `ui`, `themes` |
| Ecosystem | `process-manager`, `config`, `logger`, `coordination`, `testing`, `debug`, `docs`, `bin`, … |

Rules:

1. Lower layers never import higher layers (enforced by `tests/architecture`).
2. JSX never paints the terminal directly — compile/run through MVU.
3. **I/O ownership:** `core` owns Tags, pure capabilities/graphics/CPR/DA, and Live service implementations under `services/live`. `platform` is the public re-export facade for apps.

## Data flow

```
JSX component  →  compileToComponent / toView
       ↓
Model / Update / View (MVU)  ←  RuntimeHooks
       ↓
Renderer + TerminalService (Live layer)
```

Named runes:

- `$state(init, 'name')` / `$states({ name: init })` → model fields  
- `$set` → MVU `{ type: 'set', key, value }` via `bindMvuPush`  
- View phase: `beginViewHydration(model)` so paint matches model  

## Terminal capabilities

`detectCapabilities({ env, probe? })` is pure (unit-tested without a TTY). Live terminal applies `TUIX_PROBE_*` env overrides. DA parse helpers (`parsePrimaryDA`) are available for probe responses. Canonical type: `TerminalCapabilities` from `@tuix/core` schemas.

## PTY

`ProcessManager` with `config.pty` uses the production PTY path (`node-pty` backend, documented in `BUN_CAPABILITY_MATRIX`).

## Quality gates

See `spec/60-quality/RELEASE_GATES.md`: architecture tests, full `bun test`, `typecheck` (delivery load+build), full-tree `lint`.

## Specs

- `spec/10-architecture/` — layers, boundaries  
- `spec/30-runtime/` — MVU, hooks, subscriptions  
- `spec/40-jsx/` — runtime, compiler, primitives  
- `spec/50-terminal/` — caps, graphics, input, renderer  
- `spec/20-catalog/` — modules and features  
