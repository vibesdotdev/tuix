# Runtime Spec

*Pod C: Runtime/MVU/Effect — WS3*  
**Status:** Complete  
**Package:** `@tuix/runtime`  
**Primary impl:** `packages/runtime/src/mvu/runtime/core.ts`

---

## 1. Purpose

Define the authoritative process that executes `Component<Model, Msg>`: lifecycle, configuration, fibers, service requirements, exit modes, and integration with hooks/schedulers/subscriptions.

---

## 2. Scope

**In scope:** Runtime class, runApp factory, RuntimeConfig, RuntimeState, system messages, metrics, error type, interaction with Terminal/Input/Renderer services.  
**Out of scope:** JSX compilation (JSX_COMPILER_SPEC), rune semantics (reactive), graphics encode (GRAPHICS_SPEC).

---

## 3. Types

### REQ-RT-RUN-001: RuntimeConfig

```typescript
interface RuntimeConfig {
  fps?: number                    // default 60
  enableMouse?: boolean           // default false
  fullscreen?: boolean            // default true (alt screen)
  debug?: boolean
  messageBufferSize?: number      // default 1000
  updateTimeout?: Duration
  commandTimeout?: Duration
  maxConcurrentCommands?: number  // default 10
  performanceMonitoring?: boolean
  exitAfterRender?: boolean       // CLI one-shot
  onError?: (error: unknown) => void
  onQuit?: () => void
  context?: unknown
  hooks?: RuntimeHooks<Model, Msg>
}
```

**AC:** Defaults applied in constructor; missing fields never leave Runtime in undefined mode.

### REQ-RT-RUN-002: RuntimeState

Tracks `model`, running flag, metrics counters, dirty bit for render, and subscription bookkeeping as needed by SubscriptionManager.

### REQ-RT-RUN-003: SystemMsg

Discriminated union wrapping user `Msg` plus control messages (e.g. quit, tick, command-result, subscription-event, resize) as implemented in `mvu/runtime/types.ts`.

### REQ-RT-RUN-004: RuntimeError

Typed error for init/update/render/command failures; must be catchable by Effect error channel and `onError` hook.

---

## 4. Lifecycle

### REQ-RT-RUN-010: run(component)

```
acquire services → setup terminal → beforeInit
→ init → afterInit → schedule initial cmds/subs
→ start fibers (input, update, render)
→ await quit → teardown terminal → onShutdown
```

**AC:**
- AC-RUN-010-A: Terminal always restored (cursor, alt screen, mouse) on both success and failure paths.
- AC-RUN-010-B: `init` Effect failures abort before input fiber starts, after safe teardown.
- AC-RUN-010-C: `exitAfterRender` stops after first successful paint without requiring quit key.

### REQ-RT-RUN-011: Fibers

| Fiber | Responsibility |
|-------|----------------|
| input | Read InputService events → enqueue msgs |
| update | Dequeue → hooks → update → cmds → subs |
| render | FrameScheduler ticks → view → RendererService |

Fibers are Effect Fibers; interruption on shutdown is mandatory.

### REQ-RT-RUN-012: runApp factory

`runApp(component, config?)` constructs queue/state/Runtime and provides composition with Live layers at call site. Returns `Effect<void, E | RuntimeError, AppServices>`.

---

## 5. Message Processing

### REQ-RT-RUN-020: Ordering

Single update fiber processes messages sequentially for a given Runtime instance. Commands run concurrently up to `maxConcurrentCommands` and enqueue results.

### REQ-RT-RUN-021: Quit

Quit keys (via KeyUtils) or explicit quit system message trigger shutdown. `onQuit` config callback invoked.

### REQ-RT-RUN-022: Message buffer

Queue capacity `messageBufferSize`; overflow policy: drop oldest control noise only if explicitly configured — default fail-safe is backpressure via bounded queue behavior documented in types.

---

## 6. Service Requirements

Runtime **requires** in environment:
- `TerminalService`
- `InputService`
- `RendererService`

Storage optional unless component Effects demand it.

**AC:** Missing services fail at effect interpretation with clear tag error, not silent no-op.

---

## 7. Hooks Integration (REQ-RT-001)

Runtime MUST invoke hooks when present (see HOOKS_SPEC):
`beforeInit`, `afterInit`, `beforeUpdate`, `afterUpdate`, `beforeRender`, `afterRender`, `onCommand`, `onSubscription`, `onMessage`, `onError`, `onShutdown`.

Hook failures: routed to `onError`; non-fatal hooks should not crash the loop unless configured.

---

## 8. Recovery (REQ-RT-002)

1. Update/command errors → `RuntimeError` + `hooks.onError` + optional `config.onError`.
2. Policy: continue loop if error handled; quit if fatal or unhandled with restore terminal.
3. Multi-step workflow recovery may use `@tuix/coordination` outside the core loop but still deliver outcomes as messages.

---

## 9. Performance

Honor PERFORMANCE_SLO:
- Startup path to first frame budget coordinated with apps
- Render path <16ms per frame target at configured FPS
- Input enqueue <50ms perceived

`performanceMonitoring` records `RuntimeMetrics` when enabled.

---

## 10. Non-Goals

- Owning PTY
- Compiling JSX
- Encoding graphics protocols
- Implementing style tokens

---

## 11. Test Mapping

| REQ | TC |
|-----|-----|
| REQ-RT-RUN-001..004 | TC-RT-001 config/types |
| REQ-RT-RUN-010 | TC-RT-010 lifecycle |
| REQ-RT-RUN-011 | TC-RT-011 fibers |
| REQ-RT-RUN-012 | TC-RT-012 runApp |
| REQ-RT-RUN-020..022 | TC-RT-020 messages |
| REQ-RT-001 hooks | TC-RT-HOOK-* |
| REQ-RT-002 recovery | TC-RT-REC-* |

---

## 12. Related

- `MVU_SPEC.md`, `HOOKS_SPEC.md`, `SCHEDULER_SPEC.md`, `SUBSCRIPTIONS_SPEC.md`, `EFFECT_INTEGRATION_SPEC.md`
- `DATA_FLOW_RUNTIME_MVU_JSX.md`
