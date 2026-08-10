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
    // Foreground colors
    primary: '#8be9fd', // Cyan
    secondary: '#bd93f9', // Purple
    accent: '#ff79c6', // Pink
    muted: '#6272a4', // Comment

    // Background colors
    background: '#282a36', // Background
    backgroundAlt: '#44475a', // Current Line

    // Semantic colors
    success: '#50fa7b', // Green
    warning: '#f1fa8c', // Yellow
    error: '#ff5555', // Red
    info: '#8be9fd', // Cyan

    // UI element colors
    border: '#44475a', // Current Line
    selection: '#44475a', // Selection
    highlight: '#44475a', // Current Line

    // Text colors
    text: '#f8f8f2', // Foreground
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
}
