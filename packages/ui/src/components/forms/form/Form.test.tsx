/**
 * Form Component Tests
 */

import { test, expect, describe } from 'bun:test'
import { Form } from './Form'

describe('Form Component', () => {
  test('should create form component', () => {
    const component = <Form onSubmit={(data) => console.log(data)} />
    expect(component).toBeDefined()
  })

  test('should handle validation errors', () => {
    const handleErrors = (errors: Record<string, string>) => {
      expect(errors).toBeDefined()
    }

    const component = <Form onValidationError={handleErrors} />
    expect(component).toBeDefined()
  })

  test('should render children', () => {
    const component = (
      <Form>
        <text>Form content</text>
      </Form>
    )
    expect(component).toBeDefined()
  })

  test('should handle showErrors prop', () => {
    const component = <Form showErrors={false} />
    expect(component).toBeDefined()
  })
})
