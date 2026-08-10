# TUIX Full Audit + Delivery Plan (Gastown Orchestration)

## Purpose

This plan is written for a **team lead orchestrating multiple agents via Gastown** to deliver the complete Tuix vision:

- JSX-primary authoring model
- Effect-ts powered MVU runtime as execution engine
- Bun-only target and Bun-native capability usage
- Complete, coherent, test-backed product (no deferred core work)

---

## 1) Program Mandate (Non-Negotiable)

1. **JSX is the primary user API**.
2. **Runtime/MVU/Effect is the authoritative execution model** (no bypass paths).
3. **Bun is the only platform target**.
4. Every module/feature/subfeature must have:
   - spec
   - owner
   - implementation status
   - tests
   - docs
   - acceptance criteria
5. No “future bucket” for core product intent. Core gaps must be either:
   - scheduled with owner/date, or
   - removed from vision.

---

## 2) Canonical Artifact Tree (must exist before implementation)

```txt
spec/
  00-program/
    CHARTER.md
    GLOSSARY.md
    DECISION_LOG.md
    TRACEABILITY_MATRIX.md
    GASTOWN_AUDIT_AND_DELIVERY_PLAN.md   # this file
  10-architecture/
    LAYERS.md
    DEPENDENCY_RULES.md
    PACKAGE_BOUNDARIES.md
    DATA_FLOW_RUNTIME_MVU_JSX.md
    BUN_CAPABILITY_MATRIX.md
  20-catalog/
    MODULE_CATALOG.md
    FEATURE_CATALOG.md
    SUBFEATURE_CATALOG.md
    DUPLICATION_REGISTER.md
    GAP_REGISTER.md
  30-runtime/
    RUNTIME_SPEC.md
    MVU_SPEC.md
    EFFECT_INTEGRATION_SPEC.md
    HOOKS_SPEC.md
    SCHEDULER_SPEC.md
    SUBSCRIPTIONS_SPEC.md
  40-jsx/
    JSX_RUNTIME_SPEC.md
    JSX_PRIMITIVES_SPEC.md
    JSX_COMPILER_SPEC.md
    JSX_SCOPE_PLUGIN_SPEC.md
  50-terminal/
    TERMINAL_CAPABILITIES_SPEC.md
    RENDERER_SPEC.md
    INPUT_SPEC.md
    GRAPHICS_SPEC.md
  60-quality/
    TEST_STRATEGY.md
    COVERAGE_TARGETS.md
    PERFORMANCE_SLO.md
    RELEASE_GATES.md
```

These artifacts are mandatory outputs; if they are incomplete, implementation is not complete.

---

## 3) Gastown Team Topology

Use a **lead + specialist agent pods** model.

## Lead Agent (Orchestrator)
- Owns plan execution and cross-agent dependencies
- Assigns work packets
- Resolves conflicts and architecture decisions
- Maintains traceability matrix and release gate status

## Specialist Pods

### Pod A: Architecture & Governance
- Owns: `10-architecture/*`, `00-program/DECISION_LOG.md`
- Enforces layering, dependency direction, package boundaries

### Pod B: Catalog & Audit
- Owns: `20-catalog/*`
- Audits every package/module/feature/subfeature
- Produces duplication/gap register

### Pod C: Runtime/MVU/Effect
- Owns: `30-runtime/*`
- Verifies runtime model is effectively leveraged by JSX flows

### Pod D: JSX & Authoring
- Owns: `40-jsx/*`
- Ensures JSX stays primary API and maps cleanly to runtime

### Pod E: Terminal/Platform/Bun
- Owns: `50-terminal/*` + Bun capability matrix updates
- Defines sixel/kitty/iterm strategy and Bun-native implementations

### Pod F: Quality/Testing/Perf
- Owns: `60-quality/*`
- Defines hard quality gates and validation matrix

---

## 4) Work Packet Standard (Gastown Task Contract)

Every task assigned to an agent must include:

- **Task ID**: `WP-<domain>-###`
- **Inputs**: exact files/directories to inspect
- **Outputs**: exact artifact paths to produce/update
- **Rules**: Bun-only, no deprecation shims, boundary compliance
- **Acceptance Criteria**: objective checks
- **Timebox**: target completion window
- **Dependencies**: required upstream task IDs

Template:

```md
### WP-XXX-001
Owner: Pod X
Inputs: ...
Outputs: ...
Rules: ...
Acceptance:
- [ ] ...
- [ ] ...
Depends on: ...
```

---

## 5) Audit Methodology (No module left behind)

For each package under `packages/*`, audit and record:

1. Module purpose (actual vs intended)
2. Public API inventory
3. Internal architecture map
4. Declared dependencies vs actual imports
5. Feature inventory
6. Subfeature inventory
7. Test coverage and missing tests
8. Documentation quality and missing docs
9. Duplication candidates
10. Gap severity (Critical/High/Medium/Low)
11. Decision: Keep / Merge / Split / Delete / Rewrite

Write results into:
- `MODULE_CATALOG.md`
- `FEATURE_CATALOG.md`
- `SUBFEATURE_CATALOG.md`
- `DUPLICATION_REGISTER.md`
- `GAP_REGISTER.md`

---

## 6) ID + Traceability System (Required)

Use stable IDs across all specs/artifacts:

- Requirement: `REQ-<domain>-###`
- Module: `MOD-<pkg>-###`
- Feature: `FEAT-<pkg>-###`
- Subfeature: `SUB-<pkg>-###`
- Test Case: `TC-<domain>-###`
- Decision: `DEC-###`

`TRACEABILITY_MATRIX.md` must map:

`REQ -> FEAT/SUB -> Implementation files -> TC -> Docs`

No requirement without test mapping.

---

## 7) Concrete Workstreams

## WS1: Architecture Canonicalization
Outputs:
- `LAYERS.md`
- `DEPENDENCY_RULES.md`
- `PACKAGE_BOUNDARIES.md`
- `DATA_FLOW_RUNTIME_MVU_JSX.md`

Deliverables:
- Authoritative dependency direction
- Forbidden import rules
- Runtime ownership boundaries

## WS2: Full Inventory + Gap/Duplication Audit
Outputs:
- complete `20-catalog/*`

Deliverables:
- full module/feature/subfeature list
- zero ambiguous module responsibilities

## WS3: Runtime/MVU/Effect Leverage Validation
Outputs:
- `RUNTIME_SPEC.md`
- `MVU_SPEC.md`
- `EFFECT_INTEGRATION_SPEC.md`
- `HOOKS_SPEC.md`
- `SCHEDULER_SPEC.md`
- `SUBSCRIPTIONS_SPEC.md`

Deliverables:
- proof that JSX paths run through MVU runtime
- service boundaries clearly defined

## WS4: JSX-Primary Product Spec
Outputs:
- `JSX_RUNTIME_SPEC.md`
- `JSX_PRIMITIVES_SPEC.md`
- `JSX_COMPILER_SPEC.md`
- `JSX_SCOPE_PLUGIN_SPEC.md`

Deliverables:
- canonical JSX API contract
- primitive/event semantics

## WS5: Terminal/Graphics/Bun Strategy
Outputs:
- `TERMINAL_CAPABILITIES_SPEC.md`
- `RENDERER_SPEC.md`
- `INPUT_SPEC.md`
- `GRAPHICS_SPEC.md`
- `BUN_CAPABILITY_MATRIX.md`

Deliverables:
- sixel/kitty/iterm behavior and fallbacks
- Bun-native usage decisions by feature

## WS6: Quality Gates and Release Standard
Outputs:
- `TEST_STRATEGY.md`
- `COVERAGE_TARGETS.md`
- `PERFORMANCE_SLO.md`
- `RELEASE_GATES.md`

Deliverables:
- hard release criteria, including perf and architecture compliance

---

## 8) Hard Acceptance Criteria (Program Completion)

Program is complete only when:

1. All artifact files in this plan exist and are complete.
2. Every package/module/feature/subfeature has a catalog entry.
3. Every requirement has test + doc + implementation mapping.
4. Duplication register has resolution status for each item.
5. Gap register has no unresolved Critical/High items.
6. Architecture tests enforce dependency + source-import rules.
7. JSX-primary workflows are fully specified and validated.
8. Terminal graphics strategy (including sixel path) is explicitly specified.
9. Bun capability matrix is complete and applied to implementation choices.
10. Release gates pass with no manual exceptions.

---

## 9) Delivery Phases (Execution Order)

## Phase 0 (Day 1): Program Setup
- Create artifact skeleton
- Assign pods and task IDs

## Phase 1 (Days 2–4): Audit + Catalog
- Complete full inventory and gap/duplication registers

## Phase 2 (Days 5–7): Core Specs
- Runtime/MVU/JSX/Terminal/Bun specs finalized

## Phase 3 (Days 8–10): Implementation Plan Lock
- Translate all gaps into executable work packets with acceptance checks

## Phase 4 (Days 11+): Delivery Sprints
- Implement in dependency order:
  `core/view/runtime -> reactive/jsx -> terminal/platform -> ecosystem`

## Phase 5: Final Verification
- Run release gates
- Publish compliance summary tied to traceability matrix

---

## 10) Orchestration Rules for Team Lead

1. No agent starts implementation work before corresponding spec sections are approved.
2. No merge without traceability updates.
3. No undocumented public API behavior.
4. No “temporary compatibility” layers.
5. Any unresolved cross-pod conflict escalates to `DECISION_LOG.md` same day.
6. Daily standup artifact:
   - completed WP IDs
   - blocked WP IDs
   - changed risk status (Critical/High/Medium/Low)

---

## 11) Immediate Next Commands (for lead)

1. Create skeleton files in `spec/`.
2. Assign initial work packets:
   - Pod A: `WS1`
   - Pod B: `WS2`
   - Pod C: `WS3`
   - Pod D: `WS4`
   - Pod E: `WS5`
   - Pod F: `WS6`
3. Require first checkpoint: completed `20-catalog/*` + draft `10-architecture/*`.

---

## 12) Success Definition

Tuix is successful when a team can confidently build rich, reactive, Bun-native terminal apps using JSX syntax, with runtime correctness guaranteed by Effect/MVU architecture and end-to-end quality gates.
