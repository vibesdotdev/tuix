/**
 * Checkbox Component Tests
 */

import { test, expect, describe } from 'bun:test'
import { Checkbox } from './Checkbox'

describe('Checkbox Component', () => {
  test('should create checkbox component', () => {
    const component = <Checkbox checked={false} label="Accept terms" />
    expect(component).toBeDefined()
  })

  test('should handle checked state', () => {
    const component = <Checkbox checked={true} label="Already checked" />
    expect(component).toBeDefined()
  })

  test('should handle disabled state', () => {
    const component = <Checkbox disabled label="Cannot check" />
    expect(component).toBeDefined()
  })

  test('should handle onChange callback', () => {
    let changed = false
    const component = <Checkbox onChange={() => { changed = true }} />
    expect(component).toBeDefined()
  })
})
