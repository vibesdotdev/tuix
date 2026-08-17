/**
 * @tuix/themes - Nord theme
 *
 * Arctic, north-bluish color palette based on Nord theme.
 * https://www.nordtheme.com/
 */

import type { Theme } from '../types'

export const nordTheme: Theme = {
  name: 'nord',
  description: 'Arctic, north-bluish color palette',
  colors: {
    // Brand colors
    primary: '#88c0d0', // Nord 8 - Frost
    secondary: '#81a1c1', // Nord 9 - Frost
    tertiary: '#b48ead', // Nord 15 - Aurora Purple

    // Base colors (dark theme)
    bg: '#2e3440', // Nord 0 - Polar Night
    fg: '#eceff4', // Nord 6 - Snow Storm

    // Semantic colors
    success: '#a3be8c', // Nord 14 - Aurora Green
    danger: '#bf616a', // Nord 11 - Aurora Red
    warning: '#ebcb8b', // Nord 13 - Aurora Yellow
    info: '#5e81ac', // Nord 10 - Frost

    // UI element colors (derived)
    border: '#434c5e', // Nord 2 - Polar Night
    borderSubtle: '#3b4252', // Nord 1 - Polar Night
    selection: '#434c5e', // Nord 2 - Polar Night
    highlight: '#3b4252', // Nord 1 - Polar Night

    // Text variations (derived)
    textDim: '#d8dee9', // Nord 4 - Snow Storm
    textBright: '#eceff4', // Nord 6 - Snow Storm
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
    base: '#2e3440',
    surface: '#3b4252',
    overlay: '#434c5e',
    inset: '#242933',
    outset: '#4c566a',
  },
}
