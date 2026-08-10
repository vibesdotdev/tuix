# Duplication Register

| Item | Locations | Decision |
|------|-----------|----------|
| TerminalCapabilities schema | schemas.ts + common.ts | Keep both in sync; future single source |
| Live services | core/services/live + platform re-export | Intentional dual surface; platform is public delivery |
| Process spawn | Bun.spawn vs PTY | Complementary (non-TTY vs TTY) |

No unresolved merge blockers for v1.
