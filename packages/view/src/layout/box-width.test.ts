import { describe, expect, test } from 'bun:test'
import { Effect } from 'effect'
import { styledBox } from './box'
import { text } from '../primitives/view'
import { stripAnsi, style, border as borderPresets } from '@tuix/ansi'

async function render(view: any, context?: { width: number; height: number }) {
  const out = await Effect.runPromise(view.render(context))
  return typeof out === 'string' ? out : out.content
}

describe('styledBox width resolution', () => {
  test('numeric width caps content to the target', async () => {
    const box = styledBox(text('abcdefghijklmnop'), {
      border: borderPresets.thin,
      style: style({ width: 10 }),
    })
    const out = await render(box)
    const lines = out.split('\n')
    const plain = lines.map(l => stripAnsi(l))
    expect(plain[0]!.length).toBe(10)
    expect(plain[1]!.length).toBe(10)
  })

  test('fill width resolves against context', async () => {
    const box = styledBox(text('hi'), {
      border: borderPresets.rounded,
      style: style({ width: 'fill' as never }),
    })
    const out = await render(box, { width: 20, height: 5 })
    const lines = out.split('\n')
    const plain = lines.map(l => stripAnsi(l))
    expect(plain[0]!.length).toBe(20)
  })

  test('50% width resolves against context', async () => {
    const box = styledBox(text('hi'), {
      border: borderPresets.rounded,
      style: style({ width: '50%' as never }),
    })
    const out = await render(box, { width: 20, height: 5 })
    const lines = out.split('\n')
    const plain = lines.map(l => stripAnsi(l))
    expect(plain[0]!.length).toBe(10)
  })

  test('fill height produces a box that fills the context height', async () => {
    const box = styledBox([text('top'), text('bot')], {
      border: borderPresets.thin,
      style: style({ height: 'fill' as never }),
    })
    const out = await render(box, { width: 10, height: 8 })
    const lines = out.split('\n')
    const plain = lines.map(l => stripAnsi(l))
    // Total height = 8 (fill resolves to context height)
    expect(lines.length).toBe(8)
    // Both items render inside the border
    const allContent = plain.join('\n')
    expect(allContent.includes('top')).toBe(true)
    expect(allContent.includes('bot')).toBe(true)
  })
})
