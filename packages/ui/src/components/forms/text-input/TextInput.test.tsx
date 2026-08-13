/** @jsxImportSource @tuix/jsx */

import { describe, expect, test } from 'bun:test'
import { Effect } from 'effect'
import { $state, toView } from '@tuix/jsx'
import { Input, passwordInput } from './TextInput'

async function paint(node: unknown): Promise<string> {
  const out = await Effect.runPromise(toView(node).render())
  return typeof out === 'string' ? out : out.content
}

describe('Input', () => {
  test('shows placeholder when empty', async () => {
    expect(await paint(<Input placeholder="Name" />)).toContain('Name')
  })

  test('masks password echo', async () => {
    const content = await paint(passwordInput({ value: 'secret' }))
    expect(content).toContain('••••••')
    expect(content).not.toContain('secret')
  })

  test('bind:value paints the rune', async () => {
    const name = $state('Ada')
    expect(await paint(<Input bind:value={name} />)).toContain('Ada')
  })
})
