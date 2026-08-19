/**
 * View Types - Core type definitions for the view system
 */

import type { Effect } from 'effect'

/**
 * Containing rect passed to a view at render time. The renderer supplies the
 * terminal size at the root; layout containers pass each child the rect the
 * child was allocated. Enables `'fill'` and percentage sizing to resolve.
 */
export interface RenderContext {
  readonly width: number
  readonly height: number
}

/**
 * Terminal size unit: fixed cells, `'fill'` (the containing rect's size on
 * that axis), or a percentage of it (`'50%'`).
 */
export type SizeValue = number | 'fill' | `${number}%`

/** Rect + paint options for {@link fillView}. */
export interface FillViewOptions {
  /** Target size; `'fill'`/percent resolve against the render context. */
  width?: SizeValue
  height?: SizeValue
  /** Background painted across the full rect (hex). */
  background?: string
  /** Foreground applied to content (hex). */
  foreground?: string
}

/**
 * View - A renderable UI component
 *
 * Views are pure, composable units that can be combined, styled, and rendered.
 */
export interface View {
  /**
   * Render the view to a string or structured output
   *
   * @param context - containing rect (terminal size at the root, the
   * allocated cell rect inside layouts). Optional: content-sized views
   * ignore it.
   * @returns Effect that produces either a string or an object with content/width/height
   */
  render: (
    context?: RenderContext
  ) => Effect.Effect<
    string | { content: string; width: number; height: number },
    RenderError,
    never
  >

  /**
   * Width of the view in terminal columns
   */
  width?: number

  /**
   * Height of the view in terminal rows/lines
   */
  height?: number

  /**
   * Background color (hex) this view paints across its allocated rect, even
   * where its content has no styled cells. Layout parents read this to
   * pre-fill the child's rect so backgrounds cover the full area.
   */
  background?: string
}

/**
 * Resolve a {@link SizeValue} against a containing rect.
 * - numbers pass through
 * - `'fill'` takes the full context size on that axis
 * - `'50%'` takes the fraction of it
 * Without a context (or an invalid percentage), falls back to `natural`.
 */
export function resolveSize(
  value: SizeValue | undefined,
  axis: 'width' | 'height',
  context: RenderContext | undefined,
  natural: number
): number {
  if (value === undefined || value === null) return natural
  if (typeof value === 'number') return Math.max(0, Math.round(value))
  if (value === 'fill') {
    return context ? Math.max(0, context[axis]) : natural
  }
  const match = /^(\d+(?:\.\d+)?)%$/.exec(value)
  if (match && context) {
    return Math.max(0, Math.round((Number(match[1]) / 100) * context[axis]))
  }
  return natural
}

/**
 * Render error type
 */
export class RenderError extends Error {
  readonly _tag = 'RenderError'

  constructor(
    message: string,
    readonly cause?: unknown
  ) {
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
