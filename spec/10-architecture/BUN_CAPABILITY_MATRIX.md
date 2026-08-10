# Bun Capability Matrix

| Capability | Bun API | Tuix choice | Notes |
|------------|---------|-------------|-------|
| Process spawn (non-TTY) | `Bun.spawn` | process-manager default | stdin may be ignore/pipe |
| Interactive PTY | *none first-class* | **node-pty interim** | Documented; production path `packages/process-manager/src/pty/pty.ts` |
| stdout/stdin TTY | process streams | TerminalServiceLive / InputServiceLive | via platform export |
| File I/O | `Bun.file` | StorageServiceLive | |
| Test runner | `bun test` | mandatory | |
| Bundle | `bun build` | package scripts | |
| Graphics protocols | N/A | pure encode in `@tuix/core` graphics | sixel/kitty/iterm |

## Decision (v1)
PTY: ship **node-pty** adapter behind `PtyBackend` interface until Bun exposes stable PTY/ConPTY. Non-interactive IPC remains `Bun.spawn`. Matrix applied in implementation: mock backend for unit tests; node-pty for real TTY.
