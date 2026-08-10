# Dependency Rules

## Hard rules
- **Effect** is the sole effect system.
- **Bun** is the only runtime target.
- No circular dependencies between packages.
- `@tuix/runtime` must not depend on `@tuix/jsx`, `@tuix/ui`, or ecosystem app packages.
- `@tuix/view` has no JSX/MVU awareness.
- Public API of each package is `src/index.ts` (plus documented subpath exports).

## Allowed edges (summary)
core ← ansi, input (peer primitives)  
platform → core  
runtime → core, input  
reactive → core  
jsx → core, runtime, reactive, view  
ui → jsx, view, reactive  
process-manager → core (+ documented higher for plugin UI)

## Violations
Any forbidden edge fails CI architecture tests. No manual exceptions for v1.
