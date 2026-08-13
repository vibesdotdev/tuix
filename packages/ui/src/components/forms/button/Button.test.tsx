/** @jsxImportSource @tuix/jsx */

import { describe, expect, test } from 'bun:test'
import { Effect } from 'effect'
import { toView } from '@tuix/jsx'
import { Button } from './Button'

async function paint(node: unknown): Promise<string> {
  const out = await Effect.runPromise(toView(node).render())
  return typeof out === 'string' ? out : out.content
}

describe('Button', () => {
  test('paints children through the button intrinsic', async () => {
    const content = await paint(<Button>Save</Button>)
    expect(content).toContain('Save')
    expect(content).not.toContain('[object Object]')
  })

  test('loading prefixes the label', async () => {
    const content = await paint(
      <Button loading variant="primary">
        Save
      </Button>
    )
    expect(content).toContain('…')
    expect(content).toContain('Save')
  })
})
