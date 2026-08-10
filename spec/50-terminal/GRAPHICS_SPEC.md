# Graphics Spec

*Pod E: Terminal/Platform/Bun — WS5*  
**Status:** Complete  
**REQ:** REQ-TERM-002  
**Impl:** `packages/core/src/services/graphics/*`  
**Decision:** Pure encode/decode in `@tuix/core`; priority kitty > iterm2 > sixel > cell fallback (BUN-DEC-004)

---

## 1. Purpose

Specify terminal image/graphics protocols supported by Tuix, selection strategy, encode/decode APIs, fallback behavior, and testing without a physical terminal.

---

## 2. Supported Protocols

| Protocol | Module | Strengths | Limits |
|----------|--------|-----------|--------|
| **Kitty** | `graphics/kitty.ts` | Efficient, modern, placement control | Kitty/ghostty-class terminals |
| **iTerm2** | `graphics/iterm.ts` | Simple inline images | iTerm2 / some WezTerm configs |
| **Sixel** | `graphics/sixel.ts` | Wide legacy support | Palette/size constraints |
| **Cell fallback** | consumer | Universal | Low fidelity |

---

## 3. Selection Strategy

### REQ-GFX-001

```
selectGraphicsProtocol(caps):
  if caps.kitty → 'kitty'
  else if caps.iterm2 → 'iterm2'
  else if caps.sixel → 'sixel'
  else → 'none'
```

**Mandatory order:** kitty > iterm2 > sixel > none.  
Capabilities from TERMINAL_CAPABILITIES_SPEC (env + probe). No renderer-local reordering.

---

## 4. Encode API

### REQ-GFX-010

```typescript
interface ImageEncodeInput {
  data: Uint8Array | Buffer | number[]
  width: number
  height: number
  channels?: 1 | 3 | 4
  format?: 'rgb' | 'rgba' | 'png' | 'gray'
  name?: string
}

interface EncodedGraphics {
  protocol: GraphicsProtocol
  payload: string
  fallback: boolean
}

encodeGraphics(caps, image): EncodedGraphics
```

**AC:**
- AC-GFX-010-A: When protocol `none`, `fallback === true` and payload empty or ignored.
- AC-GFX-010-B: Kitty path uses png/rgb/rgba as implemented.
- AC-GFX-010-C: iTerm path base64-wraps image bytes with name optional.
- AC-GFX-010-D: Sixel path encodes pixel data with width/height/channels.

### REQ-GFX-011: Pure functions

Encode/decode MUST be pure (no I/O). Loading files uses `Bun.file` at call site, then passes bytes in.

---

## 5. Decode API

### REQ-GFX-020

`decodeGraphics(payload, protocol?)` for tests and interop. Auto-detect helpers: `isKittyPayload`, `isITermPayload`, `isSixelPayload`.

Decode fidelity may be best-effort for complex Kitty placements; encode is product-critical.

---

## 6. Fallback Behavior

### REQ-GFX-030

When `fallback: true`:
- UI/view supplies ASCII/Unicode art, solid block approx, or placeholder text.
- Must not emit invalid kitty/sixel fragments.
- Apps may check caps before attempting heavy image loads.

---

## 7. Integration Points

| Layer | Role |
|-------|------|
| core graphics | encode/decode |
| capabilities | protocol flags + select |
| renderer | place payload / fallback cells |
| view/ui | declare image regions, placeholders |
| process-manager | unrelated (no encode ownership) |

---

## 8. Security / Limits

### REQ-GFX-040

- Enforce max dimensions/bytes in encode helpers to avoid huge allocations.
- Do not execute embedded files; iTerm name is metadata only.
- Treat payloads as untrusted if decoding external streams.

---

## 9. Testing Strategy

1. Golden payloads for small solid-color images per protocol.
2. Round-trip where decode implemented.
3. Selection matrix over synthetic caps.
4. No TTY required.

| REQ | TC |
|-----|-----|
| REQ-TERM-002 / GFX-001 | TC-GFX-001 priority |
| REQ-GFX-010 | TC-GFX-010 encode each protocol |
| REQ-GFX-030 | TC-GFX-030 fallback flag |
| REQ-GFX-011 | TC-GFX-011 purity (no I/O) |

Existing: `packages/core/src/services/graphics/graphics.test.ts`.

---

## 10. Non-Goals (v1)

- Full Kitty animation protocol
- Video
- GPU rendering
- External native image pipelines (sharp) as hard dependency

---

## 11. Related

- `TERMINAL_CAPABILITIES_SPEC.md`, `RENDERER_SPEC.md`, `BUN_CAPABILITY_MATRIX.md`
- FEAT-CORE-007, SUB-CORE-008..012
