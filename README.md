# TUIX Monorepo

A Bun-native TUI framework for building terminal apps with JSX, reactive runes, and an Effect-powered runtime.

## Overview

TUIX combines:

- **MVU runtime core** (`@tuix/runtime`)
- **Reactive runes** (`@tuix/reactive`)
- **JSX primitives and app API** (`@tuix/jsx`)
- **Composable UI components** (`@tuix/ui`)

Authoritative architecture references:
- [VISION.md](./VISION.md) — target architecture
- [CURRENT.md](./CURRENT.md) — current inventory
- [ARCHITECTURE.md](./ARCHITECTURE.md) — design rationale
- [docs/PRIORITIES.md](./docs/PRIORITIES.md) — implementation order and gap plan

## Workspace Structure

```text
packages/
  ansi/              # styling primitives
  app-presets/       # app/plugin module factory presets for runtime bootstrap
  core/              # core types, module contracts, services
  view/              # render/layout primitives
  runtime/           # MVU runtime loop + hooks
  reactive/          # runes and reactive integration
  jsx/               # JSX factory/runtime bridge
  ui/                # high-level components
  input/             # terminal input parsing
  platform/          # public LiveServices facade (re-exports core live + caps/graphics; see packages/platform/README)
  storage/           # storage abstractions
  testing/           # testing harness and utilities
  themes/            # theme definitions
  logger/            # logging services
  config/            # config plugin/services
  process-manager/   # process supervision
  coordination/      # orchestration utilities
  update/            # update checker
  telemetry/         # telemetry tooling
  debug/             # debug tooling
  docs/              # runtime docs/help package
  bin/               # tuix CLI binary package
apps/
  demo/              # showcase/demo app(s)
  www/               # SvelteKit product marketing + docs site
docs/
  guides/            # install, quickstart, architecture
  *.md               # architecture, conventions, standards
```

## Development

```bash
# install deps
bun install

# run all tests
bun test

# typecheck (delivery: load + bun build — not full monorepo tsc; see RELEASE_GATES)
bun run typecheck

# lint (packages, apps, docs, scripts, tests — same as lint:all)
bun run lint
bun run lint:all
bun run format

# product site (SvelteKit)
bun run www:dev
bun run www:build
```

## Packages

All 22 packages under `packages/*` are **Complete** for v1 (see `spec/20-catalog/MODULE_CATALOG.md`). Catalog completeness is enforced by `tests/catalog-honesty.test.ts`.

## Package Priority

If you're deciding where to invest effort first, follow:

1. `@tuix/core` → `@tuix/view` → `@tuix/runtime`
2. `@tuix/reactive` → `@tuix/jsx`
3. `@tuix/ui` + `@tuix/themes`
4. ecosystem packages (`config`, `logger`, `testing`, etc.)

Detailed plan: [docs/PRIORITIES.md](./docs/PRIORITIES.md). Specs: [spec/](./spec/).

## License

MIT
