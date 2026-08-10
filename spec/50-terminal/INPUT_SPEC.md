# Input Spec

*Pod E: Terminal/Platform/Bun — WS5*  
**Status:** Complete  
**REQ:** REQ-INPUT-001 (paste)  
**Impl:** `@tuix/input`, `packages/core/src/services/live/input.ts`

---

## 1. Purpose

Define stdin acquisition, parse pipeline, event model (keyboard, mouse, paste), mode enablement, and delivery into the MVU runtime.

---

## 2. Architecture

```
stdin (raw) → Live InputService
     → chunk buffer
     → @tuix/input parsers
     → InputEvent (Key | Mouse | Paste | Focus | CprRelated)
     → Runtime input fiber → Msg / system
```

### REQ-INP-001

Parsing is pure in `@tuix/input`. I/O and raw mode live in Live InputService only.

---

## 3. Keyboard

### REQ-INP-010

- Support printable UTF-8, CSI/SS3 function keys, modifiers (ctrl/alt/shift) where terminal reports them.
- `KeyUtils` provides quit detection and common helpers used by Runtime.

### REQ-INP-011

Unknown sequences: either ignore or emit raw fallback event — must not crash parser.

---

## 4. Mouse

### REQ-INP-020

- Optional; enabled via `RuntimeConfig.enableMouse` → InputService enable sequences.
- Prefer SGR mouse reporting when available.
- Disable on shutdown always.

### REQ-INP-021

Events: move, down, up, wheel with cell coordinates 0- or 1-based consistently documented in types.

---

## 5. Paste (REQ-INPUT-001)

### REQ-INP-030: Bracketed paste

| Item | Requirement |
|------|-------------|
| Enable | Emit bracketed paste mode on (`ESC[?2004h`) when interactive |
| Disable | `ESC[?2004l` on shutdown |
| Start | `ESC[200~` |
| End | `ESC[201~` |
| Event | `PasteEvent { text: string }` delivered as single logical paste (not key-per-char) |
| Nested | Buffer until end marker; enforce max size to avoid memory abuse |

**AC:**
- AC-INP-030-A: Multi-chunk paste reassembled.
- AC-INP-030-B: Paste does not trigger accidental quit key interpretation mid-buffer.
- AC-INP-030-C: Without bracketed paste support, fallback may synthesize chars but should still batch when possible.

### REQ-INP-031

Apps map `PasteEvent` → Msg in update; UI inputs insert text atomically.

---

## 6. Focus Events

### REQ-INP-040

Optional focus in/out (`ESC[I` / `ESC[O`) when enabled; useful for cursor shape / dimming. Partial status acceptable for v1 if parse exists.

---

## 7. CPR & Mixed Streams

### REQ-INP-050

CPR responses (`ESC[r;cR`) may arrive on stdin interleaved with keys. Live input or a demux step MUST route CPR to capability/cursor helpers (`parseCursorPositionReport`) without treating as key text.

---

## 8. Raw Mode & TTY

### REQ-INP-060

- Enable raw mode only when isTTY and interactive Runtime.
- Non-TTY: InputService yields no key stream; CLI exitAfterRender still works.
- Bun/process stdin APIs used inside Live layer (BUN_CAPABILITY_MATRIX).

---

## 9. Error Handling

### REQ-INP-070

stdin errors → Input/Terminal error tags → runtime onError. Do not spin hot-loop on repeated errors without backoff.

---

## 10. Tests

| REQ | TC |
|-----|-----|
| REQ-INP-001 | TC-INP-001 pure parse fixtures |
| REQ-INP-010 | TC-INP-010 key vectors |
| REQ-INP-020 | TC-INP-020 mouse SGR |
| REQ-INPUT-001 / INP-030 | TC-INP-030 bracketed paste |
| REQ-INP-050 | TC-INP-050 CPR demux |

---

## 11. Related

- `TERMINAL_CAPABILITIES_SPEC.md`, `RUNTIME_SPEC.md`
- FEAT-INPUT-001..004
