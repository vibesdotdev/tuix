# Feature Catalog

Stable FEAT IDs used by TRACEABILITY_MATRIX (REQ → FEAT/SUB).

| FEAT ID | Feature | Module | Status | Notes |
|---------|---------|--------|--------|-------|
| FEAT-term-001 | Capability detection (env + pure probe helpers) | core/platform | Complete | Env heuristics + DA **parse** + `TUIX_PROBE_*`; live CSI DA send optional (not required for v1 bar) |
| FEAT-term-002 | Graphics encode/decode (sixel/kitty/iterm) | core | Complete | Minimal sixel fidelity; cell fallback when none |
| FEAT-term-003 | CPR cursor position request/parse | core | Complete | |
| FEAT-input-001 | Bracketed paste stream | core | Complete | |
| FEAT-pty-001 | Interactive PTY spawn/write/resize | process-manager | Complete | node-pty interim backend |
| FEAT-rt-001 | RuntimeHooks full wire on MVU loop | runtime | Complete | onSubscription payload is observability-grade (GAP-M02) |
| FEAT-rt-002 | Render/update error recovery + circuit break | runtime | Complete | |
| FEAT-jsx-001 | detectInteractive / extractModel / toView compile bridge | jsx | Complete | Heuristics + named runes + hydration; not AST codegen |
| FEAT-reac-001 | $derived + $bindable + $states + MVU `$set` bridge | reactive | Complete | |
| FEAT-plat-001 | Platform LiveServices public facade | platform | Complete | Re-export only |
