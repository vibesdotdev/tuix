# Tuix visual language

Ship bar for every Tuix surface. Product screens obey this; `@tuix/ui` implements it.

## Tiers

| Tier | Name | Ship? |
| --- | --- | --- |
| 1 | Usable — keyboard, 80×24, resize, no flicker, function works | floor |
| 2 | Crafted — tokens, depth, focus, density, footer matches keys | **ship** |
| 3 | Alive — motion ≤200ms, never steals input, one brand moment | aim |

A `toView` string is supporting evidence. Acceptance is a PNG of a real PTY/xterm ([EVIDENCE.md](./EVIDENCE.md)).

## Depth

Use `theme.depth`, never a one-off hex in a widget.

| Token | Job |
| --- | --- |
| `base` | App ground |
| `surface` | Cards, panels |
| `overlay` | Modal, palette |
| `inset` | Fields, wells |
| `outset` | Raised edges, focus ring |

Contrast steps stay small (about 5–8% luminance). Inset is darker than surface on dark themes, lighter on light. Outset is the opposite.

## Motion

| Kind | Budget | Never |
| --- | --- | --- |
| Selection / resize | 0ms | animate these |
| Focus / load breath | 80–120ms | delay keys |
| Layout / overlay | 160–200ms | full-screen clear |
| Brand mark | ≤200ms after first input, then cancel | loop on every row |

If the user types during a transition, cancel it.

## Brand

`Mark` in `@tuix/ui` is the only flower-of-life → Vibes symbol compositor. Boot or idle only. `frame` is `0` (flower) … `1` (symbol).

## Density

Minimum 80×24. Default laptop ~120×40. Wide ~200×60. Chrome is state, not labels. Footer keys must be real.

## Control group

OpenCode, Crush, lazygit, k9s. If the shot looks like boxed `cat` output, it failed tier 2.
