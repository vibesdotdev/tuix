/**
 * Async loading state helper rune.
 *
 * Wraps an async operation and provides reactive {loading, data, error} state.
 * Automatically manages loading spinners and error display.
 *
 * @since 1.0.0
 */

import { $state } from './runes'

/**
 * Async operation state.
 */
export interface AsyncState<T> {
  /** Whether the operation is currently in progress. */
  loading: boolean
  /** The resolved data (undefined while loading or on error). */
  data: T | undefined
  /** The error if the operation failed (undefined on success). */
  error: Error | undefined
  /** Re-execute the async operation. */
  reload: () => void
  /** Whether data has been loaded at least once. */
  hasLoaded: boolean
}

/**
 * Options for useAsync.
 */
export interface UseAsyncOptions {
  /** Whether to execute immediately on creation (default: true). */
  immediate?: boolean
  /** Retry count on failure (default: 0). */
  retries?: number
  /** Retry delay in ms (default: 1000). */
  retryDelay?: number
}

/**
 * Create a reactive async state from a promise-returning function.
 *
 * @example
 * ```tsx
 * const users = useAsync(async () => {
 *   const res = await fetch('/api/users')
 *   return res.json()
 * })
 *
 * // In view:
 * if (users.loading) return <Spinner />
 * if (users.error) return <Alert variant="error">{users.error.message}</Alert>
 * return <Table data={users.data} />
 * ```
 */
export function useAsync<T>(
  fn: () => Promise<T>,
  options: UseAsyncOptions = {}
): AsyncState<T> {
  const { immediate = true, retries = 0, retryDelay = 1000 } = options

  const loading = $state(immediate, 'async_loading')
  const data = $state<T | undefined>(undefined, 'async_data')
  const error = $state<Error | undefined>(undefined, 'async_error')
  const hasLoaded = $state(false, 'async_hasLoaded')

  let attempt = 0

  const execute = async () => {
    loading.$set(true)
    error.$set(undefined)
    attempt = 0

    const tryOnce = async (): Promise<void> => {
      try {
        const result = await fn()
        data.$set(result)
        hasLoaded.$set(true)
        loading.$set(false)
      } catch (e) {
        attempt++
        if (attempt <= retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          return tryOnce()
        }
        error.$set(e instanceof Error ? e : new Error(String(e)))
        loading.$set(false)
      }
    }

    await tryOnce()
  }

  if (immediate) {
    // Kick off on next microtask to allow the caller to read initial state.
    queueMicrotask(() => execute())
  }

  return {
    get loading() { return loading() },
    get data() { return data() },
    get error() { return error() },
    get hasLoaded() { return hasLoaded() },
    reload: () => { execute() },
  }
}
