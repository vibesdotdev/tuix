/**
 * ToastViewport + toast store - stacked notifications with auto-dismiss
 *
 * A store owns the queue; the viewport paints it. One store per surface.
 *
 * @example
 * ```tsx
 * const toasts = createToastStore()
 *
 * toasts.push('success', 'Saved')
 * toasts.success('Saved')
 *
 * <ToastViewport store={toasts} />
 * ```
 */

/** @jsxImportSource @tuix/jsx */

import { $state, $derived } from '@tuix/reactive'
import type { StateRune } from '@tuix/reactive'
import { Toast, type ToastKind } from '../toast/Toast'

export interface QueuedToast {
  id: number
  kind: ToastKind
  message: string
  icon?: string
  /** ms until auto-dismiss; 0 = sticky. */
  duration: number
}

export interface ToastStore {
  /** Visible stack, oldest first. */
  toasts: () => QueuedToast[]
  push: (kind: ToastKind, message: string, opts?: { icon?: string; duration?: number }) => number
  dismiss: (id: number) => void
  clear: () => void
  success: (message: string, opts?: { icon?: string; duration?: number }) => number
  info: (message: string, opts?: { icon?: string; duration?: number }) => number
  warning: (message: string, opts?: { icon?: string; duration?: number }) => number
  danger: (message: string, opts?: { icon?: string; duration?: number }) => number
}

export interface ToastStoreOptions {
  /** Max simultaneous toasts; overflow is queued (default 3). */
  maxVisible?: number
  /** Default auto-dismiss ms (default 4000; 0 = sticky). */
  defaultDuration?: number
}

export function createToastStore(options: ToastStoreOptions = {}): ToastStore {
  const maxVisible = options.maxVisible ?? 3
  const defaultDuration = options.defaultDuration ?? 4000

  const queue = $state<QueuedToast[]>([], 'toast-queue')
  let nextId = 1

  const timers = new Map<number, ReturnType<typeof setTimeout>>()

  function schedule(toast: QueuedToast) {
    if (toast.duration <= 0) return
    const timer = setTimeout(() => dismiss(toast.id), toast.duration)
    timers.set(toast.id, timer)
  }

  function drain() {
    const visible = queue()
    const overflow = visible.length - maxVisible
    if (overflow > 0) {
      // Drop the oldest toasts beyond capacity.
      const keep = visible.slice(overflow)
      const dropped = visible.slice(0, overflow)
      for (const toast of dropped) {
        const timer = timers.get(toast.id)
        if (timer) clearTimeout(timer)
        timers.delete(toast.id)
      }
      queue.$set(keep)
    }
  }

  function push(
    kind: ToastKind,
    message: string,
    opts?: { icon?: string; duration?: number }
  ): number {
    const id = nextId++
    const toast: QueuedToast = {
      id,
      kind,
      message,
      icon: opts?.icon,
      duration: opts?.duration ?? defaultDuration,
    }
    queue.$set([...queue(), toast])
    drain()
    schedule(toast)
    return id
  }

  function dismiss(id: number) {
    const timer = timers.get(id)
    if (timer) clearTimeout(timer)
    timers.delete(id)
    queue.$set(queue().filter(toast => toast.id !== id))
  }

  function clear() {
    for (const timer of timers.values()) clearTimeout(timer)
    timers.clear()
    queue.$set([])
  }

  return {
    toasts: () => queue(),
    push,
    dismiss,
    clear,
    success: (message, opts) => push('success', message, opts),
    info: (message, opts) => push('info', message, opts),
    warning: (message, opts) => push('warning', message, opts),
    danger: (message, opts) => push('danger', message, opts),
  }
}

export interface ToastViewportProps {
  store: ToastStore
  /** Collapse the stack to the last N toasts when painting (default 3). */
  maxVisible?: number
  className?: string
}

/**
 * Paints a toast store as a bottom-anchored stack. Render it once per
 * surface; drive it with `store.push(...)`.
 */
export function ToastViewport(props: ToastViewportProps): JSX.Element | null {
  const maxVisible = props.maxVisible ?? 3
  const visible = props.store.toasts().slice(-maxVisible)

  if (visible.length === 0) return null

  return (
    <vstack className={props.className} gap={1}>
      {visible.map(toast => (
        <Toast
          key={toast.id}
          kind={toast.kind}
          message={toast.message}
          icon={toast.icon}
          onDismiss={() => props.store.dismiss(toast.id)}
          duration={0}
        />
      ))}
    </vstack>
  )
}
