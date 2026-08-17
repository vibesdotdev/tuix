/**
 * @tuix/themes - Gruvbox theme
 *
 * Retro groove color scheme based on the Gruvbox palette.
 * https://github.com/morhetz/gruvbox
 */

import type { Theme } from '../types'

export const gruvboxTheme: Theme = {
  name: 'gruvbox',
  description: 'Retro groove palette with warm, earthy contrast',
  colors: {
    // Brand colors
    primary: '#8ec07c', // Aqua
    secondary: '#fabd2f', // Yellow
    tertiary: '#d3869b', // Purple

    // Base colors (dark theme)
    bg: '#282828', // Background
    fg: '#ebdbb2', // Foreground

    // Semantic colors
    success: '#b8bb26', // Green
    danger: '#fb4934', // Red
    warning: '#fe8019', // Orange
    info: '#83a598', // Blue

    // UI element colors (derived)
    border: '#3c3836', // Bg2
    borderSubtle: '#32302f', // Bg1
    selection: '#458588', // Blue (faded)
    highlight: '#32302f', // Bg1

    // Text variations (derived)
    textDim: '#928374', // Gray (faded)
    textBright: '#fbf1c7', // Bright foreground
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
    base: '#282828',
    surface: '#32302f',
    overlay: '#3c3836',
    inset: '#1d2021',
    outset: '#504945',
  },
}
