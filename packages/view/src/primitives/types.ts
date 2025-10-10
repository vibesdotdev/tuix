/**
 * View Types - Core type definitions for the view system
 */

import type { Effect } from 'effect'

/**
 * View - A renderable UI component
 *
 * Views are the fundamental building blocks of the TUIX rendering system.
 * They are pure, composable units that can be combined, styled, and rendered.
 */
export interface View {
  /**
   * Render the view to a string or structured output
   *
   * @returns Effect that produces either a string or an object with content/width/height
   */
  render: () => Effect.Effect<string | { content: string; width: number; height: number }, RenderError, never>

  /**
   * Width of the view in terminal columns
   */
  width?: number

  /**
   * Height of the view in terminal rows/lines
   */
  height?: number
}

/**
 * Render error type
 */
export class RenderError extends Error {
  readonly _tag = 'RenderError'

  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'RenderError'
  }
}

/**
 * App services interface for dynamic layouts
 */
export interface AppServices {
  // Placeholder for future app-level services
  [key: string]: unknown
}
