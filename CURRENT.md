# CURRENT STATE (2026-08-15)

Living summary of this checkout versus `VISION.md`. This file is no
longer a generated export catalog.

## Tree

- **Packages:** `@tuix/ansi`, `app-presets`, `bin`, `config`,
  `coordination`, `core`, `debug`, `docs`, `input`, `jsx`, `logger`,
  `platform`, `process-manager`, `reactive`, `runtime`, `storage`,
  `telemetry`, `testing`, `themes`, `ui`, `update`, `view`.
- **Apps:** `apps/demo` (JSX CLI / kit workbench), `apps/www`
  (SvelteKit product site).
- **Authoring:** svelte-like JSX via `@tuix/jsx`. Official tags:
  `<text>`, `<box>`, `<flex>`, `<vstack>`, `<hstack>`, plus widgets
  from `@tuix/ui`. Color and depth through `theme` / `theme.depth`.

## Alignment with vision

| Layer | Vision | This checkout |
| --- | --- | --- |
| `@tuix/ansi` | Stateless style / cells | Visual-cell parse/pad/join; 16-color and truecolor CSI kept |
| `@tuix/view` | Layout, no JSX | `hstack` / `join` pad by visible columns |
| `@tuix/runtime` | MVU loop + renderer | Interactive kit runs here; paint goes through `RendererService` |
| `@tuix/jsx` | JSX → View / MVU | `compileToComponent` + `runApp`; `<text fg>` and flex size work |
| `@tuix/ui` | One version of each widget | KISS kit + StatusBar / CommandPalette / Modal / Mark |
| `@tuix/themes` | Tokens including depth | `theme.depth` on shipped themes |
| React host | Not in vision | Added then removed. Do not bring it back |

## Gaps vs vision

- JSX still has a large scope/plugin surface that is more CLI router
  than MVU compiler. It works; it is not the folder shape in
  `VISION.md`.
- `RendererService` still no-ops some advanced APIs (clip, dirty
  regions). Layer create/paint/composite for overlays is live.
- `ARCHITECTURE.md` is still a 2025 draft. Treat `VISION.md` + this
  file as the current map.

## Evidence

`docs/evidence/` holds raw PTY streams, decoded grids, and live
xterm PNGs of `apps/demo` `kit`. The PNGs are photographs of
terminal-web's xterm, not a span-to-HTML mock. Overlay shots show
the workbench through the compositor. The 80×24 xterm shot is a
locked 80-column grid (compact footer).
