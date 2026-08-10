# TUIX Vision Fulfillment Execution Playbook (Gastown)

## Purpose

This companion document explains how the team lead converts completed audit/spec artifacts into a coordinated delivery program that fully fulfills Tuix vision.

Use this after (or alongside) `GASTOWN_AUDIT_AND_DELIVERY_PLAN.md`.

---

## 1) Operating Model

The lead runs two synchronized loops:

1. **Planning Loop (Spec/Traceability)**
   - validate requirements, scope, sequencing
2. **Delivery Loop (Implementation/Verification)**
   - execute work packets, verify gates, merge

No implementation packet can run outside these loops.

---

## 2) Inputs Required Before Execution Starts

Execution begins only when these are present and minimally complete:

- `spec/20-catalog/MODULE_CATALOG.md`
- `spec/20-catalog/FEATURE_CATALOG.md`
- `spec/20-catalog/SUBFEATURE_CATALOG.md`
- `spec/20-catalog/GAP_REGISTER.md`
- `spec/20-catalog/DUPLICATION_REGISTER.md`
- `spec/10-architecture/LAYERS.md`
- `spec/10-architecture/PACKAGE_BOUNDARIES.md`
- `spec/00-program/TRACEABILITY_MATRIX.md`

If any are missing, run audit tasks first.

---

## 3) Convert Audit Artifacts into Delivery Backlog

## Step A: Normalize all items into requirements
Every gap/duplication item becomes one or more `REQ-*` entries with:
- owner pod
- severity
- affected packages
- acceptance tests required

## Step B: Classify each REQ into one of 5 lanes
1. **Architecture correction** (boundaries, layering, ownership)
2. **Core capability** (runtime/mvu/effect/jsx/terminal)
3. **Feature completion** (missing implementation)
4. **Quality hardening** (tests, perf, reliability)
5. **Documentation completion** (API/spec/usage)

## Step C: Build dependency graph
For each REQ, define upstream dependencies:
- runtime-level prerequisites
- API shape prerequisites
- test harness prerequisites

Store graph edges in traceability matrix.

---

## 4) Sequencing Rules (Hard)

Always sequence by architecture level:

1. foundation (`core`, `ansi`, `input`, `platform`, `storage`)
2. runtime (`view`, `runtime`, `reactive`)
3. authoring (`jsx`, `ui`, `themes`)
4. ecosystem (`config`, `logger`, `process-manager`, etc.)

A higher-layer REQ cannot enter implementation if lower-layer dependencies are unresolved.

---

## 5) Work Packet Construction for Delivery

Each execution packet must include:

- `WP-*` ID
- linked `REQ-*` IDs
- linked `MOD/FEAT/SUB` IDs
- exact files to change
- expected API diff (if any)
- required test files to add/update
- required docs/spec updates
- release gate checks

Definition of “packet ready”:
- clear acceptance criteria
- no ambiguous scope
- dependencies satisfied

---

## 6) Branch / PR Orchestration Strategy

Use one packet = one PR where possible.

PR template must include:
- `REQ-*` coverage
- `TC-*` added/updated
- spec/docs updated paths
- architecture boundary impact statement
- rollback notes

No PR merges without traceability updates.

---

## 7) Merge Gates (No Exceptions)

A packet merges only if all pass:

1. Boundary tests (source-import + dependency)
2. Package tests for touched modules
3. Integration tests for changed contracts
4. Perf checks if runtime/render/input affected
5. Docs/spec updates committed
6. Traceability matrix row completion

If any fail: packet returns to owner with explicit failure reason.

---

## 8) Daily Cadence for Team Lead

## Daily Standup (artifact-driven)
- completed WPs
- in-progress WPs
- blocked WPs + blocker owner
- newly discovered gaps/duplication
- risk updates by severity

## Daily Health Dashboard
Track:
- total REQs
- closed REQs
- blocked REQs
- unresolved critical/high gaps
- coverage deltas
- perf regression flags

---

## 9) Handling Duplication Decisions

For each duplication item:

1. choose canonical owner module
2. mark duplicates as merge/remove/migrate
3. create migration packet(s)
4. update all references and tests
5. remove dead code/docs

No duplicate remains in “accepted technical debt” state.

---

## 10) Handling Missing Features

For each missing feature:

1. write/validate spec section first
2. define acceptance tests
3. implement minimal complete version (not placeholder)
4. integrate with runtime/jsx architecture
5. document usage + constraints

No “scaffold-only” merges.

---

## 11) Runtime/MVU/Effect Leverage Validation Protocol

For every author-facing feature added/changed, confirm:

- Does JSX path compile/route through MVU loop?
- Are effects modeled in Effect (not ad-hoc async side paths)?
- Are commands/subscriptions/hook semantics preserved?
- Is rendering lifecycle traceable and test-covered?

If any answer is no, packet is not complete.

---

## 12) Bun-Only Enforcement Protocol

For each packet touching I/O/runtime/build/tooling:

- verify Bun-native API use where available
- reject unnecessary Node-only dependencies
- document Bun capability usage in `BUN_CAPABILITY_MATRIX.md`

This is mandatory for terminal/platform/runtime areas.

---

## 13) Completion Criteria by Domain

## Architecture Domain complete when:
- zero boundary violations
- package ownership unambiguous

## Runtime Domain complete when:
- all runtime specs are implemented and test-backed
- hooks/scheduler/subscriptions behavior fully validated

## JSX Domain complete when:
- primitives + compiler/runtime behavior match specs
- JSX remains primary path in docs/examples/tests

## Terminal Domain complete when:
- capabilities + rendering + input specs implemented
- graphics protocol strategy implemented/tested per spec

## Quality Domain complete when:
- release gates all green
- coverage and perf thresholds met

---

## 14) Final Vision Compliance Review

Before declaring completion, run a formal review:

1. walk every `REQ-*` in traceability matrix
2. verify implementation + tests + docs links
3. verify zero unresolved critical/high items
4. run full release gates
5. publish `VISION_COMPLIANCE_REPORT.md`

If any requirement lacks evidence, program is not complete.

---

## 15) Escalation Rules

Escalate to lead decision log when:
- cross-pod conflicts on ownership/boundaries
- spec ambiguity blocks implementation
- performance/regression risk crosses threshold
- unexpected Bun limitation affects design

All escalations result in `DEC-*` entries and explicit downstream task updates.

---

## 16) Immediate Next Actions for Team Lead

1. Confirm required input artifacts exist.
2. Convert gap/duplication registers into REQ backlog.
3. Build dependency graph and phase plan.
4. Assign first wave packets to pods in foundation->runtime order.
5. Enforce merge gates from day one.

---

## End State

By following this playbook, the team lead can translate audit artifacts into deterministic execution, delivering a cohesive Bun-native, JSX-primary, Effect/MVU-powered Tuix product with no deferred core intent.
