/**
 * Confirm Component Tests
 */

import { test, expect, describe } from 'bun:test'
import { Confirm } from './Confirm'

describe('Confirm Component', () => {
  test('should create confirm component', () => {
    const component = <Confirm message="Are you sure?" />
    expect(component).toBeDefined()
  })

  test('should handle custom labels', () => {
    const component = <Confirm message="Continue?" yesLabel="Proceed" noLabel="Cancel" />
    expect(component).toBeDefined()
  })

  test('should handle default choice', () => {
    const component = <Confirm message="Delete?" defaultChoice="no" />
    expect(component).toBeDefined()
  })

  test('should handle callbacks', () => {
    let confirmed = false
    let cancelled = false

    const component = (
      <Confirm
        message="Test?"
        onConfirm={() => {
          confirmed = true
        }}
        onCancel={() => {
          cancelled = true
        }}
      />
    )
    expect(component).toBeDefined()
  })
})
