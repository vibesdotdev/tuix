# Gap Register

## Open Critical / High / Medium / Low

_None for product v1._

## Resolved Critical / High

| ID | Severity | Gap | Resolution |
|----|----------|-----|------------|
| GAP-001 | Critical | platform version-only stub | LiveServices + graphics/capabilities + writeGraphics |
| GAP-002 | Critical | sixel hard-coded false | detectCapabilities probe/env |
| GAP-003 | Critical | no graphics encode | core/services/graphics + Terminal.writeGraphics |
| GAP-004 | High | CPR always 1,1 | parse + DSR request path |
| GAP-005 | High | pasteEvents empty | bracketed paste stream |
| GAP-006 | High | hooks unused | wired + integration tests |
| GAP-007 | High | compiler stubs | detectInteractive/extractModel + $states |
| GAP-008 | High | no production PTY | ProcessManager config.pty → spawnPty |
| GAP-009 | High | empty mandatory specs | filled under spec/** |
| GAP-010 | High | JSX → View / [object Object] CLI | toView + Fragment/Scope/Command render |
| GAP-011 | High | PTY unused by manager | start() branches on config.pty |

## Resolved Medium / Low (product v1)

| ID | Severity | Gap | Resolution |
|----|----------|-----|------------|
| GAP-M01 | Medium | DA probe | Pure DA parse + env overrides |
| GAP-M02 | Medium | onSubscription payload | Wired on registration |
| GAP-M03 | Medium | Monorepo tsc | typecheck-v1 is mandatory type gate |
| GAP-M04 | Medium | CLI paint + help nav | Fixed + MVU key path |
| GAP-M05 | Medium | Platform ownership | core Live + platform facade |
| GAP-M06 | Medium | Public stubs | Implemented useStorage, YAML/TOML, debug panes, e2e export, UI widgets, forceRedraw, restart |
| GAP-L01 | Low | docs/guides empty | install / quickstart / architecture guides |
| GAP-L02 | Low | TerminalCapabilities schema duplication | Canonical in `types/schemas.ts`; `common.ts` re-exports |
| GAP-L03 | Low | Full-tree Biome | `lint` / `lint:all` = packages+apps+docs+scripts+tests; ignore build artifacts |
