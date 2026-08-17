# CURRENT STATE (2026-08-17)

Living summary of this checkout versus `VISION.md`. This file is no
longer a generated export catalog.

## Tree

- **Packages:** `@tuix/ansi`, `app-presets`, `bin`, `config`,
  `coordination`, `core`, `debug`, `docs`, `input`, `jsx`, `logger`,
  `platform`, `process-manager`, `reactive`, `runtime`, `storage`,
  `telemetry`, `testing`, `themes`, `ui`, `update`, `view`.
- **Apps:** `apps/demo` (JSX CLI / kit workbench / widget gallery),
  `apps/www` (SvelteKit product site).
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
| `@tuix/ui` | One version of each widget | KISS kit + StatusBar / CommandPalette / Modal / Mark; new widgets: Kbd, Avatar, Sparkline, Skeleton, Alert |
| `@tuix/themes` | Tokens including depth | Six themes on one unified color schema (vibes, dark, light, nord, dracula, gruvbox); `theme.depth` everywhere |
| React host | Not in vision | Added then removed. Do not bring it back |

## Gaps vs vision

- JSX still has a large scope/plugin surface that is more CLI router
  than MVU compiler. It works; it is not the folder shape in
  `VISION.md`.
- `RendererService` still no-ops some advanced APIs (clip, dirty
  regions). Layer create/paint/composite for overlays is live.
- `Modal.closeOnBackdrop` is declared but not wired — backdrop
  dismissal needs overlay hit-testing first.
- ~~`Form` still stubs child collection~~ (fixed 2026-08-17: declared
  fields contract with `collectFormData` / `validateFormFields`).
- ~~`ARCHITECTURE.md` is still a 2025 draft~~ (rewritten 2026-08-17 as a
  current-state layer map). Treat `VISION.md` + this file as the map.

## 2026-08-17 additions

- Themes: legacy color schema (`background/text/accent/muted/error`)
  unified into `ThemeColors` (`bg/fg/tertiary/textDim/danger`);
  `gruvbox` added; `require()` removed from ThemeProvider/context;
  `useTheme` falls back to a real theme.
- Widgets: `Kbd`, `Avatar`, `Sparkline`, `Skeleton`, `Alert` shipped;
  `Toast` re-tokenized through theme colors with `duration`
  auto-dismiss; `Select.searchable`, `Button.size`,
  `numberInput`/`emailInput` now implement their contracts;
  `StatusBar` facts honor `tone`.
- Runtime theme switching: `setUITheme` / `resetUITheme` in
  `@tuix/ui`; CLI gained `tuix themes`.
- Docs: `docs/guides/theming.md`, honest quickstart (`runApp` routes by
  argv; use `Fallback`), README quickstart, bin README no longer lists
  unregistered plugin commands.
- Site: OG/Twitter meta + canonical, sitemap.xml + robots, branded
  404, theming guide page, real PTY screenshots on the homepage,
  single-source version string, GitHub URLs corrected.

## 2026-08-17 night additions

Correctness (all regression-tested):
- `ConfigStorage` fixed: every method misused `Ref.get` as a value (8
  crashers); `loadFromFile`/`saveToFile`/`clear`/`watchConfig` now real.
  `watchConfig` honors its Effect-of-Effect contract with mtime checks.
- `ModuleBase.getState()` added — `registry.getStats()` called a
  nonexistent method and threw.
- X10 mouse decode: +32 bias was never subtracted (coords off by 32)
  and `(info & (0x03 === 3))` precedence bug made every press a
  "release".
- ANSI key table no longer re-sorted per keystroke.
- `compiler/runApp` called `scopeManager.resolveScopePaths?.()` — the
  method is `fixScopePaths`; the optional call silently never ran.
- `getCursorPosition` no longer leaves the terminal stuck in raw mode.
- `MasterDetailPattern`/`DataFlowPattern` (view coordination) crashed on
  a missing eventBus; the bus now rides on the coordination record and
  DataFlow actually propagates to the next participant.
- telemetry perf flush: requeue on failure now goes through the typed
  failure channel instead of `throw` inside `Effect.sync` (a die).

Renderer honesty (core `RendererServiceLive`):
- Dirty regions real: markDirty/getDirtyRegions/optimize (rect union
  merge)/clear.
- `renderAt` respects x/y and the clip rect (content clipped to region).
- `renderBatch` paints all views into one frame instead of destructively
  rendering only the last.
- `wrapText` honors width escape-aware (reuses the ansi wrap);
  `truncateText` is visual-width-aware; `measureText` counts lines;
  frame-time stats actually update; layer ids monotonic; `removeLayer`
  protects `main`.

New widgets: `Slider` (track/quantize/keyboard) and `Menu`
(cursor/separators/hints, overlay-friendly). Widget gallery updated.

Testing: PTY e2e harness gained a VT100 screen emulator
(`decodeScreen`) with `waitForScreenText`/`getScreen`/`getScreenLine`,
`sendText`, and `resize` — assertions now target the decoded grid, not
the escape stream. (Live PTY drives run via the node evidence script;
node-pty inside `bun test` segfaults on this machine.)

Docs: install.md clone URL fixed; RULES.md de-Cinderlinked and status
workflow corrected; STANDARDS.md references exist; PLUGINS.md rewritten
around the real Command/Plugin/Fallback tags.

Site: theming tutorial (10th); Slider + Menu catalog entries (50
components); EditLink on all doc/package/tutorial/pattern/component/
feature pages; 120 prerendered pages.

## 2026-08-17 evening additions

- Escape-aware line wrap in `@tuix/ansi` (`renderStyled`): escapes are
  zero-width tokens, never split across rows, SGR state re-emitted on
  continuations. Kills the literal-`1m` leak class.
- `Form` real contract: declared `fields` (live getters + rules) with
  `collectFormData` / `validateFormFields`; ctrl/meta+enter submits.
- `CommandPalette` + `Select`: built-in ↑/↓/j/k cursor, Enter picks,
  Esc closes (`Select.onClose` added).
- `ToastViewport` + `createToastStore`: queued stack, maxVisible,
  timed auto-dismiss.
- New widgets: `Accordion` (folded sections + cursor),
  `Breadcrumbs` (dim ancestors / bright leaf), `Tooltip` v2 (placement
  + duration + theme tokens). `Avatar` gained deterministic per-name
  accent (`avatarAccent`).
- `Spinner`/`LoadingOverlay` de-webbed (no `fontSize`, no CSS
  `position`/`rgba` — overlay tag + depth tokens). `Exit` defers
  process exit past the render walk.
- `tuix themes-preview` (interactive): ↑/↓ repaints the live theme
  through `setUITheme`; proven in a driven PTY.
- CLI version single-sourced from `package.json` (`VERSION`).
- Kit dogfoods new widgets: Avatars per session, tone facts, KbdHint
  rows in the help modal. Demo: dead `hello.tsx` removed,
  `ai-chat-clean` wired as a command.
- `ARCHITECTURE.md` rewritten as a current-state layer map (2025 draft
  retired).
- Site: all 11 `docs:'none'` component pages now carry examples; 8 new
  widget catalog entries; `/search` page (client-side index over every
  guide/tutorial/package/pattern/component/feature); fonts self-hosted
  (no Google Fonts request); full static prerender (117 HTML pages).

## Evidence

`docs/evidence/` holds raw PTY streams, decoded grids, and live
xterm PNGs of `apps/demo` `kit`. The PNGs are photographs of
terminal-web's xterm, not a span-to-HTML mock. Overlay shots show
the workbench through the compositor. The 80×24 xterm shot is a
locked 80-column grid (compact footer).
