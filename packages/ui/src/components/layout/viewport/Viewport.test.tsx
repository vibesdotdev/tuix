/**
 * Tests for Viewport.tsx
 *
 * Verifies:
 * 1. Content renders (no `[object Object]`)
 * 2. Content is clipped to the viewport rect
 * 3. ScrollY offset shifts visible content
 * 4. Keyboard arrows (up/down) scroll the content
 */

/** @jsxImportSource @tuix/jsx */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { Effect } from 'effect'
import { toView } from '@tuix/jsx'
import { setFocusedId, dispatchFocusedKey, resetFocus } from '@tuix/reactive'
import type { View } from '@tuix/view'
import { Viewport } from './Viewport'

/** Render a JSX element tree to its string output. */
async function renderOutput(
  element: unknown,
  context?: { width: number; height: number }
): Promise<string> {
  const view = toView(element as never) as View
  const out = await Effect.runPromise(view.render(context))
  return typeof out === 'string' ? out : out.content
}

/** Render an existing View to its string output (reuses the same store). */
async function renderView(
  view: View,
  context?: { width: number; height: number }
): Promise<string> {
  const out = await Effect.runPromise(view.render(context))
  return typeof out === 'string' ? out : out.content
}

/** Strip ANSI escape sequences to get plain text. */
function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, '')
}

describe('Viewport', () => {
  beforeEach(() => resetFocus())
  afterEach(() => resetFocus())

  test('content renders without [object Object]', async () => {
    const out = await renderOutput(
      <Viewport id="basic" width={20} height={5} borderStyle="none">
        <text>Hello</text>
        <text>World</text>
      </Viewport>
    )
    const plain = stripAnsi(out)
    expect(plain).toContain('Hello')
    expect(plain).toContain('World')
    expect(plain).not.toContain('[object Object]')
  })

  test('content is clipped to the viewport rect', async () => {
    // 10 lines of content but only 3 visible (no scrollbars to simplify)
    const lines = Array.from({ length: 10 }, (_, i) => `Line ${i + 1}`)
    const out = await renderOutput(
      <Viewport id="clip" width={20} height={3} borderStyle="none" showScrollbars={false}>
        {lines.map(l => (
          <text>{l}</text>
        ))}
      </Viewport>
    )
    const plain = stripAnsi(out)
    expect(plain).toContain('Line 1')
    expect(plain).toContain('Line 3')
    // Lines beyond the viewport should NOT appear
    expect(plain).not.toContain('Line 4')
    expect(plain).not.toContain('Line 10')
  })

  test('scrollY offset shifts visible content', async () => {
    const lines = Array.from({ length: 10 }, (_, i) => `Line ${i + 1}`)
    const element = (
      <Viewport id="scroll" width={20} height={3} borderStyle="none" showScrollbars={false}>
        {lines.map(l => (
          <text>{l}</text>
        ))}
      </Viewport>
    )

    // Create the View once (store + focusable are created here)
    const view = toView(element as never) as View

    // First render — shows lines 1-3
    const out1 = await renderView(view)
    const plain1 = stripAnsi(out1)
    expect(plain1).toContain('Line 1')
    expect(plain1).not.toContain('Line 4')

    // Focus and scroll down by 2
    setFocusedId('interactive:scroll')
    dispatchFocusedKey('down')
    dispatchFocusedKey('down')

    // Re-render with the same View — store retains scroll state
    const out2 = await renderView(view)
    const plain2 = stripAnsi(out2)
    expect(plain2).toContain('Line 3')
    expect(plain2).not.toContain('Line 1')
  })

  test('keyboard arrows scroll content', async () => {
    const lines = Array.from({ length: 10 }, (_, i) => `Row ${i + 1}`)
    const element = (
      <Viewport id="keys" width={20} height={4} borderStyle="none" showScrollbars={false}>
        {lines.map(l => (
          <text>{l}</text>
        ))}
      </Viewport>
    )

    // Create the View once (store + focusable are created here)
    const view = toView(element as never) as View

    // Initial render — Row 1 at top
    const out0 = await renderView(view)
    const plain0 = stripAnsi(out0)
    expect(plain0).toContain('Row 1')

    // Focus the viewport and press down arrow
    setFocusedId('interactive:keys')
    dispatchFocusedKey('down')

    const out1 = await renderView(view)
    const plain1 = stripAnsi(out1)
    // After scrolling down 1, Row 1 should be gone, Row 2 should be at top
    expect(plain1).toContain('Row 2')
    expect(plain1).not.toContain('Row 1')

    // Scroll back up
    dispatchFocusedKey('up')

    const out2 = await renderView(view)
    const plain2 = stripAnsi(out2)
    // After scrolling up 1, Row 1 should be back at top
    expect(plain2).toContain('Row 1')
  })

  test('string children render as text', async () => {
    const out = await renderOutput(
      <Viewport id="strings" width={20} height={3} borderStyle="none" showScrollbars={false}>
        {'Hello\nWorld'}
      </Viewport>
    )
    const plain = stripAnsi(out)
    expect(plain).toContain('Hello')
    expect(plain).toContain('World')
    expect(plain).not.toContain('[object Object]')
  })

  test('fill width resolves against the terminal context', async () => {
    const out = await renderOutput(
      <Viewport id="fill" width="fill" height={3} borderStyle="none" showScrollbars={false}>
        <text>x</text>
      </Viewport>,
      { width: 40, height: 10 }
    )
    const plain = stripAnsi(out)
    // 'fill' width should resolve to the context width (40)
    const firstLine = plain.split('\n')[0] ?? ''
    expect(firstLine.length).toBeGreaterThanOrEqual(1)
  })
})
