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
// Runtime Integration
// =============================================================================

export * from './runtime'

// =============================================================================
// Event Bus
// =============================================================================

export * from './events/event-bus'
export * from './events/channels'
