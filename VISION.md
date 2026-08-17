# VISION

Authoritative reference for the *ideal* architecture of the Tuix workspace.  
Every statement below describes the target state once ongoing refactors are complete.

---

## Package Responsibilities & Boundaries

### `@tuix/ansi`
- Terminal styling primitives: colors, gradients, borders, typography.
- Pure stateless helpers (no global state).
- Exposes `Style`, `style()`, `border`, `color`, plus formatting utilities.
- Depends only on standard library types and pure math helpers.

### `@tuix/view`
- Declarative view primitives (`View`, `text`, `vstack`, `hstack`, `flexbox`, `styledBox`).
- Rendering pipeline contracts: `View.render()`, layout calculations, string width utilities.
- Contains optimized rendering strategies (buffering, diffing) isolated under `performance/`.
- Depends on `@tuix/ansi` for styling; has *no* awareness of JSX or MVU.

### `@tuix/core`
- Application module registry, command lifecycle, global scope definitions.
- Types shared across the platform (events, terminal capabilities, window size, etc.).
- Provides `getGlobalRegistry`, module base classes, error types.
- Pure TypeScript modules; zero JSX/UI concepts.

### `@tuix/reactive`
- Rune system (`$state`, `$derived`, `$effect`, etc.) for fine-grained reactivity.
- Scheduling infrastructure that interoperates with MVU runtime via effect queues.
- Emits zero UI primitives; only pure observable abstractions.
- Depends on `effect` runtime and `@tuix/core` types for context when necessary.

### `@tuix/runtime`
- MVU engine (model-update-view loop) and command harness.
- Owns event loop integration, effect scheduling, and renderer invocation.
- Consumes `@tuix/reactive` runes, `@tuix/view` primitives, and `@tuix/core` registry.
- Exposes a minimal API: `runApp`, `bootstrapWithModules`, interactive helpers.

### `@tuix/jsx`
- Thin syntactic sugar bridging JSX descriptors to Tuix `View`s and MVU runtime.
- Responsibilities:
  - Transform JSX syntax into descriptor objects (`factory/`).
  - Convert descriptors and primitives into `View`s (`runtime/renderer.ts`).
  - Define the limited intrinsic surface that maps directly to `@tuix/view` (`runtime/intrinsics.ts`).
  - Attach metadata for MVU interactivity (`runtime/interactive.ts`).
  - Manage JSX plugin scopes (`registry/`), delegating to `@tuix/core`.
  - Provide dev utilities (debug hooks, compiler integration) without polluting runtime core.
- Exposes:
  - `jsx`, `jsxs`, `jsxDEV`, `Fragment`, `createElement`, `render`.
  - `runtime/` namespace exports for advanced consumers (e.g., custom renderers).
  - `plugins/` & `scope/` helpers for declarative module registration.
- Depends on `@tuix/view`, `@tuix/runtime`, `@tuix/reactive`, `@tuix/core`, `@tuix/ansi`.

### `@tuix/ui`
- Component library built on top of `@tuix/jsx` + `@tuix/view`.
- Houses high-level widgets (layouts, forms, feedback, data views).
- All intrinsics replaced by component exports; only `<text>/<box>/<flex>` come from runtime.
- Organized by vertical feature directories (e.g., `components/forms/`, `components/layout/`).
- Depends on `@tuix/reactive` for internal state runes when needed.
- Widget families: layout (Box/Flex/Panel/Viewport), forms (Input/Select/Checkbox/…),
  feedback (Modal/Toast/Spinner/ProgressBar/Skeleton/Alert), display (Text/Card/Badge/
  StatusBar/Kbd/Avatar/Mark), data (Table/List/Sparkline/FileTree), navigation
  (Tabs/Help/CommandPalette).
- Widgets take color only from `theme.colors` / `theme.depth`; the app can swap the
  live theme at runtime via `setUITheme()` and every consumer repaints.

### `@tuix/process-manager`
- Stream/view coordination for running child processes inside Tuix apps.
- Produces components that consume `Stream` effects and render via `@tuix/jsx`.
- No direct dependency on MVU internals; communicates through public runtime APIs.

### Other Packages
- `@tuix/config`: configuration loading, template management.
- `@tuix/debug`: instrumented logging, debug toggles.
- `@tuix/themes`: declarative theme definitions consumed by `@tuix/ui`. One unified
  color schema across every built-in theme (dark, light, nord, dracula, gruvbox,
  vibes); five-step `theme.depth` stacks; Effect-scoped `ThemeContext` plus the
  global `setUITheme` rune for runtime switching. Theming guide:
  `docs/guides/theming.md`.
- `@tuix/testing`: shared test utilities, custom matchers.
- `@tuix/logger`, `@tuix/platform`, `@tuix/storage`, etc. each encapsulate their own service with no JSX/runtime leakage.

---

## Target `@tuix/jsx` Folder Structure

```
packages/jsx/src/
├── index.ts                 # Barrel exports (public API)
├── index.test.ts            # High-level contract tests (factory + runtime)
├── factory/
│   ├── create-element.ts    # jsx/jsxs/jsxDEV implementations
│   ├── types.ts             # JSXElement, JSXNode, guards
│   └── dev-info.ts          # Source/self tracking utilities
├── runtime/
│   ├── renderer.ts          # render(), renderJSX(), descriptor recursion
│   ├── intrinsics.ts        # map of intrinsic handlers -> @tuix/view adapters
│   ├── interactive.ts       # wrapInteractiveView, metadata symbols
│   ├── reconcile.ts         # ensureViewArray, renderChild, fragment helpers
│   └── utils.ts             # toTextContent, style merging, border resolution
├── registry/
│   ├── plugin-registry.ts   # declarative plugin management
│   └── scope-bridge.ts      # glue to @tuix/core scope manager
├── diagnostics/
│   ├── debug.ts             # jsxDebug hooks
│   └── errors.ts            # friendly runtime error wrappers
├── compiler/                # Existing compiler entry points (unchanged)
├── parser/                  # Existing parser utilities
├── scope/                   # Scope-specific components/types
└── plugins/                 # Plugin architecture (unchanged)
```

- `jsx-runtime.ts` becomes a 100–150 line barrel re-exporting the modular pieces.  
- Unit tests align with modules (factory tests under `factory/__tests__/`, runtime tests under `runtime/__tests__/`).

---

## Cross-Package Contracts

- `@tuix/jsx/runtime` imports only from:
  - `factory/types`
  - `@tuix/view` primitives
  - `@tuix/ansi` style helpers
  - `@tuix/reactive` (for interactive metadata bindings)
  - `@tuix/core` (registry + scope)
- MVU runtime interacts with JSX *only* via the public `render()` function and metadata symbol.
- `@tuix/ui` imports `@tuix/jsx` components and public runtime helpers; never reaches into `factory/` internals.
- Tooling (compiler, dev transforms) uses `factory/create-element.ts` + `runtime/intrinsics.ts` for code generation metadata.

---

## Documentation Artifacts

- `VISION.md` (this document): authoritative ideal reference.
- `CURRENT.md`: living summary of actual repo state, gaps vs. vision, outstanding tasks.
- No ad-hoc phase or audit docs; instead track work through issues/PRs referencing sections here.

---

## Quality Gates

- Lint and unit test suites scoped per package (`bun test` or `pnpm test --filter`).
- JSX runtime changes require:
  - Factory tests (descriptor shapes, DEV metadata).
  - Runtime-render tests (intrinsics, recursion, fragments, interactivity).
  - Integration smoke tests in `@tuix/ui` for canonical components (e.g., `StaticLayout`).
- Architectural review verifies `VISION.md` alignment before merge.
