/**
 * StaticLayout tests
 */

import { describe, test, expect } from 'bun:test'
import { Effect } from 'effect'
import { render } from '@tuix/jsx'
import { StaticLayout } from './StaticLayout'
import { Text } from '../../display/text'

describe('StaticLayout', () => {
  test('renders with title and content', async () => {
    const layout = (
      <StaticLayout title="Test App" subtitle="Testing">
        <Text>Hello World</Text>
      </StaticLayout>
    )

    const view = render(layout)
    const result = await Effect.runPromise(view.render())
    const output = typeof result === 'string' ? result : result.content

    // Should contain title
    expect(output).toContain('Test App')
    expect(output).toContain('Testing')
    expect(output).toContain('Hello World')
  })

  test('renders borders around content', async () => {
    const layout = (
      <StaticLayout title="Bordered">
        <Text>Content</Text>
      </StaticLayout>
    )

    const view = render(layout)
    const result = await Effect.runPromise(view.render())
    const output = typeof result === 'string' ? result : result.content

    // Should contain box drawing characters (borders)
    const hasBorders = /[─│┌┐└┘╭╮╰╯]/.test(output)
    expect(hasBorders).toBe(true)
  })

  test('applies centering', async () => {
    const layout = (
      <StaticLayout title="Centered" widthPercent={0.5}>
        <Text>Content</Text>
      </StaticLayout>
    )

    const view = render(layout)
    const result = await Effect.runPromise(view.render())
    const output = typeof result === 'string' ? result : result.content

    // Should have leading whitespace for centering
    const lines = output.split('\n')
    const hasLeadingSpace = lines.some(line => line.startsWith(' ') && line.trim().length > 0)
    expect(hasLeadingSpace).toBe(true)
  })
})
