/**
 * String width calculation utility with ANSI support
 *
 * This module provides ANSI-aware string width calculation for terminal UIs.
 * It strips ANSI escape sequences and handles multiline strings correctly.
 */

import { visualWidth, truncate, pad } from '@tuix/ansi'

/**
 * Calculate the visual width of a string in terminal columns
 *
 * Handles ANSI escape sequences and multiline strings correctly:
 * - Strips ANSI codes before measuring
 * - For multiline strings, returns the width of the longest line
 * - Uses Bun's native stringWidth for accurate emoji and wide character detection
 *
 * @param str - The string to measure
 * @returns The width in terminal columns
 */
export const stringWidth = (str: string): number => {
  if (!str) return 0

  // Handle multiline strings - return width of longest line
  if (str.includes('\n')) {
    const lines = str.split('\n')
    return Math.max(...lines.map(line => visualWidth(line)), 0)
  }

  // Single line - use visualWidth which strips ANSI
  return visualWidth(str)
}

/**
 * Truncate a string to fit within a given width
 *
 * Delegates to @tuix/ansi's truncate function which handles ANSI codes correctly.
 *
 * @param str - The string to truncate
 * @param maxWidth - Maximum width in columns
 * @param suffix - Suffix to append when truncated (default: "…")
 * @returns Truncated string
 */
export const truncateString = (str: string, maxWidth: number, suffix = '…'): string => {
  // Use @tuix/ansi's truncate which properly handles ANSI codes
  return truncate(str, maxWidth, suffix)
}

/**
 * Pad a string to a specific width
 *
 * Delegates to @tuix/ansi's pad function which handles ANSI codes correctly.
 *
 * @param str - The string to pad
 * @param width - Target width
 * @param align - Alignment (left, center, right)
 * @returns Padded string
 */
export const padString = (
  str: string,
  width: number,
  align: 'left' | 'center' | 'right' = 'left'
): string => {
  // Use @tuix/ansi's pad which properly handles ANSI codes
  return pad(str, width, align)
}
