# Tuix Documentation

This folder contains architecture, standards, and planning docs for the monorepo.

## Core References

- [../VISION.md](../VISION.md) — target architecture and package boundaries
- [../CURRENT.md](../CURRENT.md) — generated inventory of current state
- [../ARCHITECTURE.md](../ARCHITECTURE.md) — architectural design notes
- [../STATUS.md](../STATUS.md) — implementation status by phase
- [PRIORITIES.md](./PRIORITIES.md) — priority order and gap-elimination plan

## Visual bar

- [VISUAL-LANGUAGE.md](./VISUAL-LANGUAGE.md) — depth, motion, brand, density
- [EVIDENCE.md](./EVIDENCE.md) — real PTY PNG or it did not happen

## Engineering Standards

- [RULES.md](./RULES.md)
- [STANDARDS.md](./STANDARDS.md)
- [CONVENTIONS.md](./CONVENTIONS.md)
- [DEPENDENCIES.md](./DEPENDENCIES.md)
- [MODULES.md](./MODULES.md)
- [PLUGINS.md](./PLUGINS.md)
- [GASTOWN_ONBOARDING.md](./GASTOWN_ONBOARDING.md) — verified Mayor-led rig onboarding and work-dispatch runbook

Notable package: `@tuix/app-presets` provides app/plugin module factories for runtime bootstrap composition.

## Notes

- Treat `VISION.md` as the source of truth for intended layering.
- Keep docs aligned with actual package names under `packages/*`.
- Prefer updating these canonical docs instead of adding ad-hoc planning files.
