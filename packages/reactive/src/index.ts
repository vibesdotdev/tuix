/**
 * @tuix/reactive - Reactivity System
 *
 * Svelte-like runes, scope management, and event bus for TUIX applications.
 *
 * @module reactive
 */

// =============================================================================
// Runes (Reactivity Primitives)
// =============================================================================

export { $state, $derived, $effect, isStateRune, isBindableRune } from './runes/runes'
export type { StateRune, DerivedRune, BindableRune } from './runes/runes'
export * from './runes/events'
export * from './runes/module'
export * from './runes/jsx-lifecycle'
export * from './runes/components/reactive-component'

// =============================================================================
// Scope Management
// =============================================================================

export * from './scope/manager'
export * from './scope/types'
export * from './scope/jsx/hooks'
export * from './scope/jsx/components'
export * from './scope/jsx/stores'

// =============================================================================
// Event Bus
// =============================================================================

export * from './events/event-bus'
export * from './events/channels'
