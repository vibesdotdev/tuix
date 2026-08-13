/**
 * @tuix/themes - Vibes theme
 *
 * Modern black, white, and green theme with clean rounded borders.
 * Perfect for showing off what TUIX can do.
 */

import type { Theme } from '../types'

export const vibesTheme: Theme = {
  name: 'vibes',
  description: 'Modern dark theme with green accents',
  colors: {
    // Brand colors
    primary: '#22c55e', // Green 500
    secondary: '#10b981', // Emerald 500
    tertiary: '#14b8a6', // Teal 500

    // Base colors (dark theme)
    bg: '#000000', // Pure black
    fg: '#ffffff', // Pure white

    // Semantic colors
    success: '#22c55e', // Green
    danger: '#ef4444', // Red 500
    warning: '#f59e0b', // Amber 500
    info: '#3b82f6', // Blue 500

    // UI element colors (derived)
    border: '#222222', // Dark gray
    borderSubtle: '#1a1a1a', // Subtle dark gray
    selection: '#1a3a1a', // Dark green tint
    highlight: '#1a2a1a', // Subtle green highlight

    // Text variations (derived)
    textDim: '#9ca3af', // Gray 400
    textBright: '#ffffff', // Pure white
  },
  typography: {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    borderStyle: 'rounded', // Clean rounded borders
  },
  spacing: {
    padding: 1,
    margin: 1,
    gap: 1,
  },
  depth: {
    base: '#000000',
    surface: '#0c0c0c',
    overlay: '#161616',
    inset: '#050505',
    outset: '#222222',
  },
}
