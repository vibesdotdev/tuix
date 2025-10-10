/**
 * StaticLayout tests
 */

import { describe, test, expect } from 'bun:test'
import { StaticLayout } from './StaticLayout'
import { Text } from '../../display/text'

describe('StaticLayout', () => {
  test('renders with title and content', () => {
    const layout = (
      <StaticLayout title="Test App" subtitle="Testing">
        <Text>Hello World</Text>
      </StaticLayout>
    )

    const rendered = layout.render()
    const output = typeof rendered === 'string' ? rendered : rendered.toString()

    // Should contain title
    expect(output).toContain('Test App')
    expect(output).toContain('Testing')
    expect(output).toContain('Hello World')
  })

  test('renders borders around content', () => {
    const layout = (
      <StaticLayout title="Bordered">
        <Text>Content</Text>
      </StaticLayout>
    )

    const rendered = layout.render()
    const output = typeof rendered === 'string' ? rendered : rendered.toString()

    // Should contain box drawing characters (borders)
    const hasBorders = /[─│┌┐└┘╭╮╰╯]/.test(output)
    expect(hasBorders).toBe(true)
  })

  test('applies centering', () => {
    const layout = (
      <StaticLayout title="Centered" widthPercent={0.5}>
        <Text>Content</Text>
      </StaticLayout>
    )

    const rendered = layout.render()
    const output = typeof rendered === 'string' ? rendered : rendered.toString()

    // Should have leading whitespace for centering
    const lines = output.split('\n')
    const hasLeadingSpace = lines.some(line => line.startsWith(' ') && line.trim().length > 0)
    expect(hasLeadingSpace).toBe(true)
  })
})
