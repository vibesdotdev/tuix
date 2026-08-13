/** @jsxImportSource @tuix/jsx */

import { describe, expect, test } from 'bun:test'
import { Effect } from 'effect'
import { toView } from '@tuix/jsx'
import Kit from './kit.tsx'

describe('kit (Tuix JSX)', () => {
  test('toView paints every primitive', async () => {
    const out = await Effect.runPromise(toView(<Kit />).render())
    const content = typeof out === 'string' ? out : out.content
    expect(content).toContain('Tuix kit')
    expect(content).toContain('Save')
    expect(content).toContain('Ada Lovelace')
    expect(content).toContain('TypeScript')
    expect(content).toContain('Workers')
    expect(content).toContain('1 │ export const ok = true')
    expect(content).toContain('app.tsx')
    expect(content).toContain('Confirm')
    expect(content).toContain('Save file')
    expect(content).not.toContain('[object Object]')
  })
})
