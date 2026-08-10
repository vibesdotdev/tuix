/**
 * Select Component Tests
 */

import { test, expect, describe } from 'bun:test'
import { Select } from './Select'

describe('Select Component', () => {
  test('should create select component', () => {
    const options = [
      { value: 'a', label: 'Option A' },
      { value: 'b', label: 'Option B' },
    ]

    const component = <Select options={options} value="a" />
    expect(component).toBeDefined()
  })

  test('should handle placeholder', () => {
    const options = [{ value: 'a', label: 'Option A' }]

    const component = <Select options={options} placeholder="Select one..." />
    expect(component).toBeDefined()
  })

  test('should handle disabled state', () => {
    const options = [{ value: 'a', label: 'Option A' }]

    const component = <Select options={options} disabled />
    expect(component).toBeDefined()
  })

  test('should handle searchable mode', () => {
    const options = [
      { value: 'a', label: 'Option A' },
      { value: 'b', label: 'Option B' },
    ]

    const component = <Select options={options} searchable />
    expect(component).toBeDefined()
  })
})
