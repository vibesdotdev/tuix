#!/usr/bin/env bun
/**
 * Shoot the Tuix demo suite through a real Ghostty window and capture
 * GPU-rendered truecolor screenshots.
 *
 * Usage: bun scripts/ghostty-shot.ts [--out-dir docs/evidence/ghostty]
 */
import { mkdirSync, copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { captureGhosttyShot } from '@tuix/ghostty'

const TUIX = resolve(import.meta.dir, '..')
const DEMO = resolve(TUIX, 'apps/demo')
const outDir = resolve(
  TUIX,
  process.argv.find(a => a.startsWith('--out-dir='))?.slice(10) ?? 'docs/evidence/ghostty'
)

const theme = {
  foreground: '#a6a6ad',
  cursor: '#a78bfa',
  selectionBackground: '#26262c',
  selectionForeground: '#fdf5ce',
  palette: {
    0: '#151517',
    1: '#f7768e',
    2: '#9ece6a',
    3: '#e0af68',
    4: '#7aa2f7',
    5: '#a78bfa',
    6: '#7dcfff',
    7: '#a6a6ad',
    8: '#4a4a52',
    9: '#f7768e',
    10: '#9ece6a',
    11: '#e0af68',
    12: '#7aa2f7',
    13: '#a78bfa',
    14: '#7dcfff',
    15: '#fdf5ce',
  } as Record<number, string>,
}

const shots = [
  { name: 'brand', cols: 100, rows: 30, args: ['brand'] },
  { name: 'kit', cols: 100, rows: 30, args: ['kit'] },
  { name: 'kit-120x40', cols: 120, rows: 40, args: ['kit'] },
  { name: 'kit-80x24-palette', cols: 80, rows: 24, args: ['kit'], keys: ['/'] },
  { name: 'tasks', cols: 100, rows: 30, args: ['tasks'] },
  { name: 'dash', cols: 100, rows: 30, args: ['dash'] },
  { name: 'forms', cols: 100, rows: 30, args: ['forms'] },
]

mkdirSync(outDir, { recursive: true })

// Opaque backgrounds for shots: unstyled cells paint the theme bg so the
// grid reads as a solid surface (and chroma-key cropping is exact).
process.env.TUIX_PAINT_BG = '#000000'

for (const shot of shots) {
  const out = resolve(outDir, `${shot.name}.png`)
  process.stdout.write(`shooting ${shot.name} (${shot.cols}x${shot.rows}) … `)
  const result = await captureGhosttyShot({
    command: ['bun', 'src/index.ts', ...shot.args],
    cwd: DEMO,
    cols: shot.cols,
    rows: shot.rows,
    out,
    fontSize: 15,
    chroma: '#000000',
    theme,
    keys: shot.keys,
  })
  console.log(`${result.width}x${result.height}px, ${(result.bytes / 1024).toFixed(0)}KiB`)
}

console.log(`\nwrote ${shots.length} shots to ${outDir}`)
