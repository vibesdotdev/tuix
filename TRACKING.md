# TRACKING

Purpose: keep the JSX primitives migration on-rails even if context is lost. Read this file before starting work, after breaks, and whenever goals feel fuzzy.

Core Goals (do not drift):
1. Establish a coherent set of JSX primitives that map cleanly to the terminal runtime (Text, Box, Flex, Scrollview, Button, TextInput, etc.).
2. Expose richer composites through `@tuix/jsx/components` and leave themed/opinionated layers to `@tuix/ui`.
3. Treat the `Style` builder as first-class, but accept plain style objects for flexibility.

Non-Negotiable Rules:
- Always import JSX helpers from `@tuix/jsx` only.
- Favor primitives; composites should be thin wrappers composed from them.
- Keep the runtime contract documented before implementing new tags.
- Update components to use callable runes (`state()`, `$set`)—no `.value` access.
- Never introduce a primitive unless it benefits most CLI apps and fits MVU/runtime constraints.

Progress Ritual (repeat every session):
1. Re-read relevant docs (this file, `packages/jsx/src/jsx-runtime.ts`, primitive specs) and restate the current objective out loud or in notes.
2. List the next two concrete actions and verify they align with Core Goals.
3. After each meaningful change, log an Update Statement (below) and scan for drift.
4. If confusion appears, pause and restate goals before coding again.

Update Statement Template:
- Current focus:
- Last change:
- Next micro-step:
- Blockers (if any):
- Goals still aligned? (Yes/No – if No, stop and realign)

Sanity Checklist (run before ending work):
- [ ] All edits respect primitives vs. composites boundary.
- [ ] Runtime cases and docs stay in sync.
- [ ] Runes usage remains idiomatic.
- [ ] Style handling honors both builder and plain object inputs.
- [ ] Update Statement recorded.

## Update Log

- 2025-09-28: Defined core JSX primitive spec (`docs/specs/jsx-primitives.md`) to guide runtime work. Next step: implement typography and layout primitives inside `packages/jsx/src/jsx-runtime.ts`.
- 2025-09-28: Implemented typography/layout primitives (`text`, `styled-text`, `heading`, `code`, `icon`, `box`, `panel`, `card`, `vstack`, `hstack`, `flex`, `spacer`) in the JSX runtime with helper utilities for style normalization and flex mapping. Typecheck currently blocked by pre-existing `@tuix/config` errors.
- 2025-09-28: Added `interactive` wrapper metadata and a basic `spinner` intrinsic to the JSX runtime. Spinner currently renders the first frame statically pending runtime-level animation support.
- 2025-09-28: Implemented `button`, `checkbox`, `toggle`, `modal`, `tooltip`, `toast`, `text-input`, and `textarea` intrinsics (with rune-aware bindings and metadata) in the JSX runtime. Inputs expose onChange/onSubmit hooks but still rely on upstream event wiring.
- 2025-09-28: Stubbed `packages/jsx/src/events.ts` to centralize interactive metadata + event emission helpers; runtime still needs to consume it for wiring.
- 2025-09-28: Identified remaining legacy alias imports (e.g., `@core/runtime`) that must be normalized to `@tuix/...` package paths. TODO: audit and update all alias imports across the repo.

If memory feels blank: reread this page, confirm the checklist, and re-announce the goals before resuming.
