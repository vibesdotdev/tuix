# Install Tuix

## Requirements

- **Bun** 1.1+ (primary runtime)
- macOS, Linux, or Windows (WSL recommended for PTY)

## From monorepo (development)

```bash
git clone https://github.com/tuix/tuix.git
cd tuix
bun install
bun test
bun run typecheck
```

## Use packages in an app

Workspace packages publish as `@tuix/*`. In a Bun app:

```bash
bun add @tuix/platform @tuix/jsx @tuix/runtime @tuix/reactive @tuix/view
```

Or path-link from a monorepo checkout via `workspaces`.

## CLI

```bash
bun run tuix --help
# or
bun packages/bin/src/bin/tuix.ts version
```

Commands: `version`, `help`, `dashboard`.

## Next

- [Quickstart](./quickstart.md) — first JSX app
- [Architecture](./architecture.md) — layers and Effect MVU
