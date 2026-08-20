# Task 4: Typed-Array Cell Buffer

## Goal
Replace the `Cell[][]` (heap-allocated objects) with a flat typed-array-backed buffer to eliminate GC pressure and improve cache locality.

## Current State
- `Cell` is a plain interface: `{ char: string, style: Option<AnsiStyle>, painted: boolean, scrim?: boolean, wide?: boolean }`
- `ScreenBuffer` stores a 2D `Cell[][]` array
- A 200×60 terminal = 12,000 cells × 2 buffers = **24,000 heap objects per frame**
- The `Cell` interface and `ScreenBuffer` class are **fully private** to `renderer.ts`
- **~75 internal sites** need modification, all in **1 file**
- Zero downstream consumers touch Cell objects directly

## Design

### Packed Cell Layout (16 bytes per cell)

```
┌─────────────────────────────────────────────────────────────┐
│ Byte 0-3: charIndex (Uint32) — index into string pool       │
│ Byte 4-7: fgPacked (Uint32) — packColor() result            │
│ Byte 8-11: bgPacked (Uint32) — packColor() result           │
│ Byte 12: flags (Uint8) — painted|scrim|wide|dirty           │
│ Byte 13: decorations (Uint8) — bold|faint|italic|underline… │
│ Byte 14-15: reserved (Uint16) — future use                  │
└─────────────────────────────────────────────────────────────┘
```

**Total: 16 bytes per cell** (4 cells per 64-byte cache line, matching FrankenTUI)

### String Pool
Characters can't be stored inline in a typed array. Use a deduplicated string pool:
- Index 0 = ' ' (space, default)
- Index 1-127 = ASCII characters (direct mapping)
- Index 128+ = dynamic pool for Unicode/emoji graphemes (Map<string, number>)
- Pool is per-buffer, cleared on `clear()`

### Buffer Backing
```typescript
class PackedScreenBuffer {
  readonly width: number
  readonly height: number
  private data: DataView          // 16 bytes × width × height
  private buffer: ArrayBuffer     // backing store
  private dirtyRows: Uint8Array   // 1 byte per row
  private stringPool: string[]    // char index → string
  private stringMap: Map<string, number>  // string → char index
  
  // Cell access: O(1) computed offset
  private offset(x: number, y: number): number {
    return (y * this.width + x) * 16
  }
}
```

### Style Representation
Instead of `Option<AnsiStyle>` (heap object), store:
- `fgPacked` and `bgPacked` as the Uint32 from `packColor()` (already implemented)
- `decorations` as the Uint8 from `packDecorations()` (already implemented)
- "No style" = fg=0, bg=0, dec=0 (all zeros)

### DiffPatch Changes
Instead of `ReadonlyArray<Cell>`, use a lightweight struct:
```typescript
interface DiffPatch {
  readonly x: number
  readonly y: number
  readonly length: number  // cell count
  // Data read directly from the back buffer during applyPatches
}
```

## Execution Steps

### Phase 1: String Pool (standalone, testable)
1. Create `StringPool` class with `intern(char): number`, `get(index): string`, `clear()`
2. Pre-populate ASCII (indices 0-127)
3. Write unit tests for pool operations
4. Verify no allocations on ASCII-only content

### Phase 2: PackedScreenBuffer (replaces ScreenBuffer)
1. Create `PackedScreenBuffer` class with ArrayBuffer backing
2. Implement `getChar(x, y)`, `setCell(x, y, char, fg, bg, dec, flags)`
3. Implement `clear()` — `buffer.fill(0)` + reset pool
4. Implement `isRowDirty()`, `markRowDirty()`, `hasAnyDirtyRow()` — already Uint8Array
5. Port `writeText()` — intern chars into pool, pack style into words
6. Port `composite()` — memcpy ranges when possible, cell-by-cell for transparent
7. Port `fillScrim()` — set flag bit on all cells
8. Write unit tests for each method

### Phase 3: Optimized Diff
1. Implement `diff()` using the packed format:
   - Compare 16 bytes at a time (single equality check on two Uint32 views)
   - Skip rows via dirty bitmap (already done)
   - Coalesce runs (already done)
2. For SIMD-like comparison: compare 4 cells at once using BigInt64Array or manual 4-word compare
3. Port `detectScroll()` — row-level comparison via typed-array slice equality

### Phase 4: applyPatches with Packed Data
1. Read char/style from back buffer directly during patch emission
2. Use pool to resolve charIndex → string for output
3. Maintain `currentStyle` tracking using packed fg/bg/dec (numeric comparison)
4. Emit SGR transitions using `computeStyleTransition` (already works with packed values)

### Phase 5: Swap and Test
1. Rename `ScreenBuffer` → `LegacyScreenBuffer`, create new `ScreenBuffer = PackedScreenBuffer`
2. Run all 1508 tests — ensure behavioral equivalence
3. Benchmark: compare frame time, GC pressure, memory usage
4. Remove `LegacyScreenBuffer` once validated

## Risk Mitigation
- The entire change is **internal to one file** — no API changes
- Keep `LegacyScreenBuffer` until all tests pass on the new implementation
- The `DiffPatch` interface changes are internal to the file
- `dimCell()` and `scaleColor()` need adaptation (operate on packed values)

## Expected Impact
- **GC**: 0 allocations per frame (vs 12,000+ objects currently)
- **Memory**: 16 bytes/cell × 12,000 = 192KB fixed (vs ~500KB+ with object overhead)
- **Cache**: Sequential scan hits L1 (4 cells/line vs unpredictable object layout)
- **Diff**: 4x fewer memory accesses (compare 4 cells per cache line load)

## Estimated Effort: 4-6 hours
- Phase 1: 30 min
- Phase 2: 2 hours
- Phase 3: 1 hour
- Phase 4: 30 min
- Phase 5: 1-2 hours (debugging edge cases)
