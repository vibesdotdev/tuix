import { describe, expect, test } from 'bun:test'
import { formatError } from './format-error'

class RuntimeError extends Error {
  constructor(
    message: string,
    public readonly context: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'RuntimeError'
  }
}

describe('formatError', () => {
  test('renders the message + cause chain for nested errors', () => {
    const e = new RuntimeError('render fiber failed', 'render', new RangeError('bad array length'))
    const out = formatError(e)
    expect(out).toContain('RuntimeError: render fiber failed')
    expect(out).toContain('caused by: RangeError: bad array length')
  })

  test('appends a trimmed stack frame', () => {
    const e = new Error('boom')
    const out = formatError(e)
    expect(out).toContain('Error: boom')
    expect(out.split('\n').length).toBeGreaterThan(1)
  })

  test('handles primitives and nullish', () => {
    expect(formatError(null)).toBe('unknown error')
    expect(formatError(undefined)).toBe('unknown error')
    expect(formatError('plain string')).toBe('plain string')
    expect(formatError(42)).toBe('42')
  })

  test('handles plain objects with a message field', () => {
    expect(formatError({ message: 'obj fail' })).toBe('obj fail')
  })

  test('does not infinite-loop on circular causes', () => {
    const e: Error & { cause?: unknown } = new Error('root')
    e.cause = e
    const out = formatError(e)
    expect(out).toContain('Error: root')
    expect(out.split('\n').length).toBeLessThan(8)
  })
})
