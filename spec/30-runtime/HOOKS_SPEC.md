# Hooks Spec

*Pod C: Runtime/MVU/Effect — WS3*  
**Status:** Complete  
**Requirement:** REQ-RT-001  
**Impl:** `packages/runtime/src/hooks/types.ts`, invoked from `mvu/runtime/core.ts`

---

## 1. Purpose

Define lifecycle integration points so reactive, JSX, telemetry, and debug systems observe and influence the MVU loop without forking it.

---

## 2. RuntimeHooks Interface

### REQ-HOOK-001

```typescript
interface RuntimeHooks<Model = any, Msg = any> {
  beforeInit?: () => Effect.Effect<void>
  afterInit?: (model: Model) => Effect.Effect<void>
  beforeUpdate?: (msg: Msg, model: Model) => Effect.Effect<void>
  afterUpdate?: (oldModel: Model, newModel: Model, msg: Msg) => Effect.Effect<void>
  beforeRender?: (model: Model) => Effect.Effect<void>
  afterRender?: (view: View, model: Model) => Effect.Effect<void>
  onCommand?: (cmd: Effect.Effect<Msg | null>) => Effect.Effect<void>
  onSubscription?: (sub: Effect.Effect<Msg>) => Effect.Effect<void>
  onMessage?: (msg: Msg) => Effect.Effect<Msg | null>
  onError?: (error: unknown, context: string) => Effect.Effect<void>
  onShutdown?: () => Effect.Effect<void>
}
```

**AC:**
- AC-HOOK-001-A: All hooks optional; omitting all is valid.
- AC-HOOK-001-B: Hooks receive stable ordering guarantees in §3.
- AC-HOOK-001-C: `onMessage` returning `null` cancels dispatch of that message.

---

## 3. Invocation Order

### Init
1. terminal setup  
2. `beforeInit`  
3. `component.init`  
4. `afterInit(model)`  
5. schedule cmds / subs  

### Per message
1. dequeue  
2. `onMessage` (optional filter)  
3. `beforeUpdate`  
4. `update`  
5. `afterUpdate`  
6. schedule new cmds; refresh subs  
7. mark dirty  

### Per frame (if dirty)
1. `beforeRender`  
2. `view`  
3. renderer  
4. `afterRender`  

### Command start
- `onCommand` when command scheduled/executed (implementation documents exact moment; must be once per cmd execution)

### Subscription register
- `onSubscription` when sub attached

### Error
- `onError(error, context)` with context string e.g. `"update" | "render" | "command" | "init"`

### Shutdown
1. stop fibers  
2. restore terminal  
3. `onShutdown`  
4. `config.onQuit` if quit  

---

## 4. Integration Recipes

### REQ-HOOK-010: Reactive bridge

| Hook | Use |
|------|-----|
| afterInit | Seed rune store from model |
| afterUpdate | Sync model → runes; flush `$effect` |
| beforeRender | Ensure `$derived` caches coherent |
| onShutdown | Dispose subscriptions/listeners |

### REQ-HOOK-011: JSX / compiler

| Hook | Use |
|------|-----|
| onMessage | Map raw key events if needed |
| afterUpdate | Dev overlay model diff |
| onError | Surface compiler/runtime errors in debug UI |

### REQ-HOOK-012: Telemetry / debug

| Hook | Use |
|------|-----|
| afterRender | frame timing |
| onCommand | command counts |
| beforeUpdate | message tracing |

---

## 5. Error Behavior

### REQ-HOOK-020

- Hook Effect failure SHOULD call `onError` with context `"hook:<name>"` and MUST NOT leave terminal modes unrestored.
- Default: non-critical hook failure logs and continues; `beforeUpdate`/`onMessage` failures may drop the message if unrecoverable.
- Recovery coordination (REQ-RT-002) may subscribe to `onError` for higher-level policy.

---

## 6. Composition

### REQ-HOOK-030

Provide `composeHooks(...hooks): RuntimeHooks` (or equivalent) that runs hooks in registration order for the same lifecycle point. First `onMessage` returning `null` short-circuits.

---

## 7. Non-Goals

- Hooks are not a second component API; they must not replace `update`.
- Hooks must not write terminal bypassing Renderer/Terminal services in product code (debug may use logger).

---

## 8. Tests

| REQ | TC |
|-----|-----|
| REQ-HOOK-001 | TC-RT-HOOK-001 interface invocation |
| REQ-HOOK-001-C | TC-RT-HOOK-002 onMessage cancel |
| REQ-HOOK-010 | TC-RT-HOOK-010 reactive sync |
| REQ-HOOK-020 | TC-RT-HOOK-020 hook failure |
| REQ-HOOK-030 | TC-RT-HOOK-030 compose |

---

## 9. Related

- REQ-RT-001, REQ-RT-002
- `RUNTIME_SPEC.md`, reactive RUNTIME_INTEGRATION.md
