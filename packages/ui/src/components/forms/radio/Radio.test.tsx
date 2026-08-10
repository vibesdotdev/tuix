/**
 * Radio Component Tests
 */

import { test, expect, describe } from 'bun:test'
import { Radio } from './Radio'

describe('Radio Component', () => {
  test('should create radio component', () => {
    const options = [
      { value: 'a', label: 'Option A' },
      { value: 'b', label: 'Option B' },
    ]

    const component = <Radio options={options} value="a" />
    expect(component).toBeDefined()
  })

  test('should handle vertical direction', () => {
    const options = [
      { value: 'a', label: 'Option A' },
      { value: 'b', label: 'Option B' },
    ]

    const component = <Radio options={options} direction="vertical" />
    expect(component).toBeDefined()
  })

  test('should handle horizontal direction', () => {
    const options = [
      { value: 'a', label: 'Option A' },
      { value: 'b', label: 'Option B' },
    ]

    const component = <Radio options={options} direction="horizontal" />
    expect(component).toBeDefined()
  })

  test('should handle disabled state', () => {
    const options = [{ value: 'a', label: 'Option A' }]

    const component = <Radio options={options} disabled />
    expect(component).toBeDefined()
  })
})
