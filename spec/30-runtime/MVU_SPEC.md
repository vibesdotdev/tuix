# MVU Spec

*Pod C: Runtime/MVU/Effect — WS3*  
**Status:** Complete  
**Authority:** Elm-inspired Model-View-Update as implemented with Effect.ts

---

## 1. Purpose

Specify the MVU contract every Tuix component must satisfy, including purity rules, command/subscription roles, and how JSX/reactive layers map onto the contract.

---

## 2. Core Contract

### REQ-MVU-001: Component

```typescript
interface Component<Model, Msg, E = never> {
  init: Effect.Effect<[Model, Cmd<Msg>[]], E, AppServices>
  update: (msg: Msg, model: Model) => Effect.Effect<[Model, Cmd<Msg>[]], E, AppServices>
  view: (model: Model) => View | Effect.Effect<View, E, AppServices>
  subscriptions?: (model: Model) => Sub<Msg>[]
}
```

**AC:**
- AC-MVU-001-A: `init` produces initial model and startup commands.
- AC-MVU-001-B: `update` is total for all Msg variants the app declares.
- AC-MVU-001-C: `view` does not perform terminal I/O (no TerminalService writes inside view logic).
- AC-MVU-001-D: Optional `subscriptions` re-evaluated after model changes.

### REQ-MVU-002: Model

- Model is application state; treat as immutable update style (return new model or carefully managed structural sharing).
- Model MUST be serializable enough for debug tooling when possible (plain data preferred).

### REQ-MVU-003: Msg

- Closed union of events (keys, UI intents, command results, domain events).
- System/runtime may wrap Msg; user `update` receives unwrapped user messages.

### REQ-MVU-004: View

- Pure description of UI (tree / cells) consumed by RendererService.
- May be produced asynchronously only through documented async-view Effect path.

### REQ-MVU-005: Cmd

- `Cmd<Msg>` is an Effect that optionally yields a follow-up `Msg`.
- Side effects (HTTP, FS, process) belong in commands, not `update` pure section — `update` may return Effects that encapsulate decisions + cmds.

### REQ-MVU-006: Sub

- Long-lived producers of `Msg` (keyboard already handled by runtime input fiber; app subs for timers, FS watch, child process stdout, etc.).
- See SUBSCRIPTIONS_SPEC.

---

## 3. Cycle Semantics

```
          ┌──────────┐
          │   init   │
          └────┬─────┘
               ▼
         Model₀, Cmds₀
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
  run Cmds   register   view(Model)
    │        Subs         │
    ▼          │          ▼
   Msg ────────┤       Render
    │          │
    ▼          │
  update(msg, model) → Model', Cmds'
    │
    └── loop
```

### REQ-MVU-010: Single source of truth

Only `update` (and `init`) change Model. Views and external systems propose changes exclusively by sending Msg.

### REQ-MVU-011: Batching

Runtime MAY coalesce render frames; it MUST NOT drop user Msgs arbitrarily. Multiple msgs process sequentially producing intermediate models.

### REQ-MVU-012: Identity update

If model reference/value equals previous and no cmds, runtime may skip render (dirty-bit optimization). Equality strategy implementation-defined; default reference or shallow compare acceptable if documented.

---

## 4. Mapping from Authoring Layers

| Authoring construct | MVU target |
|---------------------|------------|
| `$state` / `$bindable` | Model fields |
| `$derived` | Computed during `view` (REQ-REAC-001) |
| `$effect` | Cmd and/or Sub |
| Event handlers | Msg constructors |
| JSX tree | `view` output |
| `detectInteractive` false | `exitAfterRender` runtime mode |
| `extractModel` | `init` model |

Compiler responsibilities: JSX_COMPILER_SPEC. Runtime never parses JSX.

---

## 5. Error Semantics

### REQ-MVU-020

- Failures in `init`/`update` Effects surface as `E | RuntimeError`.
- View throw/reject → render error path → recovery (REQ-RT-002).
- Commands fail independently without necessarily rolling back already-applied model (document if transactional semantics added later).

---

## 6. Testing Requirements

| REQ | TC ideas |
|-----|----------|
| REQ-MVU-001 | Component mock runs through Runtime with fake services |
| REQ-MVU-010 | External mutation of model without msg does not affect next view from runtime state |
| REQ-MVU-005 | Cmd completion delivers msg and second update |

Use `@tuix/testing` Layers for Terminal/Input/Renderer fakes.

---

## 7. Anti-Patterns

1. Calling `update` from `view`.
2. Writing stdout in `update` without Effect service.
3. Storing non-serializable sockets on model without disposal plan (prefer Sub handles outside model).
4. Re-implementing message queue in components.

---

## 8. Related

- `RUNTIME_SPEC.md`, `EFFECT_INTEGRATION_SPEC.md`
- `DATA_FLOW_RUNTIME_MVU_JSX.md`
- DEC-002, DEC-003
