/**
 * Input Service - Keyboard, mouse, and terminal event handling
 *
 * This service manages all input events from the terminal, including keyboard
 * input with modifier keys, mouse events, and terminal resize events.
 */

import { Effect, Context, Stream } from 'effect'
import type { InputError, KeyEvent, MouseEvent, WindowSize } from '../core/types'

// Re-export types for convenience
export type { KeyEvent, MouseEvent } from '../core/types'

/**
 * The InputService interface defines all input event handling capabilities.
 * Events are delivered as Effect Streams for reactive programming patterns.
 */
export class InputService extends Context.Tag('InputService')<
  InputService,
  {
    // =============================================================================
    // Event Streams
    // =============================================================================

    /**
     * Stream of keyboard events including key presses and releases.
     * Handles special keys, modifier combinations, and ANSI escape sequences.
     */
    readonly keyEvents: Stream.Stream<KeyEvent, InputError, never>

    /**
     * Stream of mouse events including clicks, drags, and wheel events.
     * Only available when mouse mode is enabled.
     */
    readonly mouseEvents: Stream.Stream<MouseEvent, InputError, never>

    /**
     * Stream of terminal resize events.
     * Triggered when the terminal window size changes.
     */
    readonly resizeEvents: Stream.Stream<WindowSize, InputError, never>

    /**
     * Stream of paste events when bracketed paste mode is enabled.
     * Helps distinguish pasted content from typed content.
     */
    readonly pasteEvents: Stream.Stream<string, InputError, never>

    // =============================================================================
    // Mouse Control
    // =============================================================================

    /**
     * Enable mouse input tracking.
     * Must be called before mouse events will be generated.
     */
    readonly enableMouse: Effect.Effect<void, InputError, never>

    /**
     * Disable mouse input tracking.
     */
    readonly disableMouse: Effect.Effect<void, InputError, never>

    /**
     * Enable mouse motion tracking (mouse move events).
     * This can generate a lot of events, use carefully.
     */
    readonly enableMouseMotion: Effect.Effect<void, InputError, never>

    /**
     * Disable mouse motion tracking.
     */
    readonly disableMouseMotion: Effect.Effect<void, InputError, never>

    // =============================================================================
    // Paste Handling
    // =============================================================================

    /**
     * Enable bracketed paste mode.
     * This wraps pasted content in special escape sequences.
     */
    readonly enableBracketedPaste: Effect.Effect<void, InputError, never>

    /**
     * Disable bracketed paste mode.
     */
    readonly disableBracketedPaste: Effect.Effect<void, InputError, never>

    // =============================================================================
    // Focus Tracking
    // =============================================================================

    /**
     * Enable focus tracking to detect when terminal gains/loses focus.
     */
    readonly enableFocusTracking: Effect.Effect<void, InputError, never>

    /**
     * Disable focus tracking.
     */
    readonly disableFocusTracking: Effect.Effect<void, InputError, never>

    /**
     * Stream of focus events (focus gained/lost).
     */
    readonly focusEvents: Stream.Stream<{ focused: boolean }, InputError, never>

    // =============================================================================
    // Input Utilities
    // =============================================================================

    /**
     * Read a single key press synchronously.
     * Useful for prompts and confirmation dialogs.
     */
    readonly readKey: Effect.Effect<KeyEvent, InputError, never>

    /**
     * Read a line of input synchronously.
     * Returns when Enter is pressed.
     */
    readonly readLine: Effect.Effect<string, InputError, never>

    /**
     * Check if input is available without blocking.
     */
    readonly inputAvailable: Effect.Effect<boolean, InputError, never>

    /**
     * Flush any pending input.
     */
    readonly flushInput: Effect.Effect<void, InputError, never>

    // =============================================================================
    // Key Binding Utilities
    // =============================================================================

    /**
     * Create a stream that filters key events by a predicate.
     * Useful for implementing custom key bindings.
     */
    readonly filterKeys: (
      predicate: (key: KeyEvent) => boolean
    ) => Stream.Stream<KeyEvent, InputError, never>

    /**
     * Create a stream that maps key events to custom messages.
     * This is the foundation for implementing keyboard shortcuts.
     */
    readonly mapKeys: <T>(
      mapper: (key: KeyEvent) => T | null
    ) => Stream.Stream<T, InputError, never>

    /**
     * Debounce key events to prevent rapid repeated events.
     * Useful for handling key repeat in text input.
     */
    readonly debounceKeys: (ms: number) => Stream.Stream<KeyEvent, InputError, never>

    // =============================================================================
    // Advanced Input Processing
    // =============================================================================

    /**
     * Parse raw ANSI escape sequences into structured events.
     * This is used internally but exposed for advanced use cases.
     */
    readonly parseAnsiSequence: (
      sequence: string
    ) => Effect.Effect<KeyEvent | MouseEvent | null, InputError, never>

    /**
     * Get the raw input stream as bytes.
     * Useful for custom input processing or debugging.
     */
    readonly rawInput: Stream.Stream<Uint8Array, InputError, never>

    /**
     * Enable/disable input echo.
     * When disabled, typed characters won't appear on screen.
     */
    readonly setEcho: (enabled: boolean) => Effect.Effect<void, InputError, never>
  }
>() {}
