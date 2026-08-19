import { describe, expect, test } from 'bun:test'
import { Effect } from 'effect'
import { clipView } from './dynamic-layout'
import { text, vstack } from '../primitives/view'

async function render(view: any, context?: { width: number; height: number }) {
  const out = await Effect.runPromise(view.render(context))
  return typeof out === 'string' ? out : out.content
}

describe('clipView', () => {
  test('clips content to a rect', async () => {
    const content = vstack(
      text('line0'),
      text('line1'),
      text('line2'),
      text('line3'),
      text('line4')
    )
    const view = clipView(content, { width: 5, height: 3 })
    const out = await render(view, { width: 20, height: 10 })
    const lines = out.split('\n')
    expect(lines.length).toBe(3)
    expect(lines[0]).toContain('line0')
    expect(lines[1]).toContain('line1')
    expect(lines[2]).toContain('line2')
  })

  test('scrollY offsets the visible window', async () => {
    const content = vstack(text('aaa'), text('bbb'), text('ccc'), text('ddd'))
    const view = clipView(content, { width: 3, height: 2, scrollY: 2 })
    const out = await render(view, { width: 20, height: 10 })
    const lines = out.split('\n')
    expect(lines.length).toBe(2)
    expect(lines[0]).toContain('ccc')
    expect(lines[1]).toContain('ddd')
  })

  test('pads visible area to the rect height', async () => {
    const content = text('only one line')
    const view = clipView(content, { width: 5, height: 4 })
    const out = await render(view, { width: 20, height: 10 })
    const lines = out.split('\n')
    expect(lines.length).toBe(4)
    // First line has content; rest are padded
    expect(lines[0]!.length).toBeGreaterThan(0)
    expect(lines[3]!.trim().length).toBe(0)
  })

  test('fill width resolves against context', async () => {
    const content = text('hi')
    const view = clipView(content, { width: 'fill', height: 3 })
    const out = await render(view, { width: 20, height: 10 })
    const lines = out.split('\n')
    // Fill resolves to context width = 20
    expect(lines[0]!.length).toBe(20)
  })
})
