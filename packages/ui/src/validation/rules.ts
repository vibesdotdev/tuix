/**
 * Form Validation Rules
 *
 * Common validation rules for form inputs
 */

export type ValidationRule = (value: any) => string | null

/**
 * Required field validation
 */
export function required(message = 'This field is required'): ValidationRule {
  return (value: any) => {
    if (value === null || value === undefined || value === '') {
      return message
    }
    if (typeof value === 'string' && value.trim() === '') {
      return message
    }
    return null
  }
}

/**
 * Minimum length validation
 */
export function minLength(min: number, message?: string): ValidationRule {
  return (value: any) => {
    if (typeof value !== 'string') return null
    if (value.length < min) {
      return message || `Must be at least ${min} characters`
    }
    return null
  }
}

/**
 * Maximum length validation
 */
export function maxLength(max: number, message?: string): ValidationRule {
  return (value: any) => {
    if (typeof value !== 'string') return null
    if (value.length > max) {
      return message || `Must be at most ${max} characters`
    }
    return null
  }
}

/**
 * Email validation
 */
export function email(message = 'Invalid email address'): ValidationRule {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return (value: any) => {
    if (typeof value !== 'string') return null
    if (!emailRegex.test(value)) {
      return message
    }
    return null
  }
}

/**
 * URL validation
 */
export function url(message = 'Invalid URL'): ValidationRule {
  return (value: any) => {
    if (typeof value !== 'string') return null
    try {
      new URL(value)
      return null
    } catch {
      return message
    }
  }
}

/**
 * Number validation
 */
export function number(message = 'Must be a number'): ValidationRule {
  return (value: any) => {
    if (isNaN(Number(value))) {
      return message
    }
    return null
  }
}

/**
 * Integer validation
 */
export function integer(message = 'Must be an integer'): ValidationRule {
  return (value: any) => {
    if (!Number.isInteger(Number(value))) {
      return message
    }
    return null
  }
}

/**
 * Minimum value validation
 */
export function min(minValue: number, message?: string): ValidationRule {
  return (value: any) => {
    const num = Number(value)
    if (isNaN(num)) return null
    if (num < minValue) {
      return message || `Must be at least ${minValue}`
    }
    return null
  }
}

/**
 * Maximum value validation
 */
export function max(maxValue: number, message?: string): ValidationRule {
  return (value: any) => {
    const num = Number(value)
    if (isNaN(num)) return null
    if (num > maxValue) {
      return message || `Must be at most ${maxValue}`
    }
    return null
  }
}

/**
 * Pattern validation (regex)
 */
export function pattern(regex: RegExp, message = 'Invalid format'): ValidationRule {
  return (value: any) => {
    if (typeof value !== 'string') return null
    if (!regex.test(value)) {
      return message
    }
    return null
  }
}

/**
 * Custom validation
 */
export function custom(fn: (value: any) => boolean, message: string): ValidationRule {
  return (value: any) => {
    if (!fn(value)) {
      return message
    }
    return null
  }
}

/**
 * One of (enum) validation
 */
export function oneOf<T>(options: T[], message?: string): ValidationRule {
  return (value: any) => {
    if (!options.includes(value)) {
      return message || `Must be one of: ${options.join(', ')}`
    }
    return null
  }
}

/**
 * Match another field validation
 */
export function matches(otherValue: any, fieldName: string): ValidationRule {
  return (value: any) => {
    if (value !== otherValue) {
      return `Must match ${fieldName}`
    }
    return null
  }
}
