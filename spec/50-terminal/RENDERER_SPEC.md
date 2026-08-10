# Renderer Spec

*Pod E: Terminal/Platform/Bun — WS5*  
**Status:** Complete  
**Impl:** `packages/core/src/services/live/renderer.ts`, RendererService tag, `@tuix/view`, `@tuix/ansi`

---

## 1. Purpose

Define how a `View` becomes terminal output: layout consumption, cell grid, ANSI styling, diff/full redraw strategies, and interaction with graphics regions.

---

## 2. Pipeline

```
view(model) → View tree
     → layout/measure (@tuix/view)
     → cell buffer (width × height)
     → style encode (@tuix/ansi)
     → optional graphics payloads (@tuix/core graphics)
     → RendererService
     → TerminalService.write
```

### REQ-RND-001

RendererService is the only product path from View to bytes (DEC-003). Components do not write stdout.

---

## 3. Responsibilities

### REQ-RND-010: RendererService

| Method (conceptual) | Behavior |
|---------------------|----------|
| render(view) | Full or differential paint |
| clear | Clear screen / buffer |
| resize(w,h) | Reallocate buffers |
| setCursor / hide | Delegate to terminal |

### REQ-RND-011: Color degradation

Use `TerminalCapabilities.colors` to map truecolor → 256 → basic → none. Never emit truecolor sequences when caps say otherwise.

### REQ-RND-012: Unicode width

Measure display width for CJK/emoji consistently (view + renderer agree). Soft wrap / clip policy: clip with ellipsis optional at UI layer.

---

## 4. Diff vs Full Frame

### REQ-RND-020

- Default: diff previous cell buffer vs next; emit minimal cursor moves + runs.
- Full redraw: first frame, resize, `debug` force, or corruption recovery.
- Cursor parked after frame (hidden in fullscreen TUI).

**AC:** Diff never leaves stale cells when buffer size changes (resize implies full redraw).

---

## 5. Graphics Regions

### REQ-RND-030

When View marks an image region:
1. Query caps → `encodeGraphics`
2. If `fallback: true`, render cell/ASCII placeholder from view
3. Else write protocol payload at region origin via TerminalService

Protocol priority owned by capabilities/graphics, not renderer heuristics.

---

## 6. Alternate Screen & Modes

### REQ-RND-040

Fullscreen runtime:
- enter alt screen before first render
- hide cursor during loop
- on exit: show cursor, leave alt screen, reset styles (`ESC[0m`)

Non-fullscreen CLI (`exitAfterRender`): may render inline without alt screen when config `fullscreen: false`.

---

## 7. Error Handling

### REQ-RND-050

Write failures → TerminalError → runtime onError. Partial frames: prefer full redraw next tick over leaving mixed state.

---

## 8. Performance

### REQ-RND-060

- Target render path <16ms (PERFORMANCE_SLO) for typical frames.
- Avoid re-allocating buffers every frame when size stable.
- Style run-length encoding preferred over per-cell full resets.

---

## 9. Testing

| REQ | TC |
|-----|-----|
| REQ-RND-001 | TC-RND-001 no direct write in components |
| REQ-RND-011 | TC-RND-011 color degrade |
| REQ-RND-020 | TC-RND-020 diff correctness |
| REQ-RND-030 | TC-RND-030 graphics fallback |
| REQ-RND-040 | TC-RND-040 teardown sequences |

Use mock TerminalService capturing writes.

---

## 10. Related

- `TERMINAL_CAPABILITIES_SPEC.md`, `GRAPHICS_SPEC.md`
- `@tuix/ansi`, `@tuix/view`
