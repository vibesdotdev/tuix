/**
 * @tuix/themes - Dark theme
 *
 * A dark theme with high contrast and vibrant accents.
 */

import type { Theme } from '../types'

export const darkTheme: Theme = {
  name: 'dark',
  description: 'High contrast dark theme with vibrant accents',
  colors: {
    // Brand colors
    primary: '#60a5fa',      // Blue 400
    secondary: '#a78bfa',    // Violet 400
    tertiary: '#f472b6',     // Pink 400

    // Base colors (dark theme)
    bg: '#111827',           // Gray 900
    fg: '#f3f4f6',           // Gray 100

    // Semantic colors
    success: '#34d399',      // Emerald 400
    danger: '#f87171',       // Red 400
    warning: '#fbbf24',      // Amber 400
    info: '#38bdf8',         // Sky 400

    // UI element colors (derived)
    border: '#374151',       // Gray 700
    borderSubtle: '#1f2937', // Gray 800
    selection: '#1e40af',    // Blue 800
    highlight: '#1f2937',    // Gray 800

    // Text variations (derived)
    textDim: '#9ca3af',      // Gray 400
    textBright: '#ffffff',   // White
  },
  typography: {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    borderStyle: 'rounded',
  },
  spacing: {
    padding: 1,
    margin: 1,
    gap: 1,
  },
}
