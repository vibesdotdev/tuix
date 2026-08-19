import { describe, expect, test } from 'bun:test'
import { Effect } from 'effect'

import { text, vstack, fillView, type RenderContext, type View } from './primitives/view'
import { resolveSize, resolveSize as resolveSizeTyped } from './primitives/types'
import { flexbox } from './layout/flexbox'
import { spacer } from './layout/spacer'

async function renderToString(view: View, context?: RenderContext): Promise<string> {
  const out = await Effect.runPromise(view.render(context))
  return typeof out === 'string' ? out : out.content
}

describe('resolveSize', () => {
  const ctx: RenderContext = { width: 100, height: 30 }

  test('numbers pass through', () => {
    expect(resolveSize(42, 'width', ctx, 10)).toBe(42)
    expect(resolveSize(undefined, 'height', ctx, 7)).toBe(7)
  })

  test("'fill' takes the context axis", () => {
    expect(resolveSize('fill', 'width', ctx, 10)).toBe(100)
    expect(resolveSize('fill', 'height', ctx, 10)).toBe(30)
  })

  test('percentages fraction the context', () => {
    expect(resolveSize('50%', 'width', ctx, 10)).toBe(50)
    expect(resolveSize('33%', 'height', ctx, 10)).toBe(10)
  })

  test('without context, falls back to natural', () => {
    expect(resolveSize('fill', 'width', undefined, 12)).toBe(12)
    expect(resolveSize('50%', 'width', undefined, 12)).toBe(12)
  })

  test('invalid percentages fall back to natural', () => {
    expect(resolveSizeTyped('50x%', 'width', ctx, 9)).toBe(9)
  })
})

describe('fillView', () => {
  test('pads lines to width and rows to height', async () => {
    const out = await renderToString(fillView(text('hi'), { width: 6, height: 3 }))
    const lines = out.split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toBe('hi    ')
  })

  test('paints background across the full rect including padding rows', async () => {
    const out = await renderToString(
      fillView(text('hi'), { width: 6, height: 3, background: '#0d3d2d' })
    )
    const lines = out.split('\n')
    expect(lines).toHaveLength(3)
    for (const line of lines) {
      expect(line.startsWith('\x1b[48;2;13;61;45m')).toBe(true)
      expect(line.endsWith('\x1b[0m')).toBe(true)
    }
  })

  test("'fill' resolves against the render context", async () => {
    const out = await renderToString(fillView(text('x'), { width: 'fill' }), {
      width: 10,
      height: 1,
    })
    expect(out).toBe('x         ')
  })

  test("'50%' resolves against the render context", async () => {
    const out = await renderToString(fillView(text('x'), { width: '50%' }), {
      width: 20,
      height: 1,
    })
    expect(out).toBe('x' + ' '.repeat(9))
  })

  test('reports numeric sizes as metadata, natural otherwise', () => {
    const sized = fillView(text('hi'), { width: 9, height: 2 })
    expect(sized.width).toBe(9)
    expect(sized.height).toBe(2)
    expect(fillView(text('hello\nworld')).width).toBe(5)
  })

  test('carries background metadata for layout parents', () => {
    expect(fillView(text('x'), { background: '#101010' }).background).toBe('#101010')
  })
})

describe('flexbox context sizing', () => {
  test("container width 'fill' takes the context", async () => {
    const view = flexbox([text('a'), text('b')], { width: 'fill', gap: 1 })
    const out = await renderToString(view, { width: 20, height: 1 })
    expect(out.replace(/\x1b\[[0-9;]*m/g, '').length).toBeGreaterThanOrEqual(20)
  })

  test("container width '50%' halves the context", async () => {
    const view = flexbox([text('a')], { width: '50%' })
    const out = await renderToString(view, { width: 20, height: 1 })
    expect(out).toBe('a' + ' '.repeat(9))
  })

  test('children receive their allocated rect as render context', async () => {
    const spy: View = {
      render: context => Effect.succeed(String(context ? context.width : -1)),
      width: 1,
    }
    const view = flexbox([spy, text('zzz')], { width: 10 })
    const out = await renderToString(view)
    // Row layout with fixed width 10: spy is 1 wide, zzz is 3 → spy got its
    // 1-cell allocation and printed it.
    expect(out.startsWith('1')).toBe(true)
  })

  test('container background fills the whole rect', async () => {
    const view = flexbox([text('hi')], { width: 8, height: 2, background: '#112233' })
    const out = await renderToString(view)
    const lines = out.split('\n')
    expect(lines).toHaveLength(2)
    for (const line of lines) {
      expect(line).toContain('48;2;17;34;51')
    }
    // trailing spaces on row 2 still carry the background prefix
    expect(lines[1]).toMatch(/48;2;17;34;51m +\x1b\[0m/)
  })

  test('child background fills the child rect beyond its ink', async () => {
    const filled = fillView(text('ok'), { background: '#445566' })
    const view = flexbox([filled, text('x')], { width: 12 })
    const out = await renderToString(view)
    // 'ok' is 2 wide of ink, but the bg prefix appears across the child's
    // run in the joined output
    expect(out).toContain('48;2;68;85;102')
  })

  test('spacer({flex}) participates in space distribution (regression)', async () => {
    const left = text('L')
    const right = text('R')
    const view = flexbox([left, spacer({ flex: 1 }), right], { width: 10 })
    const out = await renderToString(view)
    const plain = out.replace(/\x1b\[[0-9;]*m/g, '')
    expect(plain.startsWith('L')).toBe(true)
    expect(plain.endsWith('R')).toBe(true)
    expect(plain.length).toBe(10)
  })

  test('FlexItem grow from JSX-style metadata distributes remaining width', async () => {
    const grown: View = {
      render: context => Effect.succeed('G'.repeat(context ? context.width : 0)),
      width: 1,
    }
    const view = flexbox(
      [
        { view: grown, grow: 1 },
        { view: text('fix'), grow: 0 },
      ],
      {
        width: 10,
        gap: 0,
      }
    )
    const out = await renderToString(view)
    const plain = out.replace(/\x1b\[[0-9;]*m/g, '')
    expect(plain.startsWith('GGGGGGG')).toBe(true)
    expect(plain.trimEnd().endsWith('fix')).toBe(true)
  })
})

describe('vstack forwards context to children', () => {
  test('children can fill the forwarded context', async () => {
    const child = fillView(text('c'), { height: 'fill' })
    const view = vstack(text('top'), child)
    const out = await renderToString(view, { width: 5, height: 4 })
    // 'top' row + the child's 4 filled rows
    expect(out.split('\n')).toHaveLength(5)
  })
})
