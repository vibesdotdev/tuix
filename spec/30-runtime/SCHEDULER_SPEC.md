# Scheduler Spec

*Pod C: Runtime/MVU/Effect — WS3*  
**Status:** Complete  
**Impl:** `packages/runtime/src/mvu/runtime/scheduler.ts`

---

## 1. Purpose

Specify frame scheduling, timers, and command execution concurrency for the MVU runtime.

---

## 2. Components

| Scheduler | Role |
|-----------|------|
| FrameScheduler | Drives render ticks at target FPS |
| TimerManager | App/runtime timers → messages |
| CommandScheduler | Runs Cmd Effects with concurrency limits |

---

## 3. FrameScheduler

### REQ-SCH-001

- Configured by `RuntimeConfig.fps` (default 60).
- Interval ≈ `1000/fps` ms using Bun-capable timers.
- On tick: if dirty (or always-render debug mode), execute view/render path.

**AC:**
- AC-SCH-001-A: fps ≤ 0 treated as invalid → fallback default 60.
- AC-SCH-001-B: render work exceeding frame budget does not enqueue unbounded parallel renders (single render fiber).
- AC-SCH-001-C: Aligns with PERFORMANCE_SLO render <16ms target at 60fps (soft SLO).

### REQ-SCH-002: Dirty bit

Model updates set dirty; successful render clears dirty. `exitAfterRender` completes after first clear.

---

## 4. TimerManager

### REQ-SCH-010

- Provides interval/timeout helpers that enqueue `SystemMsg` / user Msg into the runtime queue.
- Timers cleared on shutdown.
- Must not block update fiber.

**AC:** Clearing model-driven timers happens when SubscriptionManager drops related subs (if timers exposed as subs).

---

## 5. CommandScheduler

### REQ-SCH-020

```
schedule(cmd):
  respect maxConcurrentCommands
  optional timeout commandTimeout
  on success: enqueue Msg if non-null
  on failure: onError path
```

**AC:**
- AC-SCH-020-A: Never exceeds `maxConcurrentCommands` in-flight.
- AC-SCH-020-B: Timeout fails the command Effect without hanging shutdown.
- AC-SCH-020-C: `onCommand` hook notified per execution (HOOKS_SPEC).

### REQ-SCH-021: Batching

`Cmd` batches (arrays from update) are each scheduled; order of completion is not guaranteed — apps must treat command results as concurrent.

### REQ-SCH-022: init commands

Initial commands from `init` use the same scheduler as update-produced commands.

---

## 6. Fairness & Priority

### REQ-SCH-030

- User input messages and command results share one queue; no starvation of input under command floods beyond buffer policy.
- Frame ticks are independent of queue (render fiber).

---

## 7. Shutdown

### REQ-SCH-040

On shutdown:
1. Stop accepting new commands.
2. Interrupt in-flight command fibers.
3. Clear timers.
4. Stop frame scheduler.

Terminal restore is Runtime responsibility, not scheduler.

---

## 8. Metrics

When `performanceMonitoring` enabled, expose:
- frames rendered
- avg/max frame time
- commands completed / failed
- queue depth high-water mark

---

## 9. Tests

| REQ | TC |
|-----|-----|
| REQ-SCH-001 | TC-SCH-001 fps tick |
| REQ-SCH-002 | TC-SCH-002 dirty render |
| REQ-SCH-020 | TC-SCH-020 concurrency cap |
| REQ-SCH-020-B | TC-SCH-021 timeout |
| REQ-SCH-040 | TC-SCH-040 shutdown interrupt |

---

## 10. Related

- `RUNTIME_SPEC.md`, `SUBSCRIPTIONS_SPEC.md`, `PERFORMANCE_SLO.md`
