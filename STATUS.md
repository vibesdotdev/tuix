# TUIX Implementation Status

Last updated: 2026-08-15

This file is the living status of the Tuix checkout on `grok/react-adapter`.
It replaces the 2025-10-09 "Phase 6 Complete" note, which described a
different tree and was more than ten months stale.

## What this branch is

Tuix is the internal TUI stack (JSX + MVU + `@tuix/ui`). The revived
OpenTUI-based product TUI is out of scope here.

A short-lived React host (`dfe301b`) was added and then dropped
(`94cbb1b`). Surfaces are authored in svelte-like JSX (`<text>`, `<box>`,
`<flex>`, widgets from `@tuix/ui`). There is no shipped React adapter.

## What works (observed 2026-08-15)

- **Kit workbench** (`bun src/index.ts kit` in `apps/demo`) boots in a
  real PTY. Live xterm PNGs and decoded grids are in `docs/evidence/`.
- **Keys:** Tab changes the focus fact (composer → sessions). `/` opens
  the command palette. `?` opens the keys modal. Typing into the
  composer is on the 80×24 PTY grid (`▸ hello`).
- **Paint path:** `@tuix/runtime` paints through `RendererService`
  (cell buffer + CUP), not a full-clear string dump every frame.
- **Overlay compositing:** Modal and CommandPalette are overlay-tagged
  views. Flex lifts them out of flow. The renderer paints an opaque
  workbench layer and a transparent overlay layer. Command/help sit on
  the live workbench — no leftover grey well. Proven at 80×24 and 120×40.
- **Host-fitted columns:** terminal-web honors `?cols=` / `?rows=` and
  locks the xterm/PTY grid. An 80×24 shot now opens the compact layout
  (`[/] cmd`), not the wide one.
- **Layout owner:** `padVisual` / `parseVisualCells` keep 16-color and
  truecolor CSI when joining and clipping. `<text fg>` and `<flex
  width/height>` reach the view layer.
- **Gates (this checkout):** `bun test` 1193 pass / 0 fail;
  `bun run typecheck` ok; `bun run lint` ok; `bun run build` ok;
  `tuix --help` and `tuix version` twice, no `undefined` /
  `[object Object]`.

## What is not done

- **STATUS.md / CURRENT.md (2025):** the old phase-7 / telemetry plan
  and the generated export dump are retired. `docs/STATUS.md` is still
  an auto-generated tree scan from an older layout — do not treat it as
  current.
- **React adapter:** not a product. Do not revive it.
- **RendererService** still no-ops some advanced APIs (clip, dirty
  regions). The path the runtime actually calls is live.

## Next edge

None named from this close. Overlay compositing and host-fitted columns
are landed.

## How to run the workbench

```sh
cd apps/demo
bun src/index.ts kit
```
