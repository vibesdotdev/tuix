/** @jsxImportSource @tuix/jsx */

import { describe, expect, test } from 'bun:test'
import { Effect } from 'effect'
import { toView } from '@tuix/jsx'
import { Select } from './Select'

async function paint(node: unknown): Promise<string> {
  const out = await Effect.runPromise(toView(node).render())
  return typeof out === 'string' ? out : out.content
}

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
]

describe('Select', () => {
  test('paints the selected label', async () => {
    const content = await paint(<Select options={options} value="a" />)
    expect(content).toContain('Option A')
    expect(content).toContain('▾')
  })

  test('open lists every option', async () => {
    const content = await paint(<Select options={options} value="a" open />)
    expect(content).toContain('Option A')
    expect(content).toContain('Option B')
    expect(content).toContain('>')
  })

  test('placeholder when empty', async () => {
    const content = await paint(<Select options={options} placeholder="Select one..." />)
    expect(content).toContain('Select one...')
  })
})
