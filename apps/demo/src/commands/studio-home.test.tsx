/** @jsxImportSource @tuix/jsx */

import { describe, expect, test } from 'bun:test'
import { Effect } from 'effect'
import { toView } from '@tuix/jsx'
import StudioHome from './studio-home.tsx'

describe('studio-home (Tuix JSX)', () => {
  test('toView paints the home copy through the official JSX pipeline', async () => {
    const view = toView(<StudioHome />)
    const out = await Effect.runPromise(view.render())
    const content = typeof out === 'string' ? out : out.content
    expect(content).toContain('Make something real')
    expect(content).toContain('Describe what you want to build')
    expect(content).toContain('operator workbench')
    expect(content).toContain('[?] help')
    expect(content).not.toContain('[object Object]')
  })
})
