/**
 * Snapshot Serializer - Converts TUI output to snapshot format
 */

import type { View } from '@tuix/core/types'
import { Effect } from 'effect'

/**
 * Serializer interface
 */
export interface Serializer<T = unknown> {
  /**
   * Test if this serializer can handle the value
   */
  test(value: unknown): value is T

  /**
   * Serialize value to snapshot string
   */
  serialize(value: T): string | Promise<string>
}

/**
 * View serializer - handles @tuix/view components
 */
export const ViewSerializer: Serializer<View> = {
  test(value): value is View {
    return (
      value !== null &&
      typeof value === 'object' &&
      'render' in value &&
      typeof value.render === 'function'
    )
  },

  async serialize(view: View): Promise<string> {
    try {
      const rendered = await Effect.runPromise(view.render())
      return normalizeOutput(rendered)
    } catch (error) {
      return `[Error rendering view: ${error}]`
    }
  },
}

/**
 * String serializer - handles plain strings
 */
export const StringSerializer: Serializer<string> = {
  test(value): value is string {
    return typeof value === 'string'
  },

  serialize(value: string): string {
    return normalizeOutput(value)
  },
}

/**
 * Object serializer - handles plain objects
 */
export const ObjectSerializer: Serializer<object> = {
  test(value): value is object {
    return value !== null && typeof value === 'object'
  },

  serialize(value: object): string {
    return JSON.stringify(value, null, 2)
  },
}

/**
 * Normalize output for consistent snapshots
 * - Strips ANSI codes (optional, configurable)
 * - Normalizes line endings
 * - Trims trailing whitespace
 */
export function normalizeOutput(
  output: string,
  options: {
    stripAnsi?: boolean
    trimTrailing?: boolean
    normalizeLineEndings?: boolean
  } = {}
): string {
  let normalized = output

  // Strip ANSI codes if requested
  if (options.stripAnsi !== false) {
    // Default to stripping ANSI for cleaner snapshots
    normalized = stripAnsiCodes(normalized)
  }

  // Normalize line endings
  if (options.normalizeLineEndings !== false) {
    normalized = normalized.replace(/\r\n/g, '\n')
  }

  // Trim trailing whitespace from each line
  if (options.trimTrailing !== false) {
    normalized = normalized
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n')
  }

  return normalized
}

/**
 * Strip ANSI escape codes from string
 */
export function stripAnsiCodes(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ''
  )
}

/**
 * Default serializers in priority order
 */
export const defaultSerializers: Serializer[] = [ViewSerializer, StringSerializer, ObjectSerializer]

/**
 * Serialize a value using the appropriate serializer
 */
export async function serialize(
  value: unknown,
  serializers: Serializer[] = defaultSerializers
): Promise<string> {
  for (const serializer of serializers) {
    if (serializer.test(value)) {
      return await serializer.serialize(value)
    }
  }

  // Fallback: convert to string
  return String(value)
}
