# Test Strategy

*Pod F: Quality/Testing/Perf — WS6*  
**Status:** Complete  
**Runner:** `bun test` only (DEC-001 / Claude.md)

---

## 1. Purpose

Define what we test, where tests live, how they map to requirements, and how architecture boundaries stay enforced.

---

## 2. Test Layers

| Layer | Goal | Location | Tools |
|-------|------|----------|-------|
| Unit | Pure functions, parsers, encode, detect | `packages/*/src/**/*.test.ts` | `bun:test` |
| Component | MVU components with fake services | package tests + `@tuix/testing` | Effect Layers |
| Integration | Runtime loop + input/render fakes | `runtime`, `jsx`, `core` integration tests | bun:test |
| Architecture | Dependency & import rules | `tests/architecture/*` | bun:test |
| Snapshot | View/ANSI output stability | testing package + ui | snapshots |
| Manual / TTY | Probe/graphics on real terminals | documented scripts optional | human |

---

## 3. Principles

1. **Pure first:** capabilities, graphics, input parsers, CPR — no TTY.
2. **Fake Live services** for Runtime tests; never require a developer’s terminal for CI.
3. **Every REQ in TRACEABILITY_MATRIX** maps to ≥1 TC id (implemented or scheduled).
4. **Architecture tests are release-blocking.**
5. **No Jest/Vitest.** Prefer `bun:test` matchers.

---

## 4. Package Expectations

| Package type | Minimum |
|--------------|---------|
| L1 pure modules (ansi, capabilities, graphics) | High unit density |
| runtime | lifecycle, hooks, scheduler, subs |
| jsx compiler | detectInteractive, extractModel, compileToComponent |
| reactive | rune semantics |
| process-manager | spawn + pty adapter with mocks |
| ecosystem | smoke + critical paths |
| apps | optional smoke |

---

## 5. Naming & IDs

- Files: `*.test.ts` / `*.test.tsx` colocated or `__tests__`.
- Test case IDs in comments or describe names: `TC-TERM-001`, etc.
- Prefer `describe('TC-…')` for matrix-linked cases.

---

## 6. Effect Testing Patterns

```typescript
// Provide test layers
Effect.runPromise(
  program.pipe(Effect.provide(TestServicesLayer))
)
```

- Use deterministic clocks where timers involved.
- Interrupt fibers in `afterEach` if leaked.

---

## 7. Architecture Suite

```sh
bun test tests/architecture
```

Covers:
- package.json forbidden deps (`dependency-boundaries.test.ts`)
- source import boundaries (`source-import-boundaries.test.ts`)

---

## 8. CI / Local Parity

Developers and CI run the same release gates (RELEASE_GATES.md). No “CI-only” secret flags for v1.

---

## 9. Flake Policy

- TTY-dependent tests must be opt-in or hermetic.
- Retries are not a substitute for fixing races; use Effect concurrency carefully.
- Time-based tests use fake timers or wide tolerances only when justified.

---

## 10. Related

- `COVERAGE_TARGETS.md`, `PERFORMANCE_SLO.md`, `RELEASE_GATES.md`
- `@tuix/testing` harness
