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
| `kit-80x24-idle.png` | Live xterm workbench (host-fitted cols) |
| `kit-80x24-tab.png` | Focus fact is `sessions` |
| `kit-80x24-slash.png` | Command palette on the live xterm |
| `kit-80x24-help.png` | Keys modal on the live xterm |
| `kit-120x40-idle.png` | Live xterm, two columns, full footer |
