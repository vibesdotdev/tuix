/**
 * @tuix/themes - Flat theme
 *
 * Crush-style flat design: one solid surface, no visible borders, a thick
 * accent bar for focus, and a four-level text hierarchy
 * (bright > normal > dim > faint). Structure comes from spacing and glyphs,
 * not boxes.
 */

import type { Theme } from '../types'

export const flatTheme: Theme = {
  name: 'flat',
  description: 'Borderless flat surface, accent focus bar, four-level text hierarchy',
  colors: {
    // Brand — Charple-tier violet accent
    primary: '#a78bfa',
    secondary: '#9ece6a',
    tertiary: '#7aa2f7',

    // Base — one flat surface (Pepper-tier); depth steps stay near-identical
    bg: '#151517',
    fg: '#a6a6ad',

    // Semantic
    success: '#9ece6a',
    danger: '#f7768e',
    warning: '#e0af68',
    info: '#7aa2f7',

    // UI elements — borders match the surface so boxes vanish
    border: '#151517',
    borderSubtle: '#151517',
    selection: '#26262c',
    highlight: '#1c1c20',

    // Four-level text hierarchy: Butter > Ash > Smoke > Squid
    textDim: '#77777f',
    textBright: '#fdf5ce',
    textFaint: '#4a4a52',
  },
  typography: {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    borderStyle: 'light',
  },
  spacing: {
    padding: 1,
    margin: 2,
    gap: 1,
  },
  depth: {
    base: '#151517',
    surface: '#151517',
    overlay: '#1b1b1f',
    inset: '#101012',
    outset: '#1d1d21',
  },
}
