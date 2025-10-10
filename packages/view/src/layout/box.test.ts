/**
 * Box Layout Tests
 *
 * Tests for the box layout system with borders and styling
 */

import { describe, it, expect } from 'bun:test'
import { Effect } from 'effect'
import { styledBox, panel } from './box'
import { text } from '../primitives/view'
import { Borders, BorderSide } from '@tuix/ansi'

describe('Box Layout', () => {
  describe('styledBox', () => {
    it('should create a box with rounded border', async () => {
      const content = text('Hello')
      const boxed = styledBox(content, { border: Borders.Rounded })

      const result = await Effect.runPromise(boxed.render())
      const resultStr = typeof result === 'string' ? result : result.content

      expect(resultStr).toContain('╭')
      expect(resultStr).toContain('╮')
      expect(resultStr).toContain('╰')
      expect(resultStr).toContain('╯')
      expect(resultStr).toContain('Hello')
      expect(boxed.width).toBe(7) // Content (5) + borders (2)
      expect(boxed.height).toBe(3) // Content (1) + borders (2)
    })

    it('should create a box with thick border', async () => {
      const content = text('Test')
      const boxed = styledBox(content, { border: Borders.Thick })

      const result = await Effect.runPromise(boxed.render())
      const resultStr = typeof result === 'string' ? result : result.content

      expect(resultStr).toContain('┏')
      expect(resultStr).toContain('┓')
      expect(resultStr).toContain('┗')
      expect(resultStr).toContain('┛')
      expect(resultStr).toContain('Test')
    })

    it('should create a box with double border', async () => {
      const content = text('Content')
      const boxed = styledBox(content, { border: Borders.Double })

      const result = await Effect.runPromise(boxed.render())
      const resultStr = typeof result === 'string' ? result : result.content

      expect(resultStr).toContain('╔')
      expect(resultStr).toContain('╗')
      expect(resultStr).toContain('╚')
      expect(resultStr).toContain('╝')
      expect(resultStr).toContain('Content')
    })

    it('should handle partial borders', async () => {
      const content = text('Partial')
      const boxed = styledBox(content, {
        border: Borders.Rounded,
        borderSides: BorderSide.Top | BorderSide.Bottom,
      })

      const result = await Effect.runPromise(boxed.render())
      const resultStr = typeof result === 'string' ? result : result.content

      // Should only have top and bottom borders
      expect(resultStr).toContain('─') // Top/bottom line
      expect(resultStr).not.toContain('│') // No side borders
    })

    it('should handle left and right borders only', async () => {
      const content = text('Sides')
      const boxed = styledBox(content, {
        border: Borders.Rounded,
        borderSides: BorderSide.Left | BorderSide.Right,
      })

      const result = await Effect.runPromise(boxed.render())
      const resultStr = typeof result === 'string' ? result : result.content

      expect(resultStr).toContain('│') // Side borders
      expect(resultStr).not.toContain('─') // No top/bottom borders
    })

    it('should create a box with padding', async () => {
      const content = text('Padded')
      const boxed = styledBox(content, {
        border: Borders.Rounded,
        padding: { top: 1, bottom: 1, left: 2, right: 2 },
      })

      const result = await Effect.runPromise(boxed.render())
      const resultStr = typeof result === 'string' ? result : result.content

      expect(boxed.width).toBe(12) // Content (6) + padding (4) + borders (2)
      expect(boxed.height).toBe(5) // Content (1) + padding (2) + borders (2)
      expect(resultStr).toContain('Padded')
    })

    it('should handle uniform padding', async () => {
      const content = text('Uniform')
      const boxed = styledBox(content, {
        border: Borders.Rounded,
        padding: 1,
      })

      const result = await Effect.runPromise(boxed.render())
      const resultStr = typeof result === 'string' ? result : result.content

      expect(boxed.width).toBe(11) // Content (7) + padding (2) + borders (2)
      expect(boxed.height).toBe(5) // Content (1) + top padding (1) + bottom padding (1) + borders (2)
    })

    it('should handle zero padding', async () => {
      const content = text('No padding')
      const boxed = styledBox(content, {
        border: Borders.Rounded,
        padding: 0,
      })

      const result = await Effect.runPromise(boxed.render())
      const resultStr = typeof result === 'string' ? result : result.content

      expect(boxed.width).toBe(12) // Content (10) + borders (2)
      expect(boxed.height).toBe(3) // Content (1) + borders (2)
    })
  })

  describe('Multiline content', () => {
    it('should handle multiline content in boxes', async () => {
      const content = text('Line 1\nLine 2\nLine 3')
      const boxed = styledBox(content, { border: Borders.Rounded })

      const result = await Effect.runPromise(boxed.render())
      const resultStr = typeof result === 'string' ? result : result.content

      expect(boxed.height).toBe(5) // Content (3) + borders (2)
      expect(boxed.width).toBe(8) // Longest line (6) + borders (2)
      expect(resultStr).toContain('Line 1')
      expect(resultStr).toContain('Line 2')
      expect(resultStr).toContain('Line 3')
    })

    it('should handle multiline content with varying widths', async () => {
      const content = text('Short\nVery long line\nMid')
      const boxed = styledBox(content, { border: Borders.Rounded })

      const result = await Effect.runPromise(boxed.render())
      const resultStr = typeof result === 'string' ? result : result.content

      expect(boxed.width).toBe(16) // Longest line (14) + borders (2)
      expect(resultStr).toContain('Very long line')
    })
  })

  describe('Empty content', () => {
    it('should handle empty content', async () => {
      const content = text('')
      const boxed = styledBox(content, { border: Borders.Rounded })

      const result = await Effect.runPromise(boxed.render())
      const resultStr = typeof result === 'string' ? result : result.content

      expect(boxed.width).toBe(2) // Just borders
      expect(boxed.height).toBe(3) // Empty line + borders
    })
  })

  describe('Nested boxes', () => {
    it('should handle nested boxes', async () => {
      const innerContent = text('Inner')
      const innerBox = styledBox(innerContent, { border: Borders.Thin })
      const outerBox = styledBox(innerBox, { border: Borders.Double })

      const result = await Effect.runPromise(outerBox.render())
      const resultStr = typeof result === 'string' ? result : result.content

      expect(resultStr).toContain('Inner')
      expect(resultStr).toContain('┌') // Inner box thin border
      expect(resultStr).toContain('╔') // Outer box double border
    })
  })

  describe('Error handling', () => {
    it('should handle borderSides without border', async () => {
      const content = text('Test')

      // Test with borderSides but no border
      const boxed = styledBox(content, { borderSides: BorderSide.All })

      const result = await Effect.runPromise(boxed.render())
      const resultStr = typeof result === 'string' ? result : result.content

      // Should still render the content without borders
      expect(resultStr).toContain('Test')
    })
  })

  describe('Performance', () => {
    it('should render large boxed content efficiently', async () => {
      const lines = Array.from({ length: 1000 }, (_, i) => `Line ${i}`).join('\n')
      const content = text(lines)
      const boxed = styledBox(content, { border: Borders.Rounded })

      const startTime = performance.now()
      const result = await Effect.runPromise(boxed.render())
      const endTime = performance.now()
      const renderTime = endTime - startTime

      expect(boxed.height).toBe(1002) // Content (1000) + borders (2)
      expect(renderTime).toBeLessThan(1000) // Should be fast
    })
  })
})
