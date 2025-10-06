/**
 * Event bridge utilities for JSX interactive primitives
 */

import type { View } from '@tuix/core/types'
import { Effect } from 'effect'

const INTERACTIVE_METADATA_KEY = Symbol.for('tuix.interactive')

export interface InteractiveEventMap {
  readonly onClick?: (event: ViewEvent) => unknown
  readonly onFocus?: (event: ViewEvent) => unknown
  readonly onBlur?: (event: ViewEvent) => unknown
  readonly onMouseEnter?: (event: ViewEvent) => unknown
  readonly onMouseLeave?: (event: ViewEvent) => unknown
  readonly onHover?: (event: ViewEvent) => unknown
  readonly onChange?: (value: unknown, event: ViewEvent) => unknown
  readonly onSubmit?: (value: unknown, event: ViewEvent) => unknown
  readonly onKeyPress?: (key: string, event: ViewEvent) => unknown
}

export interface InteractiveMetadata extends InteractiveEventMap {
  readonly focusable?: boolean
  readonly disabled?: boolean
  readonly className?: string
  readonly role?: string
  readonly tooltip?: string
  readonly value?: unknown
  readonly placeholder?: string
  readonly echoMode?: string
  readonly multiline?: boolean
}

export interface ViewEvent {
  readonly view: View
  readonly data?: Record<string, unknown>
}

export const attachMetadata = (view: View, metadata: InteractiveMetadata): View => {
  Object.defineProperty(view, INTERACTIVE_METADATA_KEY, {
    value: metadata,
    enumerable: false,
    configurable: false,
    writable: false,
  })
  return view
}

export const getMetadata = (view: View): InteractiveMetadata | undefined => {
  if (!view || typeof view !== 'object') return undefined
  const candidate = view as View & { [INTERACTIVE_METADATA_KEY]?: InteractiveMetadata }
  return candidate[INTERACTIVE_METADATA_KEY]
}

export const emitEvent = (
  view: View,
  event: keyof InteractiveEventMap,
  payload?: unknown,
  info?: Record<string, unknown>
) => {
  const metadata = getMetadata(view)
  if (!metadata) return

  const handler = metadata[event]
  if (typeof handler !== 'function') return

  const evt: ViewEvent = {
    view,
    data: info,
  }

  if (event === 'onChange' || event === 'onSubmit') {
    Effect.runSync(Effect.sync(() => handler(payload, evt)))
    return
  }

  if (event === 'onKeyPress' && typeof payload === 'string') {
    Effect.runSync(Effect.sync(() => handler(payload, evt)))
    return
  }

  Effect.runSync(Effect.sync(() => handler(evt)))
}
