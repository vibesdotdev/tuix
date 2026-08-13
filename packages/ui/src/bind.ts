import { isBindableRune, isStateRune } from '@tuix/reactive'

/** Read a `bind:value` rune or a plain value. */
export function readBound<T>(value: T | { (): T } | undefined | null): T | undefined {
  if (value == null) return undefined
  if (isBindableRune(value) || isStateRune(value)) {
    return value() as T
  }
  return value as T
}

/** Flatten JSX children into a single label. */
export function labelOf(children: unknown, fallback = ''): string {
  if (children == null || typeof children === 'boolean') return fallback
  if (typeof children === 'string' || typeof children === 'number') return String(children)
  if (Array.isArray(children)) {
    const joined = children.map(child => labelOf(child)).join('')
    return joined || fallback
  }
  return fallback
}
