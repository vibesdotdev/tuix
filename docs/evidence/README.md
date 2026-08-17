# PTY evidence

Captured 2026-08-15 from a real PTY running:

```sh
cd apps/demo
bun src/index.ts kit
```

`.bin` is the raw PTY stream (CUP + SGR). `.txt` is that stream
replayed onto a cell grid. `.png` is a screenshot of a live
terminal-web xterm running the same command.

| File | What it shows |
| --- | --- |
| `kit-80x24-idle.{bin,txt}` | Real 80×24 PTY grid: compact sessions + thread |
| `kit-120x40-idle.{bin,txt}` | Real 120×40 PTY grid: sidebar + files |
| `kit-80x24-type.txt` | Composer is `▸ hello` |
| `kit-80x24-idle.png` | Live xterm workbench locked to 80×24 (compact footer) |
| `kit-80x24-tab.png` | Focus fact is `sessions` |
| `kit-80x24-slash.png` | Command palette over the workbench, no leftover well |
| `kit-80x24-help.png` | Keys modal over the workbench, thread still visible |
| `kit-120x40-idle.png` | Live xterm, two columns, full footer |

Captured 2026-08-17 from real 80×24 and 120×40 PTYs (node-pty, raw
stream + decoded grid; swatch colors are truecolor SGR in the `.bin`,
the `.txt` grid drops SGR):

```sh
cd apps/demo && bun src/index.ts widgets   # widget gallery
cd packages/bin && bun src/bin/tuix.ts themes  # theme gallery
```

| File | What it shows |
| --- | --- |
| `widgets-80x24.{bin,txt}` | Widget gallery: Breadcrumbs, Accordion, Kbd, Avatar, Sparkline, Skeleton, Alert at 80×24 |
| `widgets-120x40.{bin,txt}` | Widget gallery at 120×40 incl. Toast row |
| `themes-80x24.{bin,txt}` | Six themes with brand + depth swatches (truecolor in `.bin`) |
| `themes-120x40.{bin,txt}` | Theme gallery at full width |

`themes-preview` (interactive) was driven in a live PTY: pressing `j`
switches the whole screen to the dark palette — title fact, cursor row,
and status bar all repaint through `setUITheme` (verified by decoded
grid; stream not archived).

The kit footer after the 2026-08-17 StatusBar segment refactor was
re-verified against `kit-80x24-idle.txt`: same facts, same separators,
same clip — tone is opt-in and defaults to the dim text used in the
shipped shots. The 2026-08-17 evening captures refresh `kit-*` (now
with per-session Avatars and tone facts) and `widgets-*` (now leading
with Breadcrumbs + Accordion).
