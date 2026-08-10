# Tuix Dependency Guidelines

This document defines practical dependency rules for the monorepo.

## Runtime / Tooling Baseline

- **Runtime:** Bun
- **Language:** TypeScript
- **Effects/DI:** `effect`
- **Validation:** `zod` and `@effect/schema` (prefer one per module boundary)

## Dependency Direction (important)

Use a one-way flow:

`foundation -> runtime -> authoring -> ecosystem`

- Foundation packages (`core`, `ansi`, `input`, `storage`, `platform`) must not depend on higher layers.
- Runtime packages (`view`, `runtime`, `reactive`) must not depend on ecosystem packages (`bin`, `config`, `process-manager`, etc.).
- Authoring packages (`jsx`, `ui`, `themes`) may depend on runtime/foundation, not on CLI app packages.

## Bun-first Rules

- Use `bun test` for tests
- Use `bun run <script>` for scripts
- Prefer Bun APIs (`Bun.file`, `Bun.serve`) over Node-specific alternatives where appropriate

## Adding a new dependency

Before adding:
1. Is this available in Bun/runtime already?
2. Can this live in one package instead of many?
3. Does it violate layer direction?
4. Is the dependency required at runtime, or only dev/test time?

If yes to (3), redesign before merging.

## Enforcement

Boundary checks live in:
- `tests/architecture/dependency-boundaries.test.ts`
- `tests/architecture/source-import-boundaries.test.ts`
