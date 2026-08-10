# Traceability Matrix

Maps requirements through features, implementation, tests, and documentation.

**Status legend:** Draft · Complete · Verified  
**Rule:** No requirement without feature, implementation path, and test case id.  
**FEAT/SUB IDs must match** `FEATURE_CATALOG.md` / `SUBFEATURE_CATALOG.md`.

---

## Matrix

| REQ ID | Description | FEAT/SUB IDs | Implementation Files | Test Cases | Doc Links | Status |
|--------|-------------|--------------|----------------------|------------|-----------|--------|
| REQ-TERM-001 | Terminal capability detection (env + probe) | FEAT-term-001, SUB-term-005 | packages/core/src/services/capabilities/detect.ts, da.ts, packages/core/src/services/live/terminal.ts | TC-TERM-001 (detect.test.ts incl. DA/probeFromEnv) | spec/50-terminal/TERMINAL_CAPABILITIES_SPEC.md | Verified |
| REQ-TERM-002 | Graphics encode/decode + fallback | FEAT-term-002, SUB-term-001, SUB-term-002, SUB-term-003, SUB-term-004 | packages/core/src/services/graphics/* | TC-TERM-002 (graphics.test.ts) | spec/50-terminal/GRAPHICS_SPEC.md | Complete |
| REQ-TERM-003 | Production PTY path | FEAT-pty-001, SUB-pty-001, SUB-pty-002 | packages/process-manager/src/pty/pty.ts | TC-PTY-001 (pty.test.ts) | spec/10-architecture/BUN_CAPABILITY_MATRIX.md | Complete |
| REQ-TERM-004 | CPR request/parse | FEAT-term-003, SUB-term-006 | packages/core/src/services/capabilities/cpr.ts, live/terminal.ts | TC-TERM-004 (cpr in detect.test.ts) | TERMINAL_CAPABILITIES_SPEC.md | Complete |
| REQ-INPUT-001 | Bracketed paste stream | FEAT-input-001, SUB-input-001 | packages/core/src/services/input/paste.ts, live/input.ts | TC-INPUT-001 (paste.test.ts) | INPUT_SPEC.md | Complete |
| REQ-RT-001 | RuntimeHooks invoked on loop | FEAT-rt-001, SUB-rt-001, SUB-rt-002, SUB-rt-003 | packages/runtime/src/mvu/runtime/core.ts, hooks/* | TC-RT-001 (hooks.test.ts, hooks/integration.test.ts) | HOOKS_SPEC.md | Complete |
| REQ-RT-002 | Error hooks + render circuit break | FEAT-rt-002, SUB-rt-004 | packages/runtime/src/mvu/runtime/core.ts | TC-RT-002 (hooks/integration.test.ts onError) | HOOKS_SPEC.md | Complete |
| REQ-JSX-001 | detectInteractive non-stub | FEAT-jsx-001, SUB-jsx-001 | packages/jsx/src/compiler/jsx-to-component.ts | TC-JSX-001 (jsx-to-component.test.ts) | JSX_COMPILER_SPEC.md | Complete |
| REQ-JSX-002 | extractModel named $state under Bun | FEAT-jsx-001, SUB-jsx-002 | packages/jsx/src/compiler/jsx-to-component.ts, packages/reactive/src/runes/runes.ts | TC-JSX-002 (jsx-to-component.test.ts, runes extraction) | JSX_COMPILER_SPEC.md | Complete |
| REQ-REAC-001 | $derived dependency tracking | FEAT-reac-001, SUB-reac-001, SUB-reac-002 | packages/reactive/src/runes/runes.ts, tracking.ts | TC-REAC-001 (runes.test.ts) | — | Complete |
| REQ-REAC-002 | $bindable + $states public export | FEAT-reac-001 | packages/reactive/src/index.ts | TC-REAC-002 (runes.test.ts) | — | Complete |
| REQ-PLAT-001 | Platform Live services (facade) | FEAT-plat-001, SUB-plat-001 | packages/platform/src/index.ts (re-exports core live) | TC-PLAT-001 (platform/index.test.ts) | PACKAGE_BOUNDARIES.md, platform/README | Verified |
| REQ-JSX-003 | JSX descriptor → View.render pipeline | FEAT-jsx-001, SUB-jsx-001 | packages/jsx/src/compiler/jsx-to-component.ts (toView), packages/jsx/src/jsx-runtime.ts | TC-JSX-VIEW-001 (to-view.test.ts) | DATA_FLOW_RUNTIME_MVU_JSX.md | Complete |
| REQ-TERM-005 | Terminal.writeGraphics encode+write path | FEAT-term-002, SUB-term-004 | packages/core/src/services/live/terminal.ts, graphics/* | TC-TERM-GFX-001 (terminal.graphics.test.ts) | GRAPHICS_SPEC.md | Complete |
| REQ-PTY-002 | ProcessManager config.pty production path | FEAT-pty-001, SUB-pty-002 | packages/process-manager/src/manager.ts | TC-PTY-MGR-001 (manager.pty.test.ts) | BUN_CAPABILITY_MATRIX.md | Complete |

---

## Coverage summary

| Domain | REQ count | Status |
|--------|-----------|--------|
| Terminal | 4 | Complete |
| Input | 1 | Complete |
| Runtime | 2 | Complete |
| JSX | 2 | Complete |
| Reactive | 2 | Complete |
| Platform | 1 | Complete |
| **Total** | **12** | **Complete** |

## Maintenance

1. New REQ → row before merge; FEAT/SUB must exist in catalogs first.
2. Status **Verified** when TC ids green under `bun test`.
3. File moves update Implementation Files in the same PR.
