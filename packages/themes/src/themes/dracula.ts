/**
 * @tuix/themes - Dracula theme
 *
 * A dark theme with vibrant colors inspired by Dracula theme.
 * https://draculatheme.com/
 */

import type { Theme } from '../types'

export const draculaTheme: Theme = {
  name: 'dracula',
  description: 'Dark theme with vibrant colors',
  colors: {
    // Brand colors
    primary: '#8be9fd', // Cyan
    secondary: '#bd93f9', // Purple
    tertiary: '#ff79c6', // Pink

    // Base colors (dark theme)
    bg: '#282a36', // Background
    fg: '#f8f8f2', // Foreground

    // Semantic colors
    success: '#50fa7b', // Green
    danger: '#ff5555', // Red
    warning: '#f1fa8c', // Yellow
    info: '#8be9fd', // Cyan

    // UI element colors (derived)
    border: '#44475a', // Current Line
    borderSubtle: '#343746', // Deeper current line
    selection: '#44475a', // Selection
    highlight: '#44475a', // Current Line

    // Text variations (derived)
    textDim: '#6272a4', // Comment
    textBright: '#ffffff', // White
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
  depth: {
    base: '#282a36',
    surface: '#343746',
    overlay: '#44475a',
    inset: '#21222c',
    outset: '#6272a4',
  },
}
