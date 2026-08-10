/**
 * LargeText — 3-row block glyphs for short banners (ASCII art).
 */

import { Text } from '../text/Text'
import { Box } from '../../layout/box/Box'

export interface LargeTextProps {
  children: string
  color?: string
}

/** Minimal 3-row font for A-Z, 0-9, space, and a few symbols. */
const GLYPHS: Record<string, [string, string, string]> = {
  ' ': ['   ', '   ', '   '],
  A: ['█▀█', '█▀█', '▀ █'],
  B: ['█▀▄', '█▀▄', '█▄▀'],
  C: ['█▀▀', '█  ', '█▄▄'],
  D: ['█▀▄', '█ █', '█▄▀'],
  E: ['█▀▀', '█▀ ', '█▄▄'],
  F: ['█▀▀', '█▀ ', '█  '],
  G: ['█▀▀', '█ █', '█▄█'],
  H: ['█ █', '███', '█ █'],
  I: ['▀█▀', ' █ ', '▄█▄'],
  J: ['  █', '  █', '█▄█'],
  K: ['█ █', '██ ', '█ █'],
  L: ['█  ', '█  ', '█▄▄'],
  M: ['█▄█', '█▀█', '█ █'],
  N: ['█▄█', '█▀█', '█ █'],
  O: ['█▀█', '█ █', '█▄█'],
  P: ['█▀█', '█▀▀', '█  '],
  Q: ['█▀█', '█ █', '▀█▄'],
  R: ['█▀█', '██ ', '█ █'],
  S: ['█▀▀', '▀▀█', '▄▄█'],
  T: ['▀█▀', ' █ ', ' █ '],
  U: ['█ █', '█ █', '█▄█'],
  V: ['█ █', '█ █', ' ▀ '],
  W: ['█ █', '█ █', '█▄█'],
  X: ['█ █', ' █ ', '█ █'],
  Y: ['█ █', ' ▀█', '  █'],
  Z: ['▀▀█', ' █ ', '█▄▄'],
  '0': ['█▀█', '█ █', '█▄█'],
  '1': ['▄█ ', ' █ ', '▄█▄'],
  '2': ['▀▀█', '▄▀ ', '█▄▄'],
  '3': ['▀▀█', ' ▀█', '▄▄█'],
  '4': ['█ █', '█▄█', '  █'],
  '5': ['█▀▀', '▀▀█', '▄▄█'],
  '6': ['█▀▀', '█▀█', '█▄█'],
  '7': ['▀▀█', '  █', '  █'],
  '8': ['█▀█', '█▀█', '█▄█'],
  '9': ['█▀█', '█▄█', '▄▄█'],
  '.': ['   ', '   ', ' █ '],
  '-': ['   ', '▀▀▀', '   '],
  _: ['   ', '   ', '▄▄▄'],
}

function rowsFor(text: string): [string, string, string] {
  const upper = text.toUpperCase()
  const r0: string[] = []
  const r1: string[] = []
  const r2: string[] = []
  for (const ch of upper) {
    const g = GLYPHS[ch] ?? GLYPHS[' ']!
    r0.push(g[0])
    r1.push(g[1])
    r2.push(g[2])
  }
  return [r0.join(' '), r1.join(' '), r2.join(' ')]
}

export function LargeText(props: LargeTextProps): JSX.Element {
  const content = String(props.children ?? '')
  const [a, b, c] = rowsFor(content)
  const color = props.color ?? 'cyan'
  return (
    <Box direction="vertical">
      <Text color={color}>{a}</Text>
      <Text color={color}>{b}</Text>
      <Text color={color}>{c}</Text>
    </Box>
  )
}
