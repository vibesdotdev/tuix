/**
 * @tuix/core - Foundation types, errors, constants, services, and context
 *
 * Provides the foundational building blocks for TUIX applications.
 *
 * @module core
 */

// =============================================================================
// Core Types
// =============================================================================

export * from './types'
export * as Schemas from './types/schemas'

// =============================================================================
// Error Handling
// =============================================================================

export {
  TerminalError,
  InputError,
  RenderError,
  StorageError,
  ConfigError,
  ComponentError,
  ApplicationError,
  ValidationError,
  ErrorUtils,
  withErrorBoundary,
  withRecovery,
  RecoveryStrategies,
} from './types/errors'

// =============================================================================
// External Dependencies Re-exports
// =============================================================================

export { Effect, Context, Layer, Stream, Queue, Ref } from 'effect'
export { z as Schema } from 'zod'

// =============================================================================
// Core Constants
// =============================================================================

export * from './constants'

// =============================================================================
// Context System
// =============================================================================

export {
  ComponentContext,
  ComponentContextRef,
  useComponentContext,
  withComponentContext,
  type ComponentContextValue,
} from './context'

// =============================================================================
// Events
// =============================================================================

export * from './events'

// =============================================================================
// Services
// =============================================================================

export * from './services'

// =============================================================================
// Module System
// =============================================================================

export * from './module/base'
export * from './module/registry'
