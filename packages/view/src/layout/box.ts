/**
 * Box Layout - Container components with borders and styling
 *
 * Provides styled container components that can wrap other views
 * with borders, padding, and other visual treatments.
 */

import { Effect } from 'effect'
import { stringWidth } from '@tuix/view/string/width'
import type { View } from '../types'
import * as ViewUtils from '../primitives/view'
import {
  style,
  type Style,
  type Border,
  Borders,
  renderBox,
  BorderSide,
  renderStyledSync,
  pad as padToWidth,
} from '@tuix/ansi'
import { joinVertical, Center } from './join'

/**
 * Box properties
 */
export interface BoxProps {
  readonly border?: Border
  readonly borderSides?: BorderSide
  readonly padding?: number | { top?: number; right?: number; bottom?: number; left?: number }
  readonly minWidth?: number
  readonly minHeight?: number
  readonly style?: Style
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Normalize padding to individual values
 */
const normalizePadding = (
  padding?: number | { top?: number; right?: number; bottom?: number; left?: number }
) => {
  if (typeof padding === 'number') {
    return { top: padding, right: padding, bottom: padding, left: padding }
  }
  return {
    top: padding?.top || 0,
    right: padding?.right || 0,
    bottom: padding?.bottom || 0,
    left: padding?.left || 0,
  }
}

/**
 * Calculate content dimensions from lines
 */
const getContentDimensions = (lines: string[]) => ({
  width: Math.max(...lines.map(line => stringWidth(line)), 0),
  height: lines.length,
})

/**
 * Create padded lines with consistent width
 */
const createPaddedLines = (
  contentLines: string[],
  contentWidth: number,
  padding: { top: number; right: number; bottom: number; left: number }
): string[] => {
  const paddedWidth = contentWidth + padding.left + padding.right
  const paddedLines: string[] = []

  // Top padding
  paddedLines.push(...Array(padding.top).fill(' '.repeat(paddedWidth)))

  // Content with horizontal padding - use ANSI-aware padding
  for (const line of contentLines) {
    const padded =
      ' '.repeat(padding.left) + padToWidth(line, contentWidth) + ' '.repeat(padding.right)
    paddedLines.push(padded)
  }

  // Bottom padding
  paddedLines.push(...Array(padding.bottom).fill(' '.repeat(paddedWidth)))

  return paddedLines
}

/**
 * Adjust lines to final width if needed
 */
const adjustToFinalWidth = (
  lines: string[],
  currentWidth: number,
  finalWidth: number
): string[] => {
  if (finalWidth <= currentWidth) return lines

  const extraPadding = finalWidth - currentWidth
  return lines.map(line => line + ' '.repeat(extraPadding))
}

// =============================================================================
// Box Components
// =============================================================================

/**
 * Create a styled box around content
 */
export const styledBox = (content: View | View[], props: BoxProps = {}): View => {
  const contents = Array.isArray(content) ? content : [content]

  // If multiple views, join them vertically
  const innerView = contents.length === 1 ? contents[0] : joinVertical(Center, ...contents)

  // Calculate padding with helper
  const padding = normalizePadding(props.padding)

  return {
    render: () =>
      Effect.gen(function* (_) {
        // First render the inner content
        const innerContent = yield* _(innerView.render())
        let contentStr =
          typeof innerContent === 'string'
            ? innerContent
            : (innerContent as { content: string }).content

        // Apply style to content if provided
        if (props.style) {
          contentStr = renderStyledSync(contentStr, props.style)
        }

        const innerLines = contentStr.split('\n')

        // Calculate inner dimensions using helper
        const { width: innerWidth } = getContentDimensions(innerLines)

        // Apply border if specified
        if (props.border) {
          // Apply padding manually before passing to renderBox
          const paddedLines = createPaddedLines(innerLines, innerWidth, padding)
          const paddedWidth = innerWidth + padding.left + padding.right

          // Apply minWidth after padding
          const finalWidth = Math.max(paddedWidth, props.minWidth || 0)
          const adjustedLines = adjustToFinalWidth(paddedLines, paddedWidth, finalWidth)

          // renderBox expects width/height to include borders, and content to be pre-padded
          const totalWidth = finalWidth + 2 // +2 for left/right borders
          const totalHeight = adjustedLines.length + 2 // +2 for top/bottom borders

          const bordered = renderBox({
            width: totalWidth,
            height: totalHeight,
            border: props.border,
            sides: props.borderSides || BorderSide.All,
            content: adjustedLines,
            padding: 0, // Padding already applied
          })
          return bordered
        }

        // For non-bordered boxes, apply padding manually
        const paddedLines = createPaddedLines(innerLines, innerWidth, padding)
        const paddedWidth = innerWidth + padding.left + padding.right
        const finalWidth = Math.max(paddedWidth, props.minWidth || 0)
        const adjustedLines = adjustToFinalWidth(paddedLines, paddedWidth, finalWidth)
        return adjustedLines.join('\n')
      }),
    width: Math.max(
      (innerView.width || 0) + padding.left + padding.right + (props.border ? 2 : 0),
      (props.minWidth || 0) + (props.border ? 2 : 0)
    ),
    height: Math.max(
      (innerView.height || 0) + padding.top + padding.bottom + (props.border ? 2 : 0),
      (props.minHeight || 0) + (props.border ? 2 : 0)
    ),
  }
}

/**
 * Create a simple box - alias for styledBox
 */
export const box = styledBox

/**
 * Create a panel with rounded border and padding
 */
export const panel = (
  content: View | View[],
  props: Omit<BoxProps, 'border'> & { title?: string } = {}
): View => {
  return styledBox(content, {
    ...props,
    border: Borders.Rounded,
    padding: props.padding || 2,
  })
}

/**
 * Horizontal box layout - alias for ViewUtils.hstack
 */
export const hbox = ViewUtils.hstack

/**
 * Vertical box layout - alias for ViewUtils.vstack
 */
export const vbox = ViewUtils.vstack
