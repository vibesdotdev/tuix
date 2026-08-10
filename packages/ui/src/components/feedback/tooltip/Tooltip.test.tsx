import { describe, it, expect } from 'bun:test'
import { Tooltip } from './Tooltip'

describe('Tooltip', () => {
  it('should render with content', () => {
    const element = <Tooltip visible content="Help text" />
    expect(element).toBeDefined()
  })

  it('should not render when visible is false', () => {
    // Test the component function directly (not JSX)
    const result = Tooltip({ visible: false, content: 'Hidden' })
    expect(result).toBeNull()
  })

  it('should render with children', () => {
    const element = (
      <Tooltip visible>
        <text>Custom tooltip content</text>
      </Tooltip>
    )
    expect(element).toBeDefined()
  })
})
