/** @jsxImportSource @tuix/jsx */

import { describe, expect, test } from 'bun:test'
import { Effect } from 'effect'
import { stripAnsi } from '@tuix/ansi'
import { collectOverlays } from '@tuix/core/types'
import { toView } from '@tuix/jsx'
import { Modal } from '@tuix/ui'
import Kit from './kit.tsx'

async function paint(): Promise<string> {
  const out = await Effect.runPromise(toView(<Kit />).render())
  const raw = typeof out === 'string' ? out : out.content
  return stripAnsi(raw)
}

describe('kit workbench', () => {
  test('toView fills a workbench, not a widget zoo', async () => {
    const content = await paint()
    expect(content).not.toContain('[object Object]')
    expect(content).not.toContain('●')
    expect(content).toContain('vibes')
    expect(content).toContain('sessions')
    expect(content).toContain('rewrite auth')
    expect(content).toContain('[tab] focus')
  })

  test('toView paints theme color through official text, not a string frame', async () => {
    const out = await Effect.runPromise(toView(<Kit />).render())
    const raw = typeof out === 'string' ? out : out.content
    expect(raw).toMatch(/\x1b\[/)
  })

  test('flex keeps the workbench when an overlay sibling is open', async () => {
    const view = toView(
      <flex direction="column" width={40} height={8}>
        <text>sessions</text>
        <text>rewrite auth</text>
        <Modal open title="Keys">
          tab cycles
        </Modal>
        <text>say something…</text>
      </flex>
    )
    const out = await Effect.runPromise(view.render())
    const raw = typeof out === 'string' ? out : out.content
    const content = stripAnsi(raw)
    expect(content).toContain('sessions')
    expect(content).toContain('rewrite auth')
    expect(content).toContain('say something…')
    expect(content).not.toContain('Keys')
    const overlays = collectOverlays(view)
    expect(overlays).toHaveLength(1)
    const overlayOut = await Effect.runPromise(overlays[0]!.view.render())
    const overlayRaw = typeof overlayOut === 'string' ? overlayOut : overlayOut.content
    expect(stripAnsi(overlayRaw)).toContain('Keys')
  })
})
