# Tuix Priorities (2026-02)

This document translates `VISION.md` into an execution order, highlights gaps in the current workspace, and proposes naming/organization updates.

## Progress Update (2026-02-06)

- Runtime bootstrap decoupled from app/plugin packages.
- `@tuix/runtime` now accepts injected modules via `additionalModules` instead of importing high-layer packages directly.
- Runtime package dependencies trimmed to runtime-layer needs.
- Added runtime boundary tests (`bootstrap` injection behavior + forbidden dependency guard).
- Added `@tuix/app-presets` package to host high-layer module presets outside runtime.
- Added repo architecture boundary tests for `core` and `runtime` package dependencies.
- Added source-level import boundary tests to prevent forbidden cross-layer imports in `core`, `view`, `runtime`, `reactive`, and `jsx`.
- Migrated event bus contracts into `@tuix/core/events` so foundation packages no longer import from reactive.
- Removed `view -> reactive`, `core -> reactive/view`, `reactive -> jsx`, and `jsx -> config/debug` source coupling.

## 1) Priority Order by Package (build in this order)

### P0 — Must be correct first (runtime foundation)
1. **@tuix/core**
2. **@tuix/view**
3. **@tuix/runtime**
4. **@tuix/reactive**
5. **@tuix/jsx**

Why: all higher-level packages depend on these contracts.

### P1 — Product surface
6. **@tuix/ui**
7. **@tuix/themes**
8. **@tuix/input**
9. **@tuix/platform**

Why: this is what app developers feel immediately.

### P2 — Essential ecosystem
10. **@tuix/testing**
11. **@tuix/logger**
12. **@tuix/config**
13. **@tuix/storage**

Why: quality, observability, and production operability.

### P3 — Optional/advanced layers
14. **@tuix/process-manager**
15. **@tuix/coordination**
16. **@tuix/update**
17. **@tuix/telemetry**
18. **@tuix/debug**
19. **@tuix/docs**
20. **@tuix/bin**

Why: valuable, but should not shape core architecture.

---

## 2) Top Gaps vs Vision

## A. Layering drift and circular dependencies
Current dependency directions violate the target architecture in `VISION.md`:

- `@tuix/core` depends on `@tuix/runtime` and `@tuix/reactive` (should be lower layer than both)
- `@tuix/runtime` depends on top-level packages (`@tuix/bin`, `@tuix/config`, `@tuix/process-manager`, etc.)
- `@tuix/reactive` and `@tuix/jsx` are mutually coupled
- `@tuix/view` depends on `@tuix/reactive` (view should remain rendering-focused)

### B. Documentation drift
- Root `README.md` and docs still reference packages/paths that do not exist (`cli`, `terminal`, `styling`, `packages/tuix`, etc.)
- Module docs describe old architecture and stale integration examples

### C. Platform package (v1 status)
- `@tuix/platform` is a **public re-export facade** over core Live Layers + pure caps/graphics (not a placeholder). Physical Live impls remain under `packages/core/src/services/live`; apps import from `@tuix/platform`.

### D. Test strategy inconsistency
- Some packages have good coverage, but there are uneven contract tests across package boundaries
- No explicit architecture conformance tests (public API boundaries, layering checks, dependency direction checks)

---

## 3) Package Naming + Organization Recommendations

## Keep current names (good)
- `@tuix/core`, `@tuix/runtime`, `@tuix/reactive`, `@tuix/jsx`, `@tuix/ui`, `@tuix/view`, `@tuix/testing`

## Rename candidates (clarity)
- `@tuix/bin` → **`@tuix/cli`** (if this is the executable-facing package)
- `@tuix/docs` → **`@tuix/help`** (if runtime help UI) or move out of publishable packages into `/docs`
- `@tuix/coordination` → **`@tuix/workflows`** (if primarily orchestration)

## Org cleanup
- Keep publishable runtime code in `packages/*`
- Keep documentation-only content in `/docs` (not as runtime package unless needed)
- Move bootstrap presets out of core runtime package (e.g., `@tuix/app-presets`) to prevent layer inversion

---

## 4) Immediate Elimination Plan (next 3 iterations)

### Iteration 1 (stabilize contracts)
- Freeze API surface for `core/view/runtime/reactive/jsx`
- Remove high-level package imports from `@tuix/runtime`
- Make `@tuix/platform` deliver real services (terminal/input/renderer/storage adapters)
- Update root docs to match actual repo

### Iteration 2 (boundary enforcement)
- Add architecture tests:
  - dependency direction checks
  - forbidden import checks (e.g., core cannot import runtime/jsx/ui)
  - public API contract snapshot tests
- Add per-package README “depends on / used by / owns” sections

### Iteration 3 (package polish)
- Rename/alias packages where needed (`bin`/`cli`, `docs`)
- Consolidate bootstrap into app preset package
- Standardize test matrix (unit + contract + integration + perf)

---

## 5) Definition of Done for each package

Each package should have:
1. Clear boundary statement in README
2. Public API exports only from `src/index.ts`
3. Unit tests + contract tests
4. No forbidden cross-layer imports
5. Changelog notes for breaking changes
