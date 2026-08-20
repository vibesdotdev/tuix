/**
 * Renderer drive-path performance benchmark + allocation guard.
 *
 * The typed-array renderer packs each cell into 4 Uint32 words, so the hot
 * path (write → composite(non-scrim) → diff → applyPatches) must never
 * allocate a per-cell Cell object. `ScreenBuffer.cellAt()` is the ONLY
 * per-cell heap path and is exercised solely by the scrim (dim) path.
 *
 * This suite:
 *   - benchmarks a 200×60 churn workload (frame, diff, composite)
 *   - guards that the non-scrim drive path performs ZERO Cell allocations
 *   - reports the Cell allocation count for a scrim workload (informational)
 */

import { describe, it, expect } from 'bun:test'
import { ScreenBuffer } from './renderer'

const WIDTH = 200
const HEIGHT = 60

/** Paint a full frame of varied content so diff drives real churn. */
function churn(back: ScreenBuffer, frame: number): void {
  for (let y = 0; y < HEIGHT; y++) {
    const text = `frame=${frame} row=${y} `.padEnd(WIDTH - 1, '·')
    back.writeText(0, y, text)
  }
  // Move a band of solid rows per frame to force genuinely changed cells.
  const bandStart = (frame * 7) % HEIGHT
  for (let y = bandStart; y < Math.min(bandStart + 5, HEIGHT); y++) {
    back.writeText(0, y, `${'#'.repeat(WIDTH)}`)
  }
}

/** Minimal self-contained timing harness (mirrors @tuix/testing::benchmarkSync). */
function timeIt(label: string, fn: () => void, iterations = 100): number {
  // Warmup
  for (let i = 0; i < 10; i++) fn()
  const start = performance.now()
  for (let i = 0; i < iterations; i++) fn()
  const total = performance.now() - start
  const mean = total / iterations
  // eslint-disable-next-line no-console
  console.log(`  ${label}: ${mean.toFixed(3)}ms/op (${iterations} iters)`)
  return mean
}

describe('renderer drive path — allocation guard', () => {
  it('non-scrim churn: zero per-cell Cell allocations', () => {
    const back = new ScreenBuffer(WIDTH, HEIGHT)
    const front = new ScreenBuffer(WIDTH, HEIGHT)

    ScreenBuffer.resetCellAllocs()
    for (let frame = 0; frame < 20; frame++) {
      churn(front, frame)
      back.diff(front)
      back.composite(front, 0, 0, false)
    }

    expect(ScreenBuffer.cellAllocationCount).toBe(0)
  })

  it('non-scrim composite copies without allocating Cells', () => {
    const back = new ScreenBuffer(80, 24)
    const overlay = new ScreenBuffer(80, 24)
    overlay.writeText(0, 0, 'Hello, world!')

    ScreenBuffer.resetCellAllocs()
    back.composite(overlay, 0, 0, false)
    expect(ScreenBuffer.cellAllocationCount).toBe(0)
  })

  it('scrim path allocates (informational — only on flagged cells)', () => {
    const back = new ScreenBuffer(WIDTH, HEIGHT)
    back.writeText(0, 0, 'baseline')
    const overlay = new ScreenBuffer(WIDTH, HEIGHT)
    overlay.writeText(0, 0, 'scrim under a flag')

    // Force scrim flags (bit 2) on the overlay cells.
    const data = overlay as unknown as { data: Uint32Array }
    for (let i = 0; i < WIDTH * HEIGHT; i += 1) {
      const idx = i * 4 + 3
      data.data[idx] = (data.data[idx] ?? 0) | 2
    }

    ScreenBuffer.resetCellAllocs()
    back.composite(overlay, 0, 0, true)
    expect(ScreenBuffer.cellAllocationCount).toBeGreaterThan(0)
  })
})

describe('renderer drive path — benchmarks (200×60 churn)', () => {
  it('reports timings', () => {
    timeIt('writeText full frame', () => {
      const front = new ScreenBuffer(WIDTH, HEIGHT)
      churn(front, 0)
    })

    timeIt('diff front↔back', () => {
      const back = new ScreenBuffer(WIDTH, HEIGHT)
      const front = new ScreenBuffer(WIDTH, HEIGHT)
      churn(front, 0)
      back.diff(front)
    })

    timeIt('composite non-scrim overlay', () => {
      const back = new ScreenBuffer(WIDTH, HEIGHT)
      const overlay = new ScreenBuffer(WIDTH, HEIGHT)
      churn(overlay, 0)
      back.composite(overlay, 0, 0, true)
    })

    timeIt('full drive frame churn+diff+composite', () => {
      const back = new ScreenBuffer(WIDTH, HEIGHT)
      const front = new ScreenBuffer(WIDTH, HEIGHT)
      churn(front, 0)
      back.diff(front)
      back.composite(front, 0, 0, false)
    })
  })
})
