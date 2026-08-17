import { describe, expect, it } from 'bun:test'
import { collectFormData, validateFormFields } from './Form'

describe('Form field collection', () => {
  it('reads live values through getters', () => {
    let name = 'ada'
    const fields = {
      name: { value: () => name },
    }
    expect(collectFormData(fields)).toEqual({ name: 'ada' })
    name = 'grace'
    expect(collectFormData(fields)).toEqual({ name: 'grace' })
  })

  it('skips dead getters', () => {
    const fields = {
      broken: {
        value: () => {
          throw new Error('dead rune')
        },
      },
    }
    expect(collectFormData(fields)).toEqual({})
  })
})

describe('Form validation', () => {
  it('flags required empties', () => {
    const errors = validateFormFields({
      name: { value: () => '  ', required: true },
      age: { value: () => 42, required: true },
    })
    expect(errors).toEqual({ name: 'This field is required' })
  })

  it('runs per-field rules and keeps the message', () => {
    const errors = validateFormFields({
      email: { value: () => 'nope', validate: () => 'Invalid email address' },
      fine: { value: () => 'ok', validate: () => null },
    })
    expect(errors).toEqual({ email: 'Invalid email address' })
  })

  it('required short-circuits further rules on the same field', () => {
    let seen = false
    const errors = validateFormFields({
      name: { value: () => '', required: true, validate: () => ((seen = true), null) },
    })
    expect(errors.name).toBe('This field is required')
    expect(seen).toBe(false)
  })
})
