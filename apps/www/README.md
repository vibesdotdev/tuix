# @tuix/www — product site

SvelteKit marketing and documentation site for Tuix v1.

## Develop

From monorepo root:

```bash
bun install
bun run www:dev
```

Or:

```bash
cd apps/www
bun run dev
```

## Build

```bash
bun run www:build
bun run www:preview
```

## Content

- Marketing routes: `/`, `/features`, `/get-started`, `/packages`
- Package reference: `/packages/[slug]` — STE copy in `src/lib/content/ste/packages-*.json`
- Feature reference: `/docs/features`, `/docs/features/[slug]` — `src/lib/content/ste/features.json`
- Guides: `/docs`, `/docs/[slug]` — STE guides in `src/lib/content/ste/guides.json` → `docs.ts`
- Styles: `src/lib/styles/app.css` (terminal-inspired dark theme)
- Code samples: `CodeBlock` + [Shiki](https://shiki.style) for syntax highlighting and copy

Copy follows **ASD-STE100 Simplified Technical English** style: short sentences, active voice, one idea per sentence.

### Doc model

1. **Tutorials** (`/docs/tutorials`) — progressive builds with **JSX / Effect MVU tabs**
2. **Patterns** (`/docs/patterns`) — common CLI/TUI + Tuix-unique paradigms
3. **Guides** — install, architecture, testing
4. **Packages** (`/packages/[slug]`) — purpose + exports
5. **Features** — catalog capabilities
6. **Components** (`/docs/components`) — UI/JSX building blocks
7. **Coverage** (`/docs/coverage`) — honest full / partial / gap map

Note: `@vibesdotdev/kit` is not published. This site uses Shiki for docs-grade highlighting.

Repo guides under `docs/guides/` and catalogs under `spec/20-catalog/` remain the monorepo source of truth.
