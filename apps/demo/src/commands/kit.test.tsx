/** @jsxImportSource @tuix/jsx */

import { describe, expect, test } from 'bun:test'
import { Effect } from 'effect'
import { stripAnsi } from '@tuix/ansi'
import { toView } from '@tuix/jsx'
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

})
