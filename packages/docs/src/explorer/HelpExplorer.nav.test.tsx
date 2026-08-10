/**
 * Honest proof: HelpExplorer navigation moves the painted '>' cursor via MVU.
 * Path under test: compileToComponent → update({ type:'set', key:'selectedIndex' }) → view → paint
 * Also: $set + bindMvuPush produces SetMsg (real bridge used by Runtime).
 */

import { test, expect, describe } from 'bun:test'
import { Effect } from 'effect'
import {
  $state,
  bindMvuPush,
  beginViewHydration,
  endViewHydration,
  registerKeyHandler,
  emitKeyToHandlers,
  clearKeyHandlers,
} from '@tuix/reactive'
import { compileToComponent } from '../../../jsx/src/compiler/jsx-to-component'
import { HelpExplorer } from './HelpExplorer'
import type { AppDoc } from '../types'

const sampleDocs: AppDoc = {
  name: 'tuix',
  version: '1.0.0-rc.3',
  commands: [
    { name: 'version', description: 'Show version' },
    { name: 'help', description: 'Help explorer' },
    { name: 'dashboard', description: 'Live metrics' },
  ],
  plugins: [],
}

function HelpApp() {
  return <HelpExplorer docs={sampleDocs} showPlugins={true} />
}

async function paint(
  component: ReturnType<typeof compileToComponent>,
  model: unknown
): Promise<string> {
  const view = await component.view(model as never)
  const rendered = await Effect.runPromise(
    (view as { render: () => Effect.Effect<unknown> }).render()
  )
  if (typeof rendered === 'string') return rendered
  if (rendered && typeof rendered === 'object' && 'content' in (rendered as object)) {
    return String((rendered as { content: string }).content)
  }
  return String(rendered ?? '')
}

function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, '')
}

describe('HelpExplorer MVU navigation (shipped path)', () => {
  test('named $set bridges to MVU SetMsg via bindMvuPush', () => {
    const pushed: Array<{ type: string; key: string; value: unknown }> = []
    bindMvuPush(msg => pushed.push(msg))
    try {
      beginViewHydration({ selectedIndex: 0 })
      const idx = $state(0, 'selectedIndex')
      expect(idx()).toBe(0)
      idx.$set(1)
      expect(idx()).toBe(1)
      expect(pushed).toEqual([{ type: 'set', key: 'selectedIndex', value: 1 }])
    } finally {
      endViewHydration()
      bindMvuPush(null)
    }
  })

  test('compile update selectedIndex moves painted > cursor from version to help', async () => {
    // Root may not extract nested HelpExplorer $state keys; model starts {} and
    // paint uses $state(0,'selectedIndex') initial. update adds the key for hydration.
    const component = compileToComponent(HelpApp, {
      extractState: true,
      interactive: true,
      initialModel: {
        selectedIndex: 0,
        viewMode: 'list',
        selectedCommand: null,
      } as never,
    })

    const [model0] = await Effect.runPromise(component.init)
    expect((model0 as { selectedIndex: number }).selectedIndex).toBe(0)

    const paint0 = stripAnsi(await paint(component, model0))
    // First command selected (cursor on version)
    expect(paint0).toMatch(/>\s*version/)
    // help line exists without cursor
    expect(paint0).toMatch(/help/)
    expect(paint0).not.toMatch(/>\s*help/)

    const [model1] = await Effect.runPromise(
      component.update({ type: 'set', key: 'selectedIndex', value: 1 } as never, model0 as never)
    )
    expect((model1 as { selectedIndex: number }).selectedIndex).toBe(1)

    const paint1 = stripAnsi(await paint(component, model1))
    // Cursor moved to help
    expect(paint1).toMatch(/>\s*help/)
    expect(paint1).not.toMatch(/>\s*version/)
    // version still listed
    expect(paint1).toMatch(/version/)
  })

  test('registerKeyHandler + $set bridge: emit j advances selection through update path', async () => {
    const component = compileToComponent(HelpApp, {
      extractState: true,
      interactive: true,
      initialModel: {
        selectedIndex: 0,
        viewMode: 'list',
        selectedCommand: null,
      } as never,
    })
    const [model0] = await Effect.runPromise(component.init)

    // Capture SetMsgs as Runtime would
    const msgs: Array<{ type: string; key: string; value: unknown }> = []
    bindMvuPush(msg => msgs.push(msg))

    // Mount component once so HelpExplorer registers key handler
    await paint(component, model0)
    expect(msgs.length).toBe(0)

    // Simulate Runtime KeyPress 'j' → emitKeyToHandlers → handleKey → $set(1)
    emitKeyToHandlers('j')
    expect(msgs.some(m => m.key === 'selectedIndex' && m.value === 1)).toBe(true)

    const setMsg = msgs.find(m => m.key === 'selectedIndex')!
    const [model1] = await Effect.runPromise(component.update(setMsg as never, model0 as never))
    const paint1 = stripAnsi(await paint(component, model1))
    expect(paint1).toMatch(/>\s*help/)

    bindMvuPush(null)
    clearKeyHandlers()
  })

  test('stale $set without bridge does NOT change next view paint (regression guard)', async () => {
    // Proves why bindMvuPush is required: local $set alone is wiped by hydration
    const component = compileToComponent(HelpApp, {
      extractState: true,
      interactive: true,
    })
    const [model0] = await Effect.runPromise(component.init)
    bindMvuPush(null) // ensure no bridge

    // Paint once (creates runes, hydrates selectedIndex=0)
    await paint(component, model0)

    // Direct $set without bridge during a free session does not update model
    beginViewHydration(model0 as Record<string, unknown>)
    const orphan = $state(0, 'selectedIndex')
    orphan.$set(2)
    endViewHydration()

    // Same model still paints index 0
    const paintAgain = stripAnsi(await paint(component, model0))
    expect(paintAgain).toMatch(/>\s*version/)
    expect(paintAgain).not.toMatch(/>\s*dashboard/)
  })
})
