# Tuix evidence

A TUI claim is true only against a real terminal.

## Allowed as support

- `toView` / `compileToComponent` cell text
- Theme token tests
- Keyboard unit tests

## Required for acceptance

1. Start the host the user starts (`vibes pm start terminal-web-dev` or `bun src/index.ts <cmd>` in a real PTY).
2. Photograph the live xterm/PTY at 80×24 and 120×40 (and a wide shot when layout is the claim).
3. Drive Tab, Esc, type, and one overlay. Shoot after each.
4. Classify a miss: product, runtime, bridge, or Tuix limit.

## Rejected

Reconstructed span→ANSI/HTML/canvas. `--fast` or forced TTY as the only proof. Cropped shots that hide chrome.

## Commands

```sh
# local host
vibes pm start terminal-web-dev   # http://127.0.0.1:8445
# kit
# /?cmd=bun&arg=src/index.ts&arg=kit&cwd=<tuix>/apps/demo
```
