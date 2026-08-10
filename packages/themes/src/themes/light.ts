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
    // Foreground colors
    primary: '#2563eb', // Blue 600
    secondary: '#7c3aed', // Violet 600
    accent: '#db2777', // Pink 600
    muted: '#9ca3af', // Gray 400

    // Background colors
    background: '#ffffff', // White
    backgroundAlt: '#f9fafb', // Gray 50

    // Semantic colors
    success: '#059669', // Emerald 600
    warning: '#d97706', // Amber 600
    error: '#dc2626', // Red 600
    info: '#0284c7', // Sky 600

    // UI element colors
    border: '#d1d5db', // Gray 300
    selection: '#bfdbfe', // Blue 200
    highlight: '#f3f4f6', // Gray 100

    // Text colors
    text: '#111827', // Gray 900
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
}
