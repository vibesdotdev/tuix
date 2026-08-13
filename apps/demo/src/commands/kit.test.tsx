/** @jsxImportSource @tuix/jsx */

import { describe, expect, test } from 'bun:test'
import { Effect } from 'effect'
import { toView } from '@tuix/jsx'
import Kit from './kit.tsx'

describe('kit (Tuix JSX)', () => {
  test('toView paints every primitive', async () => {
    const out = await Effect.runPromise(toView(<Kit />).render())
    const content = typeof out === 'string' ? out : out.content
    expect(content).toContain('\x1b[38;2;')
    expect(content).toContain('▀')
    expect(content).toContain('flower of life')
    expect(content).not.toContain('[object Object]')
    expect(content).not.toContain('●')
  })
})
