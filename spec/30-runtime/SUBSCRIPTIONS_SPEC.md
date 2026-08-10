# Subscriptions Spec

*Pod C: Runtime/MVU/Effect — WS3*  
**Status:** Complete  
**Impl:** `packages/runtime/src/mvu/runtime/subscriptions.ts`

---

## 1. Purpose

Define how long-lived event sources attach to the MVU loop, how they reconfigure on model change, and how they differ from commands and the runtime input fiber.

---

## 2. Concepts

| Kind | Lifetime | Output |
|------|----------|--------|
| Cmd | one-shot | optional single Msg |
| Sub | until cancelled | stream of Msgs |
| Input fiber | runtime-owned | key/mouse/paste → Msg/system |

Subscriptions are declared by `component.subscriptions?.(model)`.

---

## 3. Contract

### REQ-SUB-001: Sub type

`Sub<Msg>` is an interruptible Effect (or manager-handled descriptor) that enqueues messages into the runtime queue as events arrive.

### REQ-SUB-002: Declaration

```typescript
subscriptions?: (model: Model) => Sub<Msg>[]
```

Called after init and after each successful update that may change subscription set.

### REQ-SUB-003: Diffing

SubscriptionManager compares previous vs next subscription sets and:
- starts new subs
- stops removed subs
- keeps identical subs running (identity strategy: id key or reference — document in types)

**AC:** Removing a sub interrupts its fiber and runs finalizers.

### REQ-SUB-004: Hooks

`onSubscription` invoked when a sub is registered (HOOKS_SPEC).

---

## 4. Built-in / Expected Sources

| Source | Owner | Notes |
|--------|-------|-------|
| Keyboard / mouse / paste | Runtime InputService fiber | Not typically redeclared by apps |
| Intervals | TimerManager or sub helper | Common app pattern |
| Child process stdout | process-manager + sub | Messages into model |
| PTY data | process-manager pty | Same |
| FS watch | Bun watch wrapped in Effect | Optional helper |
| Custom domain streams | app | Must be interruptible |

### REQ-SUB-010

Apps SHOULD NOT open raw stdin themselves when Runtime owns the TTY.

---

## 5. Error Handling

### REQ-SUB-020

- Sub failure → `onError(error, "subscription")`.
- Policy: drop sub and continue unless fatal.
- Do not crash entire Runtime on single sub failure by default.

---

## 6. Concurrency

### REQ-SUB-030

- Many subs may run concurrently.
- Each sub enqueues messages; update fiber remains the sole model mutator.
- Backpressure: if queue bounded, subs should handle enqueue failure (retry/drop strategy documented per helper).

---

## 7. Lifecycle Relative to exitAfterRender

### REQ-SUB-040

For non-interactive CLI (`exitAfterRender: true`):
- `subscriptions` typically `undefined`.
- If present, runtime may still exit after first render without waiting for subs — apps needing long-lived CLI streams must use interactive mode or explicit wait commands.

---

## 8. Testing

| REQ | TC |
|-----|-----|
| REQ-SUB-001 | TC-SUB-001 sub delivers msg |
| REQ-SUB-003 | TC-SUB-003 diff start/stop |
| REQ-SUB-020 | TC-SUB-020 sub error isolation |
| REQ-SUB-040 | TC-SUB-040 cli no hang |

Use fake clocks for interval subs where possible.

---

## 9. Anti-Patterns

1. Sub that calls `update` directly.
2. Sub that writes terminal.
3. Non-interruptible `while(true)` without Effect cancellation points.
4. Duplicating InputService in a sub.

---

## 10. Related

- `RUNTIME_SPEC.md`, `SCHEDULER_SPEC.md`, `MVU_SPEC.md`
- process-manager features FEAT-PM-002/003
