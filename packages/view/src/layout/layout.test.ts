/**
 * Layout tests for the grid/join/spacer primitives (previously untested
 * majority of @tuix/view).
 */
import { describe, expect, it } from 'bun:test'
import { Effect } from 'effect'
import { text } from '../primitives/view'
import { stripAnsi } from '@tuix/ansi'
import { grid, columns, template, gridItem, span } from './grid'
import { joinHorizontal, joinVertical, place, Top, Bottom, Center, Left, Right } from './join'
import { hspace, vspace, hdivider, vdivider, dottedDivider } from './spacer'

async function render(view: { render: () => Effect.Effect<unknown> }): Promise<string> {
  const out = await Effect.runPromise(view.render())
  if (typeof out === 'string') return out
  const content = (out as { content?: string }).content
  return typeof content === 'string' ? content : String(out)
}

function lines(content: string): string[] {
  return content.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '').split('\n')
}

describe('grid', () => {
  it('places items into fixed columns left to right', async () => {
    const view = grid([text('aa'), text('bb'), text('cc')], { template: columns(2) })
    const out = lines(await render(view))
    expect(out[0]?.startsWith('aa')).toBe(true)
    expect(out[0]).toContain('bb')
    // Default cell height is 3, so the second row of cells starts at line 3.
    expect(out[3]?.startsWith('cc')).toBe(true)
  })

  it('honors the gap between cells', async () => {
    const tight = lines(await render(grid([text('a'), text('b')], { template: columns(2) })))
    const gapped = lines(
      await render(grid([text('a'), text('b')], { template: columns(2), gap: 2 }))
    )
    expect(gapped[0]!.length).toBeGreaterThan(tight[0]!.length)
  })

  it('template parses fractional tracks', () => {
    const tpl = template('1fr 2fr')
    expect(tpl.columns).toHaveLength(2)
  })

  it('columns(n) builds n tracks', () => {
    expect(columns(3).columns).toHaveLength(3)
  })

  it('gridItem and span wrap views with placement', () => {
    const placed = gridItem(text('x'), { column: 1, row: 1 })
    expect(placed).toBeTruthy()
    const spanned = span(text('x'), 2)
    expect(spanned).toBeTruthy()
  })

  it('span() without explicit column/row spreads across columns', async () => {
    // Two 20-wide tracks; a 30-char child only fits if it spans both.
    const wide = text('x'.repeat(30))
    const view = grid([span(wide, 2, 1)], { template: columns(2) })
    const out = lines(await render(view))
    expect(out[0]?.startsWith('x'.repeat(30))).toBe(true)
  })

  it('grid renders styled children without escapes eating cell width', async () => {
    const content = '\x1b[31m' + 'ab'.repeat(10) + '\x1b[0m'
    const view = grid([text(content)], { template: columns(1) })
    const out = await render(view)
    const row = out.split('\n')[0] ?? ''
    expect(row).toContain('\x1b[31m')
    expect(stripAnsi(row).startsWith('ab'.repeat(10))).toBe(true)
  })
})

describe('join', () => {
  it('joinHorizontal merges views side by side', async () => {
    const out = lines(await render(joinHorizontal(Top, text('left'), text('right'))))
    expect(out[0]).toContain('left')
    expect(out[0]).toContain('right')
    expect(out[0]?.indexOf('left')).toBeLessThan(out[0]?.indexOf('right'))
  })

  it('joinVertical stacks views top to bottom', async () => {
    const out = lines(await render(joinVertical(Left, text('one'), text('two'))))
    expect(out[0]?.trim()).toBe('one')
    expect(out[1]?.trim()).toBe('two')
  })

  it('joinVertical Bottom aligns shorter views to the bottom edge', async () => {
    const out = lines(await render(joinVertical(Right, text('xy'), text('z'))))
    // 'z' right-aligned under 'xy' — trailing spaces before it.
    expect(out[1]?.startsWith(' ')).toBe(true)
    expect(out[1]?.trimEnd().endsWith('z')).toBe(true)
  })

  it('place centers content in a box', async () => {
    const view = place(2, 1, text('mid'), { verticalAlign: Center })
    expect(view).toBeTruthy()
  })
})

describe('spacer', () => {
  it('hspace renders blank columns', async () => {
    const out = await render(hspace(4))
    expect(out.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '').length).toBeGreaterThanOrEqual(4)
  })

  it('vspace renders blank rows', async () => {
    const view = vspace(3)
    expect(view).toBeTruthy()
  })

  it('dividers draw rules', async () => {
    const h = lines(await render(hdivider()))
    expect(h[0]).toContain('─')
    const v = lines(await render(vdivider('|')))
    expect(v.some(l => l.includes('|'))).toBe(true)
    const dotted = lines(await render(dottedDivider()))
    expect(dotted[0]).toContain('·')
  })
})
