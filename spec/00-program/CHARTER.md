# Tuix Program Charter

## Mission

Deliver a complete, coherent, test-backed Bun-native TUI framework where:
- JSX is the primary user API
- Effect-ts powered MVU runtime is the authoritative execution model
- Bun is the only platform target
- No core product intent is deferred

## Non-Negotiable Constraints

1. **JSX-primary**: All user-facing APIs are expressed through JSX syntax
2. **MVU-authoritative**: All state flows through Model/Update/View cycle
3. **Effect-powered**: All async/side-effect operations use Effect.ts
4. **Bun-only**: No Node.js compatibility layers; leverage Bun-native APIs
5. **Complete**: Every module/feature/subfeature has spec, owner, implementation, tests, docs, and acceptance criteria

## Stakeholder

- Owner: Andrew Ewing (@aewing)

## Success Criteria

A team can confidently build rich, reactive, Bun-native terminal apps using JSX syntax, with runtime correctness guaranteed by Effect/MVU architecture and end-to-end quality gates.

## Scope

All 22 packages under `packages/`:
ansi, app-presets, bin, config, coordination, core, debug, docs, input, jsx, logger, platform, process-manager, reactive, runtime, storage, telemetry, testing, themes, ui, update, view
