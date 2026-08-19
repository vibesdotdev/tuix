/** @jsxImportSource @tuix/jsx */

import { describe, expect, test } from 'bun:test'
import { Effect } from 'effect'
import { toView, render } from '@tuix/jsx'
import { Button } from './Button'

async function paint(node: unknown): Promise<string> {
  const out = await Effect.runPromise(toView(node).render())
  return typeof out === 'string' ? out : (out as { content: string }).content
}

const INTERACTIVE = Symbol.for('tuix.interactive')

function metadataOf(node: unknown): Record<string, unknown> | undefined {
  const view = render(node)
  return (view as unknown as Record<symbol, unknown>)[INTERACTIVE] as
    | Record<string, unknown>
    | undefined
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

  test('registers as focusable for Tab cycling', () => {
    const meta = metadataOf(<Button>Save</Button>)
    expect(meta).toBeDefined()
    expect(meta?.focusable).toBe(true)
  })

  test('disabled button is not focusable and drops onClick', () => {
    const handler = () => {}
    const meta = metadataOf(<Button onClick={handler}>Save</Button>)
    expect(meta?.focusable).toBe(true)
    expect(meta?.events?.onClick).toBe(handler)

    const disabledMeta = metadataOf(
      <Button disabled onClick={handler}>
        Save
      </Button>
    )
    expect(disabledMeta?.focusable).toBe(false)
    expect(disabledMeta?.events?.onClick).toBeUndefined()
  })

  test('primary variant uses theme primary color', async () => {
    const textRef = await paint(<text variant="primary">Save</text>)
    const btn = await paint(<Button variant="primary">Save</Button>)
    const colorMatch = textRef.match(/\x1b\[[0-9;]*m/)
    expect(colorMatch).not.toBeNull()
    expect(btn).toContain(colorMatch![0])
  })

  test('danger variant uses theme danger color', async () => {
    const textRef = await paint(<text variant="danger">Delete</text>)
    const btn = await paint(<Button variant="danger">Delete</Button>)
    const colorMatch = textRef.match(/\x1b\[[0-9;]*m/)
    expect(colorMatch).not.toBeNull()
    expect(btn).toContain(colorMatch![0])
  })

  test('ghost renders as bare text without button chrome', async () => {
    const content = await paint(<Button variant="ghost">Cancel</Button>)
    expect(content).toContain('Cancel')
    expect(content).not.toContain('[ ')
    expect(content).not.toContain('( ')
  })

  test('ghost does not register as focusable', () => {
    const view = render(<Button variant="ghost">Cancel</Button>)
    const meta = (view as unknown as Record<symbol, unknown>)[INTERACTIVE] as
      | Record<string, unknown>
      | undefined
    expect(meta).toBeUndefined()
  })

  test('non-ghost renders with button chrome', async () => {
    const content = await paint(<Button variant="primary">Save</Button>)
    expect(content).toMatch(/\( Save \)/)
  })
})
