# Effect Integration Spec

*Pod C: Runtime/MVU/Effect — WS3*  
**Status:** Complete  
**Decision:** DEC-002 Effect.ts sole effect system

---

## 1. Purpose

Define how Effect.ts is used across init/update/commands/subscriptions/services/hooks so DI, errors, and concurrency stay consistent.

---

## 2. Principles

1. **Typed errors:** Prefer typed error channels over thrown exceptions at boundaries.
2. **Context DI:** Services via `Context.Tag` / Effect Layer; no service locator for terminal I/O.
3. **Structured concurrency:** Fibers for input/update/render/commands; interrupt on shutdown.
4. **No Promise-only public I/O APIs** at framework boundaries (adapters may exist at edges).

---

## 3. Service Tags

### REQ-EFF-001

Core defines tags (names illustrative of actual exports):

| Tag | Capability |
|-----|------------|
| TerminalService | write, cursor, screen, size, capabilities |
| InputService | events stream, mouse modes, paste |
| RendererService | render View → terminal ops |
| StorageService | key/value or file persistence |

**AC:** Tags stable; Live implementations swappable for Test.

### REQ-EFF-002: AppServices

`AppServices` (or equivalent R union) is the default environment for Component Effects. Apps extend via Layer.merge for domain services.

---

## 4. Component Effects

### REQ-EFF-010: init / update

Return type must be Effect producing `[Model, Cmd<Msg>[]]`. Sync helpers may wrap with `Effect.succeed`.

### REQ-EFF-011: Commands

```typescript
type Cmd<Msg> = Effect.Effect<Msg | null, unknown, AppServices>
```

CommandScheduler runs cmds with concurrency limit and optional timeout (`commandTimeout`).

### REQ-EFF-012: Subscriptions

Subs are long-running Effects or managed handles that enqueue Msg; see SUBSCRIPTIONS_SPEC. Must be interruptible.

### REQ-EFF-013: Hooks

Each hook returns `Effect<void>` (or typed variant). Runtime runs hooks in the update/render fibers.

---

## 5. Layer Composition

### REQ-EFF-020

Composition root (bin/app/platform):

```
Layer.mergeAll(
  TerminalLive,
  InputLive,
  RendererLive,
  StorageLive,
  // domain layers
)
```

**AC:** Tests provide `TestTerminal` etc. without code changes in components.

### REQ-EFF-021: Platform export

`@tuix/platform` exposes the product Live composition (REQ-PLAT-001). Core may still define Live modules.

---

## 6. Concurrency Model

| Work | Effect tool |
|------|-------------|
| Message queue | `Queue` |
| State | `Ref` |
| Fibers | `Fiber` / `Effect.fork` |
| Timeouts | `Duration` + `Effect.timeout` |
| Cancellation | fiber interrupt + finalizers |

### REQ-EFF-030

All finalizers for terminal mode changes MUST run on interrupt (alt screen off, mouse off, cursor on).

---

## 7. Error Mapping

| Source | Mapping |
|--------|---------|
| Terminal I/O | `TerminalError` (core) |
| Runtime loop | `RuntimeError` |
| Domain | package-specific tagged errors |
| Unknown | `onError` hook + log |

### REQ-EFF-040

Do not swallow errors in Live implementations without tagging; Effect failure must remain observable.

---

## 8. Interop Rules

1. **Bun APIs** inside Live layers only (or process-manager), wrapped in `Effect.tryPromise` / `Effect.async` / `Effect.sync`.
2. **node-pty** only inside process-manager adapters, Effect-wrapped.
3. **view** remains pure data — no Effect required to construct basic Views.
4. JSX compiler outputs Components whose init/update are Effects.

---

## 9. Forbidden

- `Effect.runPromise` inside `view` during render fiber except documented async-view await points managed by runtime.
- Global mutable service singletons replacing Layer for terminal write path.
- Mixing RxJS or other effect systems for framework commands.

---

## 10. Tests

| REQ | TC |
|-----|-----|
| REQ-EFF-001 | TC-EFF-001 tag presence / Layer provide |
| REQ-EFF-010 | TC-EFF-010 component effect shape |
| REQ-EFF-011 | TC-EFF-011 command concurrency |
| REQ-EFF-020 | TC-EFF-020 test layer swap |
| REQ-EFF-030 | TC-EFF-030 teardown finalizers |

---

## 11. Related

- `RUNTIME_SPEC.md`, `HOOKS_SPEC.md`, `SCHEDULER_SPEC.md`
- `BUN_CAPABILITY_MATRIX.md`
- docs/dependencies/effect
