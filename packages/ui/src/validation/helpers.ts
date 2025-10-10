/**
 * Form Validation Helpers
 *
 * Utilities for combining and applying validation rules
 */

import type { ValidationRule } from './rules'

/**
 * Combine multiple validation rules
 */
export function combine(...rules: ValidationRule[]): ValidationRule {
  return (value: any) => {
    for (const rule of rules) {
      const error = rule(value)
      if (error) {
        return error
      }
    }
    return null
  }
}

/**
 * Validate a value against multiple rules
 */
export function validate(value: any, ...rules: ValidationRule[]): string | null {
  return combine(...rules)(value)
}

/**
 * Validate multiple fields
 */
export function validateFields(
  fields: Record<string, any>,
  rules: Record<string, ValidationRule | ValidationRule[]>
): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const [field, value] of Object.entries(fields)) {
    const fieldRules = rules[field]
    if (!fieldRules) continue

    const rule = Array.isArray(fieldRules) ? combine(...fieldRules) : fieldRules
    const error = rule(value)

    if (error) {
      errors[field] = error
    }
  }

  return errors
}

/**
 * Check if validation errors exist
 */
export function hasErrors(errors: Record<string, string>): boolean {
  return Object.keys(errors).length > 0
}

/**
 * Get error message for a field
 */
export function getError(errors: Record<string, string>, field: string): string | null {
  return errors[field] || null
}

/**
 * Clear error for a field
 */
export function clearError(errors: Record<string, string>, field: string): Record<string, string> {
  const newErrors = { ...errors }
  delete newErrors[field]
  return newErrors
}

/**
 * Set error for a field
 */
export function setError(
  errors: Record<string, string>,
  field: string,
  message: string
): Record<string, string> {
  return {
    ...errors,
    [field]: message,
  }
}

/**
 * Conditional validation (only validate if condition is true)
 */
export function when(condition: boolean | (() => boolean), rule: ValidationRule): ValidationRule {
  return (value: any) => {
    const shouldValidate = typeof condition === 'function' ? condition() : condition
    if (!shouldValidate) {
      return null
    }
    return rule(value)
  }
}

/**
 * Async validation wrapper
 */
export async function validateAsync(
  value: any,
  validator: (value: any) => Promise<string | null>
): Promise<string | null> {
  try {
    return await validator(value)
  } catch (error) {
    return error instanceof Error ? error.message : 'Validation error'
  }
}

/**
 * Debounced validation (useful for async validations)
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: Timer | null = null

  return (...args: Parameters<T>) => {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        resolve(fn(...args))
      }, delay)
    })
  }
}
