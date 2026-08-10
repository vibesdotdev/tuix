/**
 * TUIX Core Types - Framework interfaces and definitions
 *
 * This module provides the core framework interfaces that define how
 * the TUIX application system works. These are the primary contracts
 * for components, services, and runtime state.
 */

import { Effect, Stream, Context } from 'effect'
import type { RenderError, TerminalError, InputError, StorageError } from './errors'
import type { WindowSize, Viewport, TerminalCapabilities, KeyEvent, MouseEvent } from './common'

// =============================================================================
// Core Framework Types
// =============================================================================

/**
 * Command type - represents an effect that produces a message
 */
export type Cmd<Msg> = Effect.Effect<Msg, never, AppServices>

/**
 * Subscription type - represents a stream of messages
 */
export type Sub<Msg> = Stream.Stream<Msg, never, AppServices>

/**
 * View interface - defines the structure of a view in the framework
 */
export interface View {
  readonly render: () => Effect.Effect<string, RenderError, never>
  readonly width?: number
  readonly height?: number
}

/**
 * Component interface - defines the contract for TUIX components
 *
 * Components are the building blocks of TUIX applications. They define:
 * - How to initialize state (init)
 * - How to update state in response to messages (update)
 * - How to render themselves (view)
 */
export interface Component<Model, Msg> {
  /**
   * Initialize the component and return the initial model and any startup commands.
   */
  readonly init: Effect.Effect<readonly [Model, ReadonlyArray<Cmd<Msg>>], never, AppServices>

  /**
   * Process a message and return the updated model and any commands to execute.
   * This is where all state transitions happen.
   */
  readonly update: (
    model: Model,
    msg: Msg
  ) => Effect.Effect<readonly [Model, ReadonlyArray<Cmd<Msg>>], never, AppServices>

  /**
   * Render the component's view given its current model.
   * Can be async - runtime will await the result.
   */
  readonly view: (model: Model) => View | Promise<View>

  /**
   * Define subscriptions to external events that should be processed by this component.
   */
  readonly subscriptions?: (model: Model) => ReadonlyArray<Effect.Effect<Msg, never, AppServices>>
}

/**
 * Application options configuration
 */
export interface AppOptions {
  readonly alternateScreen?: boolean
  readonly mouse?: boolean
  readonly fps?: number
  readonly exitKeys?: ReadonlyArray<string>
  readonly debug?: boolean
}

/**
 * Terminal service - provides low-level terminal interaction capabilities
 */
export interface TerminalService
  extends Context.Tag<
    'TerminalService',
    {
      readonly clear: Effect.Effect<void, TerminalError, never>
      readonly write: (text: string) => Effect.Effect<void, TerminalError, never>
      readonly writeLine: (text: string) => Effect.Effect<void, TerminalError, never>
      readonly moveCursor: (x: number, y: number) => Effect.Effect<void, TerminalError, never>
      readonly moveCursorRelative: (
        dx: number,
        dy: number
      ) => Effect.Effect<void, TerminalError, never>
      readonly hideCursor: Effect.Effect<void, TerminalError, never>
      readonly showCursor: Effect.Effect<void, TerminalError, never>
      readonly getTerminalSize: Effect.Effect<WindowSize, TerminalError, never>
    }
  > {}

/**
 * Input service - handles keyboard, mouse, and other input events
 */
export interface InputService
  extends Context.Tag<
    'InputService',
    {
      readonly keyEvents: Sub<KeyEvent>
      readonly mouseEvents: Sub<MouseEvent>
      readonly resizeEvents: Sub<WindowSize>
      readonly pasteEvents: Sub<string>
      readonly focusEvents: Sub<{ focused: boolean }>
      readonly enableMouse: Effect.Effect<void, InputError, never>
      readonly disableMouse: Effect.Effect<void, InputError, never>
      readonly enableMouseMotion: Effect.Effect<void, InputError, never>
      readonly disableMouseMotion: Effect.Effect<void, InputError, never>
      readonly enableBracketedPaste: Effect.Effect<void, InputError, never>
      readonly disableBracketedPaste: Effect.Effect<void, InputError, never>
      readonly enableFocusTracking: Effect.Effect<void, InputError, never>
      readonly disableFocusTracking: Effect.Effect<void, InputError, never>
      readonly readKey: Effect.Effect<KeyEvent, InputError, never>
      readonly readLine: Effect.Effect<string, InputError, never>
      readonly inputAvailable: Effect.Effect<boolean, InputError, never>
      readonly filterKeys: (
        predicate: (key: KeyEvent) => boolean
      ) => Stream.Stream<KeyEvent, InputError, never>
      readonly mapKeys: <T>(
        mapper: (key: KeyEvent) => T | null
      ) => Stream.Stream<T, InputError, never>
      readonly debounceKeys: (ms: number) => Stream.Stream<KeyEvent, InputError, never>
      readonly parseAnsiSequence: (
        sequence: string
      ) => Effect.Effect<KeyEvent | null, InputError, never>
    }
  > {}

/**
 * Renderer service - handles the rendering of views to terminal output
 */
export interface RendererService
  extends Context.Tag<
    'RendererService',
    {
      readonly render: (view: View) => Effect.Effect<void, RenderError, never>
      readonly beginFrame: Effect.Effect<void, RenderError, never>
      readonly endFrame: Effect.Effect<void, RenderError, never>
      readonly forceRedraw: Effect.Effect<void, RenderError, never>
      readonly setViewport: (viewport: Viewport) => Effect.Effect<void, RenderError, never>
      readonly getViewport: Effect.Effect<Viewport, RenderError, never>
      readonly pushViewport: (viewport: Viewport) => Effect.Effect<void, RenderError, never>
      readonly popViewport: Effect.Effect<void, RenderError, never>
    }
  > {}

/**
 * Storage service - handles persistent state management
 */
export interface StorageService
  extends Context.Tag<
    'StorageService',
    {
      readonly saveState: <T>(key: string, data: T) => Effect.Effect<void, StorageError, never>
      readonly loadState: <T>(key: string) => Effect.Effect<T | null, StorageError, never>
      readonly clearState: (key: string) => Effect.Effect<void, StorageError, never>
      readonly hasState: (key: string) => Effect.Effect<boolean, StorageError, never>
      readonly listStateKeys: Effect.Effect<ReadonlyArray<string>, StorageError, never>
      readonly loadConfig: <T>(
        appName: string,
        key: string
      ) => Effect.Effect<T | null, StorageError, never>
    }
  > {}

/**
 * Union of all application services.
 */
export type AppServices = TerminalService | InputService | RendererService | StorageService

/**
 * Extract the model type from a component
 */
export type ModelOf<T> = T extends Component<infer M, unknown> ? M : never

/**
 * Extract the message type from a component
 */
export type MsgOf<T> = T extends Component<unknown, infer Msg> ? Msg : never

/**
 * Program interface - represents a complete application program
 *
 * Programs are components with additional configuration options.
 */
export interface Program<Model, Msg> extends Component<Model, Msg> {
  readonly options?: AppOptions
}

/**
 * Runtime state - holds the current state of an application during execution
 */
export interface RuntimeState<Model> {
  readonly model: Model
  readonly running: boolean
  readonly viewport: Viewport
  readonly capabilities: TerminalCapabilities
}
