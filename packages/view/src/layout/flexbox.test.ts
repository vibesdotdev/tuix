/**
 * Flexbox Layout Tests
 *
 * Tests for the flexbox layout system
 */

import { describe, it, expect } from 'bun:test'
import { Effect } from 'effect'
import { collectOverlays, markOverlay } from '@tuix/core/types'
import { flexbox } from './flexbox'
import { text } from '../primitives/view'
import { FlexDirection, JustifyContent, AlignItems, FlexWrap } from './types'

describe('Flexbox Layout', () => {
  describe('Direction', () => {
    it('should layout items in row direction', async () => {
      const items = [text('Item1'), text('Item2'), text('Item3')]

      const flex = flexbox(items, {
        direction: FlexDirection.Row,
      })

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const rendered = yield* flex.render()
          return rendered
        })
      )

      expect(result).toBe('Item1Item2Item3')
      expect(flex.width).toBe(15) // Sum of item widths
      expect(flex.height).toBe(1)
    })

    it('should layout items in column direction', async () => {
      const items = [text('Item1'), text('Item2'), text('Item3')]

      const flex = flexbox(items, {
        direction: FlexDirection.Column,
      })

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const rendered = yield* flex.render()
          return rendered
        })
      )

      expect(result).toBe('Item1\nItem2\nItem3')
      expect(flex.width).toBe(5) // Width of widest item
      expect(flex.height).toBe(3) // Sum of item heights
    })

    it('should layout items in row-reverse direction', async () => {
      const items = [text('First'), text('Second'), text('Third')]

      const flex = flexbox(items, {
        direction: FlexDirection.RowReverse,
      })

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const rendered = yield* flex.render()
          return rendered
        })
      )

      expect(result).toBe('ThirdSecondFirst')
    })

    it('should layout items in column-reverse direction', async () => {
      const items = [text('First'), text('Second'), text('Third')]

      const flex = flexbox(items, {
        direction: FlexDirection.ColumnReverse,
      })

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const rendered = yield* flex.render()
          return rendered
        })
      )

      expect(result).toBe('Third\nSecond\nFirst')
    })
  })

  describe('Justify Content', () => {
    it('should justify content to start', async () => {
      const items = [text('A'), text('B')]

      const flex = flexbox(items, {
        direction: FlexDirection.Row,
        justifyContent: JustifyContent.Start,
        width: 10,
      })

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const rendered = yield* flex.render()
          return rendered
        })
      )

      expect(result).toBe('AB        ') // Items at start, padding at end
      expect(flex.width).toBe(10)
    })

    it('should justify content to end', async () => {
      const items = [text('A'), text('B')]

      const flex = flexbox(items, {
        direction: FlexDirection.Row,
        justifyContent: JustifyContent.End,
        width: 10,
      })

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const rendered = yield* flex.render()
          return rendered
        })
      )

      expect(result).toBe('        AB') // Padding at start, items at end
    })

    it('should justify content to center', async () => {
      const items = [text('A'), text('B')]

      const flex = flexbox(items, {
        direction: FlexDirection.Row,
        justifyContent: JustifyContent.Center,
        width: 10,
      })

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const rendered = yield* flex.render()
          return rendered
        })
      )

      expect(result).toBe('    AB    ') // Equal padding on both sides
    })

    it('should space items evenly with space-between', async () => {
      const items = [text('A'), text('B'), text('C')]

      const flex = flexbox(items, {
        direction: FlexDirection.Row,
        justifyContent: JustifyContent.SpaceBetween,
        width: 10,
      })

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const rendered = yield* flex.render()
          return rendered
        })
      )

      expect(result).toBe('A   B    C') // Space between: first at start, last at end
    })

    it('should space items evenly with space-around', async () => {
      const items = [text('A'), text('B')]

      const flex = flexbox(items, {
        direction: FlexDirection.Row,
        justifyContent: JustifyContent.SpaceAround,
        width: 10,
      })

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const rendered = yield* flex.render()
          return rendered
        })
      )

      expect(result).toBe('  A    B  ') // Equal space around items
    })
  })

  describe('Align Items', () => {
    it('should align items to start', async () => {
      const items = [text('Short'), text('Much\nLonger\nContent')]

      const flex = flexbox(items, {
        direction: FlexDirection.Row,
        alignItems: AlignItems.Start,
      })

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const rendered = yield* flex.render()
          return rendered
        })
      )

      // Should align to top
      expect(flex.height).toBe(3)
      expect(result).toContain('Short')
      expect(result).toContain('Much')
    })

    it('should align items to end', async () => {
      const items = [text('Short'), text('Much\nLonger\nContent')]

      const flex = flexbox(items, {
        direction: FlexDirection.Row,
        alignItems: AlignItems.End,
      })

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const rendered = yield* flex.render()
          return rendered
        })
      )

      // Should align to bottom
      expect(flex.height).toBe(3)
    })

    it('should center align items', async () => {
      const items = [text('Short'), text('Much\nLonger\nContent')]

      const flex = flexbox(items, {
        direction: FlexDirection.Row,
        alignItems: AlignItems.Center,
      })

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const rendered = yield* flex.render()
          return rendered
        })
      )

      // Should center align vertically
      expect(flex.height).toBe(3)
    })
  })

  describe('Flex grow and shrink', () => {
    it('should grow items proportionally', async () => {
      const items = [text('A'), text('B'), text('C')]

      const flex = flexbox(
        [
          { view: items[0], grow: 1 },
          { view: items[1], grow: 2 },
          { view: items[2], grow: 1 },
        ],
        {
          direction: FlexDirection.Row,
          width: 12,
        }
      )

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const rendered = yield* flex.render()
          return rendered
        })
      )

      expect(flex.width).toBe(12)
      // Item B should get twice the space as A and C
    })

    it('should handle flex basis', async () => {
      const items = [text('A'), text('B')]

      const flex = flexbox(
        [
          { view: items[0], basis: 3 },
          { view: items[1], basis: 5 },
        ],
        {
          direction: FlexDirection.Row,
        }
      )

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const rendered = yield* flex.render()
          return rendered
        })
      )

      expect(flex.width).toBe(8) // 3 + 5
    })
  })

  describe('Gap', () => {
    it('should add gap between items', async () => {
      const items = [text('A'), text('B'), text('C')]

      const flex = flexbox(items, {
        direction: FlexDirection.Row,
        gap: 2,
      })

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const rendered = yield* flex.render()
          return rendered
        })
      )

      expect(flex.width).toBe(7) // 3 items (3 width) + 2 gaps (4 width)
      expect(result).toBe('A  B  C')
    })

    it('should add gap in column direction', async () => {
      const items = [text('A'), text('B')]

      const flex = flexbox(items, {
        direction: FlexDirection.Column,
        gap: 1,
      })

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const rendered = yield* flex.render()
          return rendered
        })
      )

      expect(flex.height).toBe(3) // 2 items + 1 gap
      expect(result).toBe('A\n \nB')
    })
  })

  describe('Wrapping', () => {
    it('should wrap items when they exceed container width', async () => {
      const items = Array.from({ length: 5 }, (_, i) => text(`Item${i}`))

      const flex = flexbox(items, {
        direction: FlexDirection.Row,
        wrap: FlexWrap.Wrap,
        width: 15, // Force wrapping
      })

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const rendered = yield* flex.render()
          return rendered
        })
      )

      expect(flex.height).toBeGreaterThan(1) // Should wrap to multiple lines
    })
  })

  describe('Empty and edge cases', () => {
    it('should handle empty item list', async () => {
      const flex = flexbox([], {
        direction: FlexDirection.Row,
      })

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const rendered = yield* flex.render()
          return rendered
        })
      )

      expect(flex.width).toBe(0)
      expect(flex.height).toBe(0)
      expect(result).toBe('')
    })

    it('should handle single item', async () => {
      const flex = flexbox([text('Single')], {
        direction: FlexDirection.Row,
      })

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const rendered = yield* flex.render()
          return rendered
        })
      )

      expect(result).toBe('Single')
    })
  })

  describe('Performance', () => {
    it('should handle many items efficiently', async () => {
      const items = Array.from({ length: 100 }, (_, i) => text(`Item${i}`))

      const flex = flexbox(items, {
        direction: FlexDirection.Column,
      })

      const startTime = performance.now()

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const rendered = yield* flex.render()
          return rendered
        })
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      expect(flex.height).toBe(100)
      expect(renderTime).toBeLessThan(500) // Should be reasonably fast
    })
  })

  describe('Overlay extraction', () => {
    it('keeps the workbench in flow and attaches the overlay', async () => {
      const flex = flexbox([text('sessions'), markOverlay(text('Command')), text('composer')], {
        direction: FlexDirection.Column,
        width: 20,
        height: 4,
      })
      const result = await Effect.runPromise(flex.render())
      const content = typeof result === 'string' ? result : String(result)
      expect(content).toContain('sessions')
      expect(content).toContain('composer')
      expect(content).not.toContain('Command')
      const overlays = collectOverlays(flex)
      expect(overlays).toHaveLength(1)
      expect(await Effect.runPromise(overlays[0]!.view.render())).toBe('Command')
    })
  })

  describe('ANSI framebuffer', () => {
    it('keeps truecolor half-blocks as visual cells, not CSI debris', async () => {
      const cell = '\x1b[38;2;16;185;129m\x1b[48;2;52;211;153m▀'
      const line = `${cell.repeat(12)}\x1b[0m`
      const flex = flexbox([text(line)], { direction: FlexDirection.Column })
      const result = await Effect.runPromise(flex.render())
      const content = typeof result === 'string' ? result : String(result)
      expect(content).toContain('\x1b[38;2;16;185;129m')
      expect(content).toContain('▀')
      expect([...content].filter(ch => ch === '▀')).toHaveLength(12)
      expect(flex.width).toBe(12)
    })
  })
})
