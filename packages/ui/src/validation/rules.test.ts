/**
 * Validation Rules Tests
 */

import { test, expect, describe } from 'bun:test'
import {
  required,
  minLength,
  maxLength,
  email,
  number,
  integer,
  min,
  max,
  pattern,
  oneOf,
} from './rules'

describe('Validation Rules', () => {
  describe('required', () => {
    test('should fail for empty string', () => {
      const rule = required()
      expect(rule('')).toBe('This field is required')
    })

    test('should pass for non-empty string', () => {
      const rule = required()
      expect(rule('value')).toBeNull()
    })

    test('should use custom message', () => {
      const rule = required('Custom message')
      expect(rule('')).toBe('Custom message')
    })
  })

  describe('minLength', () => {
    test('should fail for short string', () => {
      const rule = minLength(5)
      expect(rule('abc')).toContain('at least 5')
    })

    test('should pass for long enough string', () => {
      const rule = minLength(5)
      expect(rule('abcdef')).toBeNull()
    })
  })

  describe('maxLength', () => {
    test('should fail for long string', () => {
      const rule = maxLength(5)
      expect(rule('abcdef')).toContain('at most 5')
    })

    test('should pass for short enough string', () => {
      const rule = maxLength(5)
      expect(rule('abc')).toBeNull()
    })
  })

  describe('email', () => {
    test('should fail for invalid email', () => {
      const rule = email()
      expect(rule('notanemail')).toBe('Invalid email address')
    })

    test('should pass for valid email', () => {
      const rule = email()
      expect(rule('test@example.com')).toBeNull()
    })
  })

  describe('number', () => {
    test('should fail for non-number', () => {
      const rule = number()
      expect(rule('abc')).toBe('Must be a number')
    })

    test('should pass for number', () => {
      const rule = number()
      expect(rule('123')).toBeNull()
      expect(rule(123)).toBeNull()
    })
  })

  describe('integer', () => {
    test('should fail for decimal', () => {
      const rule = integer()
      expect(rule('123.45')).toBe('Must be an integer')
    })

    test('should pass for integer', () => {
      const rule = integer()
      expect(rule('123')).toBeNull()
      expect(rule(123)).toBeNull()
    })
  })

  describe('min', () => {
    test('should fail for value below minimum', () => {
      const rule = min(10)
      expect(rule(5)).toContain('at least 10')
    })

    test('should pass for value at or above minimum', () => {
      const rule = min(10)
      expect(rule(10)).toBeNull()
      expect(rule(15)).toBeNull()
    })
  })

  describe('max', () => {
    test('should fail for value above maximum', () => {
      const rule = max(10)
      expect(rule(15)).toContain('at most 10')
    })

    test('should pass for value at or below maximum', () => {
      const rule = max(10)
      expect(rule(10)).toBeNull()
      expect(rule(5)).toBeNull()
    })
  })

  describe('pattern', () => {
    test('should fail for non-matching pattern', () => {
      const rule = pattern(/^\d{3}$/, 'Must be 3 digits')
      expect(rule('ab')).toBe('Must be 3 digits')
    })

    test('should pass for matching pattern', () => {
      const rule = pattern(/^\d{3}$/)
      expect(rule('123')).toBeNull()
    })
  })

  describe('oneOf', () => {
    test('should fail for value not in list', () => {
      const rule = oneOf(['a', 'b', 'c'])
      expect(rule('d')).toContain('Must be one of')
    })

    test('should pass for value in list', () => {
      const rule = oneOf(['a', 'b', 'c'])
      expect(rule('a')).toBeNull()
    })
  })
})
