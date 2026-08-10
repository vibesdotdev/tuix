# Release Gates

**Policy:** All listed commands MUST exit 0. No manual exceptions.

## Mandatory commands (repo root)

```sh
bun test tests/architecture
bun test
bun run typecheck
bun run lint
```

| Command | Implementation |
|---------|----------------|
| `bun test tests/architecture` | Dependency + source-import boundaries |
| `bun test` | Full suite (includes `tests/catalog-honesty.test.ts`) |
| `bun run typecheck` | `scripts/typecheck-v1.ts`: import-load + `bun build` of delivery entrypoints (Bun-first; full monorepo `tsc` may stack-overflow on Effect tags — optional diagnostic only) |
| `bun run lint` | Biome check on `packages`, `apps`, `docs`, `scripts`, `tests` (same as `lint:all`) |

## CLI product surface

```sh
bun packages/bin/src/bin/tuix.ts --help   # twice, exit 0
bun packages/bin/src/bin/tuix.ts version  # twice, exit 0, no undefined / [object Object]
```

## Guides

`docs/guides/` must contain non-empty install, quickstart, and architecture guides.
