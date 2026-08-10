# Data Flow: Runtime ↔ MVU ↔ JSX

```
Author writes JSX + runes
        │
        ▼
compileToComponent (detectInteractive, extractModel)
        │
        ▼
Component { init, update, view, subscriptions? }
        │
        ▼
Runtime.run + Effect.provide(LiveServices)
        │
   ┌────┴────┐
   ▼         ▼
 update ←── messages (hooks: onMessage, before/afterUpdate)
   │
   ▼
 view(model) → View.render → TerminalService.write
   │
 subscriptions → UserMsg (re-eval after update)
```

Invariants: view is pure (no Effect services); commands use AppServices; hooks compose via RuntimeHooks.
