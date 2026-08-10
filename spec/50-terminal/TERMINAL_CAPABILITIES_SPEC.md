# Terminal Capabilities Spec

*Pod E: Terminal/Platform/Bun — WS5*  
**Status:** Complete  
**REQ:** REQ-TERM-001, REQ-TERM-004  
**Impl:** `packages/core/src/services/capabilities/*`, Live terminal

---

## 1. Purpose

Define how Tuix discovers what a terminal can do (color, mouse, unicode, graphics, size) using environment heuristics plus optional active probes, and how consumers read a stable `TerminalCapabilities` snapshot.

---

## 2. Capability Model

### REQ-TERM-CAP-001: TerminalCapabilities

Canonical fields (align with `types/schemas`):

| Field | Meaning |
|-------|---------|
| colors | `'none' \| 'basic' \| '256' \| 'truecolor'` |
| mouse | boolean |
| unicode | boolean |
| sixel / kitty / iterm2 | graphics protocol support flags |
| width / height | columns / rows |
| isTTY | boolean |
| platform | OS string |

Additional flags may exist for bracketed paste, focus events, hyperlinks — document when added.

### REQ-TERM-CAP-002: Pure detection

`detectCapabilities(input: DetectCapabilitiesInput): TerminalCapabilities` is **pure** given `env`, optional `probe`, size, and isTTY. Unit tests MUST NOT require a real TTY.

---

## 3. Environment Heuristics

### REQ-TERM-CAP-010: Color

Order (see `detectColorLevel`):
1. `NO_COLOR` set → none  
2. `FORCE_COLOR=0` → none  
3. `COLORTERM=truecolor|24bit` or FORCE_COLOR=3 → truecolor  
4. `TERM` contains `256color` or FORCE_COLOR=2 → 256  
5. other non-dumb TERM → basic  
6. else none  

### REQ-TERM-CAP-011: Graphics from env

| Protocol | Signals |
|----------|---------|
| kitty | `TERM=xterm-kitty`, `KITTY_WINDOW_ID`, TERM_PROGRAM kitty, TERM_FEATURES |
| iterm2 | TERM_PROGRAM `iTerm.app`, `ITERM_SESSION_ID` |
| sixel | TERM features, known terminals, probe preferred |

Env alone is advisory; **probe results override** when present.

### REQ-TERM-CAP-012: Unicode

Default true on modern UTF-8 locales; false for dumb/`linux` console heuristics when needed.

---

## 4. Active Probes

### REQ-TERM-CAP-020

When isTTY and probes enabled, Live terminal MAY:
- Primary DA / XTVERSION / feature queries
- DECRQM for specific modes
- Graphics-specific queries where standardized

Results populate `CapabilityProbeResult`:
```typescript
{ sixel?, kitty?, iterm2?, mouse?, truecolor?, unicode? }
```

**AC:** Probe timeouts must not block startup beyond budget (PERFORMANCE_SLO startup); fall back to env-only.

### REQ-TERM-CAP-021: CPR (REQ-TERM-004)

| Item | Spec |
|------|------|
| Request | `ESC[6n` (`REQUEST_CURSOR_POSITION`) |
| Response | `ESC[row;colR` 1-based |
| API | `parseCursorPositionReport`, `accumulateCpr` |
| Use | cursor-relative layouts, probe sync, resize validation |

**AC:** Parse rejects incomplete/out-of-range; accumulate handles split reads.

---

## 5. Protocol Selection

### REQ-TERM-CAP-030

`selectGraphicsProtocol(caps): 'kitty' | 'iterm2' | 'sixel' | 'none'`

**Priority (mandatory):** kitty > iterm2 > sixel > none (cell fallback).

Documented also in GRAPHICS_SPEC and BUN_CAPABILITY_MATRIX.

---

## 6. Live Integration

### REQ-TERM-CAP-040

TerminalService exposes:
- `getCapabilities` / cached snapshot
- size query (`columns`/`rows` from stdout or env COLUMNS/LINES)
- optional `refreshCapabilities` after resize

Resize events should update width/height and enqueue runtime system message when interactive.

---

## 7. Consumer Rules

| Consumer | Allowed |
|----------|---------|
| Renderer | read caps for color degradation |
| Graphics encode | select protocol via caps |
| UI | must not re-parse env for color |
| Tests | inject env+probe fixtures |

---

## 8. Acceptance Tests

| REQ | TC |
|-----|-----|
| REQ-TERM-001 / CAP-001 | TC-TERM-001 snapshot shape |
| CAP-010 | TC-TERM-010 color matrix |
| CAP-011 | TC-TERM-011 graphics env |
| CAP-020 | TC-TERM-020 probe merge |
| REQ-TERM-004 / CAP-021 | TC-TERM-021 CPR parse/accumulate |
| CAP-030 | TC-TERM-030 protocol priority |

---

## 9. Related

- `GRAPHICS_SPEC.md`, `RENDERER_SPEC.md`, `INPUT_SPEC.md`
- `packages/core/src/services/capabilities/detect.ts`, `cpr.ts`
