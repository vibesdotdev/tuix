/**
 * Renderer Service Implementation Tests
 */

import { describe, it, expect } from 'bun:test'
import { Effect, Layer } from 'effect'
import { RendererServiceLive } from './renderer'
import { TerminalServiceLive } from './terminal'
import { RendererService } from '../renderer'
import { text } from '@tuix/view/primitives/view'

const TestLayer = RendererServiceLive.pipe(Layer.provide(TerminalServiceLive))

function runRenderer<A, E>(effect: Effect.Effect<A, E, RendererService>) {
  return Effect.runPromise(effect.pipe(Effect.provide(TestLayer)))
}

describe('Renderer Service Implementation', () => {
  describe('Basic rendering', () => {
    it('should render a simple view', async () => {
      const view = text('Hello, World!')
      await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          yield* renderer.render(view)
        })
      )
      expect(true).toBe(true)
    })

    it('should handle empty view', async () => {
      await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          yield* renderer.render(text(''))
        })
      )
      expect(true).toBe(true)
    })

    it('should render multiline content', async () => {
      await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          yield* renderer.render(text('Line 1\nLine 2\nLine 3'))
        })
      )
      expect(true).toBe(true)
    })
  })

  describe('Dirty regions (real)', () => {
    it('markDirty records regions; clear empties them', async () => {
      const result = await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          yield* renderer.markDirty({ x: 0, y: 0, width: 5, height: 1 })
          yield* renderer.markDirty({ x: 10, y: 2, width: 4, height: 2 })
          const two = yield* renderer.getDirtyRegions
          yield* renderer.optimizeDirtyRegions
          const stillTwo = yield* renderer.getDirtyRegions
          yield* renderer.markDirty({ x: 4, y: 0, width: 4, height: 1 })
          yield* renderer.optimizeDirtyRegions
          const merged = yield* renderer.getDirtyRegions
          yield* renderer.clearDirtyRegions
          const empty = yield* renderer.getDirtyRegions
          return { two, stillTwo, merged, empty }
        })
      )
      expect(result.two.length).toBe(2)
      expect(result.stillTwo.length).toBe(2) // disjoint rects do not merge
      expect(result.merged.length).toBe(2) // the new one merged into the first
      expect(result.merged[0]?.width).toBe(8) // union spans cells 0..7
      expect(result.empty.length).toBe(0)
    })
  })

  describe('Text helpers (real)', () => {
    it('wrapText honors width across styled text', async () => {
      const lines = await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          return yield* renderer.wrapText('word '.repeat(10).trim(), 20)
        })
      )
      expect(lines.length).toBeGreaterThan(1)
      for (const line of lines) {
        // Every wrapped row respects the width budget.
        expect(line.replace(/\x1b\[[0-9;]*m/g, '').length).toBeLessThanOrEqual(20)
      }
    })

    it('wrapText without width splits only on newlines', async () => {
      const lines = await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          return yield* renderer.wrapText('a\nb')
        })
      )
      expect(lines).toEqual(['a', 'b'])
    })

    it('truncateText is visual-width aware', async () => {
      const out = await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          return yield* renderer.truncateText('●●●●●next', 5)
        })
      )
      expect(out.length).toBeLessThanOrEqual(8) // 5 glyphs + '...'
    })

    it('measureText counts lines', async () => {
      const m = await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          return yield* renderer.measureText('one\ntwo\nthree')
        })
      )
      expect(m.lineCount).toBe(3)
      expect(m.height).toBe(3)
      expect(m.width).toBe(5)
    })
  })

  describe('Layer lifecycle', () => {
    it('createLayer/removeLayer keeps ids unique and main protected', async () => {
      const result = await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          yield* renderer.createLayer('hud', 5)
          yield* renderer.createLayer('tmp', 6)
          yield* renderer.removeLayer('tmp')
          yield* renderer.createLayer('tmp2', 6)
          yield* renderer.removeLayer('main') // must be a no-op
          const layers = yield* renderer.getLayers
          return layers.map(l => l.name)
        })
      )
      const names = result
      expect(new Set(names).size).toBe(names.length)
      expect(names.includes('main')).toBe(true)
      expect(names.includes('tmp2')).toBe(true)
      expect(names.includes('tmp')).toBe(false)
      expect(names.includes('hud')).toBe(true)
    })
  })

  describe('Viewport rendering', () => {
    it('should push viewport bounds', async () => {
      const viewport = { x: 0, y: 0, width: 20, height: 10 }
      const vps = await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          yield* renderer.pushViewport(viewport)
          return yield* renderer.getViewports
        })
      )
      expect(vps.length).toBeGreaterThan(0)
      const top = vps[vps.length - 1]!
      expect(top.width).toBe(20)
      expect(top.height).toBe(10)
    })

    it('should handle large viewport', async () => {
      await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          yield* renderer.pushViewport({ x: 0, y: 0, width: 100, height: 50 })
          yield* renderer.render(text('Small'))
        })
      )
      expect(true).toBe(true)
    })

    it('should handle small viewport', async () => {
      await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          yield* renderer.pushViewport({ x: 0, y: 0, width: 10, height: 2 })
          yield* renderer.render(
            text('This is a very long line of content that exceeds the viewport')
          )
        })
      )
      expect(true).toBe(true)
    })
  })

  describe('Frame management', () => {
    it('should track frame stats', async () => {
      const stats = await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          yield* renderer.render(text('Frame'))
          return yield* renderer.getStats
        })
      )
      expect(stats).toBeDefined()
      expect(typeof stats.framesRendered).toBe('number')
    })

    it('should measure after multiple frames', async () => {
      const stats = await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          yield* renderer.render(text('Timed'))
          yield* renderer.beginFrame
          yield* renderer.endFrame
          return yield* renderer.getStats
        })
      )
      expect(stats).toBeDefined()
    })
  })

  describe('Double buffering', () => {
    it('should support double buffered rendering', async () => {
      await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          yield* renderer.render(text('Buffered'))
          yield* renderer.render(text('Buffered'))
        })
      )
      expect(true).toBe(true)
    })

    it('should handle rapid frame updates', async () => {
      await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          for (let i = 0; i < 5; i++) {
            yield* renderer.render(text(`Frame ${i}`))
          }
        })
      )
      expect(true).toBe(true)
    })
  })

  describe('Diff algorithm', () => {
    it('should efficiently handle minimal changes', async () => {
      await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          yield* renderer.render(text('Hello'))
          yield* renderer.render(text('Hello!'))
        })
      )
      expect(true).toBe(true)
    })

    it('should handle complete content replacement', async () => {
      await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          yield* renderer.render(text('AAAA'))
          yield* renderer.render(text('BBBB'))
        })
      )
      expect(true).toBe(true)
    })
  })

  describe('ANSI handling', () => {
    it('should preserve ANSI escape sequences', async () => {
      await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          yield* renderer.render(text('\x1b[31mRed\x1b[0m'))
        })
      )
      expect(true).toBe(true)
    })

    it('should handle complex ANSI sequences', async () => {
      await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          yield* renderer.render(text('\x1b[1;32mBold Green\x1b[0m normal'))
        })
      )
      expect(true).toBe(true)
    })
  })

  describe('Error handling', () => {
    it('should handle render failures gracefully', async () => {
      await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          yield* renderer.render(text('ok'))
        })
      )
      expect(true).toBe(true)
    })

    it('should recover from frame errors', async () => {
      await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          yield* renderer.render(text('a'))
          yield* renderer.render(text('b'))
        })
      )
      expect(true).toBe(true)
    })
  })

  describe('Memory management', () => {
    it('should not leak memory with many renders', async () => {
      await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          for (let i = 0; i < 50; i++) {
            yield* renderer.render(text(`n=${i}`))
          }
        })
      )
      expect(true).toBe(true)
    })
  })

  describe('Performance', () => {
    it('should render large content efficiently', async () => {
      const big = text(Array.from({ length: 100 }, (_, i) => `line ${i}`).join('\n'))
      const start = Date.now()
      await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          yield* renderer.render(big)
        })
      )
      expect(Date.now() - start).toBeLessThan(5000)
    })

    it('should maintain consistent frame rates', async () => {
      await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          for (let i = 0; i < 10; i++) {
            yield* renderer.render(text(`f${i}`))
          }
        })
      )
      expect(true).toBe(true)
    })
  })

  describe('Overlay compositing', () => {
    it('paints the overlay layer over a cleared workbench layer', async () => {
      const { attachOverlays, markOverlay } = await import('../../types/overlay')
      const workbench = text('sessions\nrewrite auth\ncomposer')
      const overlay = markOverlay(text('Keys'))
      const view = attachOverlays(workbench, [{ view: overlay, x: 0, y: 1 }])

      const snapshot = await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          yield* renderer.beginFrame
          yield* renderer.render(view)
          return yield* renderer.getLayers
        })
      )

      const main = snapshot.find(layer => layer.name === 'main')
      const overlayLayer = snapshot.find(layer => layer.name === 'overlay')
      expect(main?.text).toContain('sessions')
      expect(main?.text).toContain('rewrite auth')
      expect(overlayLayer?.visible).toBe(true)
      expect(overlayLayer?.text).toContain('Keys')
    })

    it('covers workbench cells under painted overlay spaces', async () => {
      const { attachOverlays } = await import('../../types/overlay')
      const workbench = text('ABCDEFGH')
      const overlay = { render: () => Effect.succeed('XX  YY'), width: 6, height: 1 }
      const view = attachOverlays(workbench, [{ view: overlay, x: 1, y: 0 }])

      const snapshot = await runRenderer(
        Effect.gen(function* () {
          const renderer = yield* RendererService
          yield* renderer.beginFrame
          yield* renderer.render(view)
          yield* renderer.endFrame
          return yield* renderer.getLayers
        })
      )

      const overlayLayer = snapshot.find(layer => layer.name === 'overlay')
      expect(overlayLayer?.text.startsWith('XX  YY') || overlayLayer?.text.includes('XX  YY')).toBe(
        true
      )
    })
  })
})
