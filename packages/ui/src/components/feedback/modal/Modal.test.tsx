/** @jsxImportSource @tuix/jsx */

import { describe, expect, test } from 'bun:test'
import { Effect } from 'effect'
import { collectOverlays, isOverlayView } from '@tuix/core/types'
import { toView } from '@tuix/jsx'
import { Modal } from './Modal'

async function paint(node: unknown): Promise<string> {
  const out = await Effect.runPromise(toView(node).render())
  return typeof out === 'string' ? out : out.content
}

describe('Modal', () => {
  test('accepts open and isOpen', async () => {
    expect(await paint(<Modal isOpen title="Old" />)).toContain('Old')
    expect(await paint(<Modal open title="New" />)).toContain('New')
    expect(await paint(<Modal isOpen={false} title="Hidden" />)).not.toContain('Hidden')
  })

  test('keeps the close mark off the title', async () => {
    expect(await paint(<Modal open title="Confirm" />)).toContain('Confirm ×')
  })

  test('tags an open modal as an overlay view', async () => {
    const view = toView(<Modal open title="Keys" />)
    expect(isOverlayView(view)).toBe(true)
    expect(collectOverlays(view)).toEqual([])
  })
})
