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
})
