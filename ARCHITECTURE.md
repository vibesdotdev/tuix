# TUIX Architecture

**Status:** Current (2026-08-17) — describes the checkout as it exists.
`VISION.md` remains the ideal-shape reference; this file explains the system
that actually runs. Historical planning content is retired (git history).

---

## What Tuix is

A Bun-native terminal UI stack in three movements:

1. **MVU core** — an Effect-powered Model/Update/View runtime.
2. **Runes** — Svelte-style `$state`/`$derived`/`$effect` ergonomics that
   bridge into MVU (`$set` → message → hydrate-from-model).
3. **JSX** — svelte-like authoring (`<text>`, `<flex>`, widgets from
   `@tuix/ui`) compiled onto the same View tree the runtime paints.

Nothing bypasses the runtime: JSX descriptors become Views, runes become
model fields, paints go through `RendererService`.

---

## Layer map

Four layers, imports only point downward. Enforced by
`tests/architecture/source-import-boundaries.test.ts` and
`tests/architecture/dependency-boundaries.test.ts`.

| Layer | Packages | Job |
| --- | --- | --- |
| Foundation | `ansi`, `core`, `input`, `platform`, `storage` | Cells, types, services, TTY I/O |
| Runtime | `view`, `runtime`, `reactive` | View tree, MVU loop, runes |
| Authoring | `jsx`, `ui`, `themes` | JSX compile bridge, widgets, tokens |
| Ecosystem | `process-manager`, `config`, `logger`, `coordination`, `update`, `telemetry`, `debug`, `testing`, `docs`, `bin`, `app-presets` | Apps and services around the core |

### Foundation

- **`@tuix/ansi`** — stateless style/cell primitives. `style()`, colors,
  borders, `visualWidth`, and the visual-cell parse/pad/join helpers that
  keep 16-color and truecolor CSI intact through joins and clips.
- **`@tuix/core`** — service contracts and types: `TerminalService`,
  `InputService`, `RendererService`, `StorageService`, `LiveServices`,
  module registry, error taxonomy, MVU types (`Component`, `Cmd`, `Sub`).
- **`@tuix/platform`** — public facade re-exporting `LiveServices`,
  capability detection, and graphics encode helpers. Apps import live
  services from here, not from core.
- **`@tuix/input`** — key/mouse parsing into typed events.

### Runtime

- **`@tuix/view`** — View primitives and layout (`text`, `vstack`,
  `hstack`, `join`, flex sizing). No JSX knowledge.
- **`@tuix/runtime`** — the MVU loop: frame scheduler, command execution,
  subscriptions, `RuntimeHooks`, interactive-mode lifecycle
  (`Interactive.enter/exit`), and paint through `RendererService`
  (cell buffer + cursor positioning, not full-clear dumps).
- **`@tuix/reactive`** — runes and the MVU bridge. Named `$state(0, 'key')`
  survives compile into model fields; `$set` dispatches through
  `bindMvuPush` so the next paint hydrates from the model.

### Authoring

- **`@tuix/jsx`** — factory (`jsx`, `jsxs`, `Fragment`) plus
  `compileToComponent` and `runApp`. `runApp` routes by argv
  (`Command`/`Plugin`/`Fallback` register scopes in the scope manager),
  detects interactivity from the active surface, and runs the compiled
  component through the MVU runtime with `LiveServices` provided.
- **`@tuix/ui`** — the widget kit, one version of each widget, colors only
  through `theme.colors` / `theme.depth` (see
  [docs/VISUAL-LANGUAGE.md](docs/VISUAL-LANGUAGE.md)). Families:
  layout, forms, feedback, display, data, navigation, system.
- **`@tuix/themes`** — token schema (`ThemeColors`, `ThemeTypography`,
  `ThemeSpacing`, `ThemeDepth`) and six built-in themes. Runtime switching
  via `setUITheme()` (global rune) or Effect-scoped `ThemeContext`.

---

## Data flow

```
JSX tree
  └─ runApp: route by argv → compileToComponent (extract named $state)
       └─ MVU loop: init → update(msg) → view(model) → toView
            └─ RendererService paints cell buffer (workbench layer,
               transparent overlay layer) → TTY via LiveServices
```

- **One-shot commands** (`interactive: false`) render once and exit.
- **Interactive surfaces** loop at a configured FPS, hydrating from the
  model each frame; overlays (`Modal`, `CommandPalette`) are overlay-tagged
  views composited over the live workbench.

## Evidence

Visual claims require real-PTY captures at 80×24 and 120×40 — see
[docs/EVIDENCE.md](docs/EVIDENCE.md) and
[docs/evidence/README.md](docs/evidence/README.md). `toView` cell text and
unit tests support a change; they cannot prove it shipped.

## Known gaps

Tracked in `CURRENT.md` (gaps vs vision) and `STATUS.md` (next edge):
`RendererService` clip/dirty-region APIs partially no-op, JSX still carries
a scope/plugin surface shaped more like a CLI router than the ideal folder
layout in `VISION.md`, `Modal.closeOnBackdrop` awaits overlay hit-testing.
