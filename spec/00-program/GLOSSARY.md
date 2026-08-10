# Tuix Glossary

## Core Concepts

| Term | Definition |
|------|-----------|
| **MVU** | Model-View-Update — Elm-inspired architecture where state (Model) is updated by pure functions (Update) in response to messages, and rendered through a View function |
| **Effect** | Effect.ts — typed functional effect system providing dependency injection, error handling, and composable async operations |
| **Rune** | Svelte 5-inspired reactive primitive ($state, $derived, $effect) providing ergonomic state management that compiles to MVU model/message operations |
| **View** | A renderable terminal UI tree node produced by the view function of an MVU component |
| **Command (Cmd)** | An async side-effect that produces a message when complete (e.g., HTTP request, timer, file read) |
| **Subscription (Sub)** | A persistent event stream that produces messages over time (e.g., keyboard input, timer tick, WebSocket) |
| **Module** | A self-contained unit registered with the ModuleRegistry, providing services and capabilities |
| **Plugin** | A higher-level Module that extends app context with commands and services (e.g., Config, Logger, ProcessManager) |
| **Scope** | CLI routing mechanism for mapping command paths to JSX component trees |
| **Intrinsic** | A built-in JSX element that maps directly to a @tuix/view primitive (e.g., `<text>`, `<box>`, `<flex>`) |

## Architecture Layers

| Layer | Packages | Role |
|-------|----------|------|
| **L0 Foundation** | ansi, input | Zero-dependency primitives |
| **L1 Core** | core, platform, storage | Services, DI, module system |
| **L2 Runtime** | view, runtime | MVU loop, rendering, scheduling |
| **L3 Reactivity** | reactive | Runes, reactive state integration |
| **L4 Authoring** | jsx, ui, themes | User-facing API surface |
| **L5 Ecosystem** | config, logger, process-manager, coordination, telemetry, debug, testing, docs, update, bin, app-presets | Plugins, tooling, utilities |

## ID Conventions

| Prefix | Domain | Example |
|--------|--------|---------|
| `REQ-*` | Requirement | REQ-RT-001 (runtime requirement) |
| `MOD-*` | Module | MOD-CORE-001 |
| `FEAT-*` | Feature | FEAT-JSX-001 |
| `SUB-*` | Subfeature | SUB-JSX-001-A |
| `TC-*` | Test Case | TC-RT-001 |
| `DEC-*` | Decision | DEC-001 |
| `WP-*` | Work Packet | WP-ARCH-001 |
