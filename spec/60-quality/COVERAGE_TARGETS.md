# Coverage Targets

*Pod F: Quality/Testing/Perf — WS6*  
**Status:** Complete

---

## 1. Purpose

Set quantitative coverage expectations for Definition of Done (DoD) and document measurement commands. Targets are **aspirational package DoD** for v1; **release gate** remains the mandatory command set in RELEASE_GATES.md (tests/typecheck/lint green), not a hard coverage fail by default unless a package opts into enforcement.

---

## 2. Package Definition of Done (Aspirational)

For a package to be marked **Complete** in MODULE_CATALOG:

| Metric | Target |
|--------|--------|
| Lines | **≥ 80%** |
| Functions | **≥ 80%** |
| Statements | **≥ 80%** |
| Branches | **≥ 70%** |

Applies primarily to production `src/**` (exclude generated `dist/**`, fixtures).

---

## 3. Priority Paths (must not be under-tested regardless of global %)

| Path | Rationale |
|------|-----------|
| `packages/core/src/services/capabilities/**` | REQ-TERM-001/004 |
| `packages/core/src/services/graphics/**` | REQ-TERM-002 |
| `packages/core/src/services/live/**` | REQ-PLAT-001 |
| `packages/runtime/src/mvu/runtime/**` | MVU correctness |
| `packages/runtime/src/hooks/**` | REQ-RT-001 |
| `packages/jsx/src/compiler/**` | REQ-JSX-001/002 |
| `packages/reactive/src/runes/**` | REQ-REAC-001/002 |
| `packages/process-manager/src/pty/**` | REQ-TERM-003 |
| `tests/architecture/**` | boundary integrity |

---

## 4. Measurement Commands

Coverage is produced via Bun’s coverage support (repo already has `coverage/` artifacts):

```sh
# Full test run with coverage (Bun)
bun test --coverage

# Architecture only
bun test tests/architecture

# Package-scoped examples
bun test packages/core
bun test packages/runtime
bun test packages/jsx
```

Inspect:
- Terminal summary from `bun test --coverage`
- `coverage/lcov.info` when generated

Optional HTML report tooling may wrap lcov; not required for gate.

---

## 5. Exclusions

Do not count toward denominator when measuring package DoD:
- `**/*.test.ts(x)`
- `**/dist/**`
- pure type-only files with no runtime
- intentional debug playgrounds under `examples/` if marked

---

## 6. Escalation

| Situation | Action |
|-----------|--------|
| Priority path untested | Block feature Complete status |
| Ecosystem package <80% | Keep status Partial; GAP-M-010 |
| Coverage drop on touched files in PR | Prefer adding tests in same PR |

---

## 7. Related

- `TEST_STRATEGY.md`, `RELEASE_GATES.md`, `GAP_REGISTER.md`
