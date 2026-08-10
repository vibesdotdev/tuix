# Module Catalog

Every package under `packages/*` is cataloged (GASTOWN hard acceptance §8.2).

**Status:** Complete means the package’s public APIs for its stated purpose are implemented and covered by tests.

| MOD ID | Package | Purpose | Status | Notes |
|--------|---------|---------|--------|-------|
| MOD-ansi-001 | ansi | ANSI styling, borders, colors, gradients | Complete | Hex/string colors in render path |
| MOD-app-presets-001 | app-presets | Bootstrap module factory presets | Complete | |
| MOD-bin-001 | bin | CLI entry (`tuix`) | Complete | help / version / dashboard |
| MOD-config-001 | config | Configuration load/store/plugin | Complete | JSON + YAML + TOML + env |
| MOD-coordination-001 | coordination | Choreography, workflows, recovery | Complete | |
| MOD-core-001 | core | Types, services, graphics, capabilities, Live I/O | Complete | Owns Live impls |
| MOD-debug-001 | debug | Debug TUI | Complete | Scopes, events, performance, state tabs |
| MOD-docs-001 | docs | Help explorer + doc generators | Complete | MVU nav |
| MOD-input-001 | input | Focus/mouse/keyboard routing | Complete | |
| MOD-jsx-001 | jsx | JSX runtime + compile bridge | Complete | |
| MOD-logger-001 | logger | Structured logging | Complete | |
| MOD-platform-001 | platform | Public LiveServices / caps / graphics facade | Complete | Re-exports core Live |
| MOD-pm-001 | process-manager | Spawn + interactive PTY + restart | Complete | node-pty backend |
| MOD-reactive-001 | reactive | Runes + MVU `$set` bridge + key handlers | Complete | |
| MOD-runtime-001 | runtime | MVU loop + hooks + bootstrap | Complete | |
| MOD-storage-001 | storage | Memory/FS + `useStorage` plugin | Complete | |
| MOD-telemetry-001 | telemetry | Metrics/collectors/transports | Complete | |
| MOD-testing-001 | testing | Harness, snapshots, e2e PTY harness | Complete | e2eHarness exported |
| MOD-themes-001 | themes | Theme tokens | Complete | |
| MOD-ui-001 | ui | High-level widgets (Help, LargeText, Viewport, …) | Complete | |
| MOD-update-001 | update | Update checkers | Complete | |
| MOD-view-001 | view | Views, layout (row/column reverse + wrap), primitives | Complete | |

**Count:** 22 packages.
