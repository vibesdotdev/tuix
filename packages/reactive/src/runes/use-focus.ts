/**
 * useFocus — a convenience rune for components that need to read their own
 * focus state without manually deriving a focusId and calling isFocused.
 *
 * The <interactive> intrinsic in @tuix/jsx handles registration; this hook
 * is for the component to read whether it's focused so it can style its
 * children (fg → primary, border → primary, etc.) — one call replaces the
 * 10-line boilerplate (derive id, register, read isFocused) per component.
 *
 * @example
 * ```tsx
 * const { focused, focusId } = useFocus(props.id ?? props.className)
 * return (
 *   <interactive focusable={focusId} onKeyPress={handleKey}>
 *     <text variant={focused ? 'primary' : 'default'}>{label}</text>
 *   </interactive>
 * )
 * ```
 */

import { isFocused, registerFocusable } from './focus'
import { $state } from './runes'

let autoId = 0

export interface UseFocusResult {
  /** True when this element is the focused widget. */
  readonly focused: boolean
  /** The focusId (pass to <interactive focusable={focusId}>). */
  readonly focusId: string
}

/**
 * Read the focus state for an element. If `id` is omitted, a stable
 * auto-incremented id is generated. Registration is re-done each call
 * (the same pattern <interactive> uses); the focus sweep removes stale
 * entries after each frame.
 */
export function useFocus(id?: string): UseFocusResult {
  const focusId =
    id !== undefined && id.length > 0
      ? id.startsWith('interactive:')
        ? id
        : `interactive:${id}`
      : `auto:${autoId++}`

  registerFocusable(focusId)
  return { focused: isFocused(focusId), focusId }
}
