# Performance SLOs

*Pod F: Quality/Testing/Perf — WS6*  
**Status:** Complete

---

## 1. Purpose

Define user-facing performance objectives for Tuix interactive and CLI modes. SLOs guide implementation and tests; hard CI perf gates may start as monitoring-only except where unit budgets are cheap.

---

## 2. Primary SLOs

| ID | Metric | Target | Measurement notes |
|----|--------|--------|-------------------|
| SLO-PERF-001 | **Startup** | **< 100ms** | Process start → first meaningful paint (CLI) or first frame ready (TUI) on reference hardware; exclude network |
| SLO-PERF-002 | **Render** | **< 16ms** | Single frame view+diff+write path for typical screens (≤ 200×50 cells, moderate styling) |
| SLO-PERF-003 | **Input** | **< 50ms** | Key/paste event available to update fiber → model application start (queue latency + parse) |

Reference environment: modern laptop, Bun current stable, local TTY or fake services for automated measurement.

---

## 3. Secondary Budgets

| Area | Budget | Notes |
|------|--------|-------|
| Capability env detect | < 1ms | pure function |
| Capability probes | < 50ms total | timeout + fallback |
| Graphics encode 256×256 RGB | < 20ms | pure TS |
| Command schedule overhead | < 1ms | excluding cmd work |
| Architecture test suite | < 30s | CI comfort |

---

## 4. Runtime Config Alignment

- Default `fps: 60` implies 16.67ms frame budget (matches SLO-PERF-002).
- If render exceeds budget, drop to dirty-only rendering; do not stack render fibers (SCHEDULER_SPEC).
- `performanceMonitoring: true` records frame times for diagnosis.

---

## 5. Measurement Methods

### Automated
- Unit: pure detect/encode benchmarks in tests (optional `bun:test` timing asserts with loose bounds).
- Integration: Runtime with mock TerminalService measuring hook timestamps (`beforeRender`/`afterRender`).

### Manual
- `time bun run packages/bin/...` for CLI startup.
- Debug overlay / metrics for interactive FPS.

---

## 6. Degradation Policy

When terminal is slow or remote:
1. Prefer full-frame less often; increase diff efficiency.
2. Disable heavy graphics automatically if encode dominates (app-level).
3. Never block input fiber on render.

---

## 7. Non-Goals

- Guaranteeing SLO on extremely large scrollback buffers without virtualization.
- Browser DOM performance (Tuix is terminal-first).

---

## 8. Related

- `SCHEDULER_SPEC.md`, `RENDERER_SPEC.md`, `TEST_STRATEGY.md`
- FEAT-RT-004 frame scheduler
