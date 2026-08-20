/**
 * @tuix/reactive - Reactivity System
 *
 * Svelte-like runes and scope-aware reactivity for TUIX applications.
 *
 * @module reactive
 */

// =============================================================================
// Runes (Reactivity Primitives)
// =============================================================================

export {
  $state,
  $states,
  $derived,
  $effect,
  $bindable,
  isStateRune,
  isBindableRune,
  isDerivedRune,
  isRune,
  getValue,
  toBindable,
  runUntracked,
  beginModelExtraction,
  endModelExtraction,
  isModelExtracting,
  beginViewHydration,
  endViewHydration,
  bindMvuPush,
  getMvuPush,
  registerKeyHandler,
  emitKeyToHandlers,
  clearKeyHandlers,
} from './runes/runes'
export { useViewport, setViewportSize, type ViewportSize } from './runes/viewport'
export { useFocus, type UseFocusResult } from './runes/use-focus'
export { useAsync } from './runes/useAsync'
export type { AsyncState, UseAsyncOptions } from './runes/useAsync'
export { useBreakpoint, resolveBreakpoint, DEFAULT_BREAKPOINTS } from './runes/useBreakpoint'
export type { Breakpoint, BreakpointConfig } from './runes/useBreakpoint'
export type {
  StateRune,
  DerivedRune,
  BindableRune,
  Rune,
  BindableOptions,
  MvuSetMsg,
} from './runes/runes'
export {
  registerFocusable,
  unregisterFocusable,
  getFocusedId,
  setFocusedId,
  isFocused,
  cycleFocus,
  focusCount,
  dispatchFocusedKey,
  sweepFocusables,
  resetFocus,
  registerOverlayKeyHandler,
  registerBackdropHandler,
  dispatchOverlayKey,
  hasOverlayKeyHandlers,
  dispatchBackdropClick,
} from './runes/focus'
export type { ScopedKeyHandler } from './runes/focus'
export {
  memo,
  beginMemoFrame,
  endMemoFrame,
  resetMemoSlots,
  getMemoStats,
  isMemoActive,
} from './runes/memo'
export * from './runes/events'
export * from './runes/module'
export * from './runes/jsx-lifecycle'
export * from './runes/components/reactive-component'

// =============================================================================
// Runtime Integration
// =============================================================================

export * from './runtime'

// =============================================================================
// Reactive Event Channels
// =============================================================================

export * from './events/channels'
