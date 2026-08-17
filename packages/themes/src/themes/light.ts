/**
 * @tuix/themes - Light theme
 *
 * A clean light theme optimized for daytime use.
 */

import type { Theme } from '../types'

export const lightTheme: Theme = {
  name: 'light',
  description: 'Clean light theme optimized for daytime use',
  colors: {
    // Brand colors
    primary: '#2563eb', // Blue 600
    secondary: '#7c3aed', // Violet 600
    tertiary: '#db2777', // Pink 600

    // Base colors (light theme)
    bg: '#ffffff', // White
    fg: '#111827', // Gray 900

    // Semantic colors
    success: '#059669', // Emerald 600
    danger: '#dc2626', // Red 600
    warning: '#d97706', // Amber 600
    info: '#0284c7', // Sky 600

    // UI element colors (derived)
    border: '#d1d5db', // Gray 300
    borderSubtle: '#e5e7eb', // Gray 200
    selection: '#bfdbfe', // Blue 200
    highlight: '#f9fafb', // Gray 50

    // Text variations (derived)
    textDim: '#6b7280', // Gray 500
    textBright: '#000000', // Black
  },
  typography: {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    borderStyle: 'single',
  },
  spacing: {
    padding: 1,
    margin: 1,
    gap: 1,
  },
  depth: {
    base: '#ffffff',
    surface: '#f3f4f6',
    overlay: '#e5e7eb',
    inset: '#f9fafb',
    outset: '#d1d5db',
  },
}
