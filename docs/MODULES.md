# Tuix Modules

High-level package map for the monorepo. Authoritative status: `spec/20-catalog/MODULE_CATALOG.md` (all Complete for v1).

## Layered Model

1. **Foundation**: `@tuix/ansi`, `@tuix/core`, `@tuix/input`, `@tuix/platform`, `@tuix/storage`
2. **Runtime**: `@tuix/view`, `@tuix/runtime`, `@tuix/reactive`
3. **Authoring**: `@tuix/jsx`, `@tuix/ui`, `@tuix/themes`
4. **Ecosystem**: `@tuix/app-presets`, `@tuix/config`, `@tuix/logger`, `@tuix/process-manager`, `@tuix/coordination`, `@tuix/update`, `@tuix/telemetry`, `@tuix/debug`, `@tuix/testing`, `@tuix/docs`, `@tuix/bin`

## Package Index

- `@tuix/ansi` — ANSI colors, styles, borders
- `@tuix/app-presets` — module factory presets for bootstrap
- `@tuix/core` — types, errors, module/service contracts, Live I/O, capabilities, graphics
- `@tuix/input` — keyboard/mouse parsing utilities
- `@tuix/platform` — public LiveServices / caps / graphics facade
- `@tuix/storage` — memory/FS backends + `useStorage`
- `@tuix/view` — render/layout primitives (including reverse + wrap)
- `@tuix/runtime` — MVU loop, commands/subscriptions/hooks
- `@tuix/reactive` — runes + MVU `$set` bridge + key handlers
- `@tuix/jsx` — JSX runtime + compile bridge
- `@tuix/ui` — high-level widgets (Help, LargeText, Viewport, forms, …)
- `@tuix/themes` — theme tokens
- `@tuix/testing` — harness, snapshots, e2e PTY harness
- `@tuix/config` — JSON / YAML / TOML / env config
- `@tuix/logger` — structured logging
- `@tuix/process-manager` — process lifecycle + PTY
- `@tuix/coordination` — workflow/event-stream orchestration
- `@tuix/update` — version/update checking
- `@tuix/telemetry` — metrics reporting
- `@tuix/debug` — debug TUI (scopes, events, performance, state)
- `@tuix/docs` — help explorer + doc generators
- `@tuix/bin` — `tuix` CLI

## Guides

See `docs/guides/` for install, quickstart, and architecture.

## Maintenance Rule

When package names or responsibilities change, update this file, `README.md`, and `spec/20-catalog/MODULE_CATALOG.md` in the same PR.
