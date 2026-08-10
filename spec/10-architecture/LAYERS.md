# Architecture Layers

## Authoritative stack (dependency flows downward only)

| Layer | Packages | May depend on |
|-------|----------|---------------|
| L0 Foundation | `@tuix/core`, `@tuix/ansi`, `@tuix/input`, `@tuix/platform`, `@tuix/storage` | external (effect, bun, zod) only among peers as needed |
| L1 Runtime | `@tuix/view`, `@tuix/runtime`, `@tuix/reactive` | L0 |
| L2 Authoring | `@tuix/jsx`, `@tuix/ui`, `@tuix/themes` | L0–L1 |
| L3 Ecosystem | process-manager, config, logger, coordination, testing, debug, telemetry, update, docs, bin, app-presets | L0–L2 as documented |

## Rules
1. Lower layers never import higher layers.
2. JSX never renders to the terminal directly — always compile/run through MVU.
3. **I/O ownership (v1):** `@tuix/core` owns service Tags, pure protocol helpers (capabilities/graphics/CPR/DA), **and** physical Live implementations under `packages/core/src/services/live`. `@tuix/platform` is the **public re-export facade** (`LiveServices`, caps, graphics) so apps depend on one package — it does not duplicate Live I/O. See `PACKAGE_BOUNDARIES.md` and `packages/platform/README.md`.
4. Plugins/modules inject via bootstrap `additionalModules`, not runtime package imports of app code.

Enforced by `tests/architecture/dependency-boundaries.test.ts` and `source-import-boundaries.test.ts`.
