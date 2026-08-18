import { describe, expect, test } from 'bun:test'
import { Effect } from 'effect'
import {
  attachOverlays,
  collectOverlays,
  isOverlayView,
  markOverlay,
  overlaySpec,
  partitionOverlays,
} from './overlay'

const view = (label: string) => ({
  render: () => Effect.succeed(label),
  width: label.length,
  height: 1,
})

describe('overlay metadata', () => {
  test('markOverlay tags a view without changing its paint', async () => {
    const marked = markOverlay(view('Keys'), { x: 3, y: 2 })
    expect(isOverlayView(marked)).toBe(true)
    expect(overlaySpec(marked)).toEqual({ view: marked, x: 3, y: 2, scrim: false })
    expect(await Effect.runPromise(marked.render())).toBe('Keys')
  })

  test('partitionOverlays lifts tagged views out of flow', () => {
    const body = view('sessions')
    const overlay = markOverlay(view('Command'))
    const { flow, overlays } = partitionOverlays([{ view: body }, { view: overlay }])
    expect(flow.map(item => item.view)).toEqual([body])
    expect(overlays).toHaveLength(1)
    expect(overlays[0]?.x).toBe(0)
    expect(overlays[0]?.y).toBe(1)
  })

  test('collectOverlays reads only attached overlay lists', () => {
    const base = view('workbench')
    expect(collectOverlays(base)).toEqual([])
    expect(collectOverlays(markOverlay(view('Keys')))).toEqual([])
    const attached = attachOverlays(base, [overlaySpec(markOverlay(view('Keys')))])
    expect(collectOverlays(attached)).toHaveLength(1)
  })
})
