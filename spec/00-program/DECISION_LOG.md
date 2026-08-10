# Decision Log

All architectural and cross-pod decisions are recorded here with rationale and downstream impact.

## Format

```
### DEC-NNN: <Title>
**Date:** YYYY-MM-DD
**Status:** Accepted | Superseded | Rejected
**Context:** <Why this decision was needed>
**Decision:** <What was decided>
**Rationale:** <Why this option was chosen>
**Consequences:** <Downstream impact>
**Affected Pods:** <A/B/C/D/E/F>
```

---

### DEC-001: Bun-only target platform
**Date:** 2026-02-06
**Status:** Accepted
**Context:** Framework needs a clear platform target to avoid compatibility sprawl.
**Decision:** Tuix targets Bun exclusively. No Node.js compatibility layers.
**Rationale:** Bun provides native TypeScript execution, built-in test runner, native SQLite/Redis/Postgres, HTML imports, and fast startup. Maintaining Node.js compatibility would add complexity without value for the target audience.
**Consequences:** All I/O, build, and runtime code must use Bun-native APIs where available. Bun capability matrix must be maintained.
**Affected Pods:** All

### DEC-002: Effect.ts as the effect system
**Date:** 2026-02-06
**Status:** Accepted
**Context:** MVU architecture requires a typed effect system for commands, subscriptions, and DI.
**Decision:** Effect.ts is the sole effect system. No ad-hoc async side paths.
**Rationale:** Effect.ts provides typed errors, dependency injection via Context, composable operations, and structured concurrency — all essential for MVU correctness.
**Consequences:** All async operations must be modeled as Effects. Runtime hooks and service boundaries use Effect Context for DI.
**Affected Pods:** C, D, E

### DEC-003: JSX compiles to MVU Component, never renders directly
**Date:** 2026-02-06
**Status:** Accepted
**Context:** Current JSX implementation bypasses MVU runtime and renders directly to terminal.
**Decision:** JSX trees compile to `Component<Model, Msg>` and always run through the MVU runtime loop.
**Rationale:** Direct rendering breaks the MVU contract, makes state management unpredictable, and prevents runtime hooks from functioning.
**Consequences:** JSX package needs a compiler module. Reactive runes must map to model fields and update messages.
**Affected Pods:** C, D
