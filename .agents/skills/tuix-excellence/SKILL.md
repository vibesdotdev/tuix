---
name: tuix-excellence
description: >-
  Build exceptional Tuix terminal UIs with svelte-like JSX, @tuix/ui, and
  @tuix/themes. Use for Tuix apps, kit primitives, themes, motion, brand mark,
  and real-PTY visual proof. Do not use for OpenTUI or React hosts.
---

# Tuix excellence

Load when authoring `@tuix/*` UI or an app that paints through Tuix. Do not load for OpenTUI, `@opentui/*`, or an invented React host.

Law: [docs/VISUAL-LANGUAGE.md](../../../docs/VISUAL-LANGUAGE.md). Proof: [docs/EVIDENCE.md](../../../docs/EVIDENCE.md).

## Do

1. Compose official JSX tags (`<text>`, `<box>`, `<button>`, `<input>`, `<card>`). Widgets live in `@tuix/ui`.
2. Color and depth only through `theme.depth` / `theme.colors`. One version of each widget.
3. `$state` / `bind:value` for local affordances. No parallel render stack.
4. Before claiming done: real PTY/xterm PNG at 80×24 and 120×40. `toView` cannot pass a surface.

## Do not

- Import `@opentui/*` or invent a React adapter.
- Hardcode hex in a widget.
- Animate selection or resize.
- Let motion steal a keypress.
- Restate this file in `CLAUDE.md`.
