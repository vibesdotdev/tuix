/** @jsxImportSource @tuix/jsx */

import { rasterFlowerOfLife, rgbToHalfBlock } from '@tuix/ansi'

export interface MarkProps {
  /** Time in seconds. Drives breath + rotation like the web hero. */
  frame?: number
  /** Cell columns. Default fills the live PTY. */
  cols?: number
  /** Cell rows. Each cell is two pixels tall. */
  rows?: number
  /** Hero scale. 1 fills the min dimension. */
  scale?: number
  className?: string
}

function liveCols(): number {
  return Math.max(20, process.stdout.columns ?? 120)
}

function liveRows(): number {
  return Math.max(8, (process.stdout.rows ?? 40) - 1)
}

/**
 * Full-field flower of life. Same circle stack as FlowerOfLifeCanvas.
 * Renders as a truecolor half-block framebuffer (what xterm.js can paint).
 * Sixel/kitty encode is the native-terminal path via encodeGraphics.
 */
export function renderMarkGrid(frame = 0, cols = 17, rows = 9): string[] {
  const pixels = rasterFlowerOfLife({
    width: cols,
    height: Math.max(2, rows * 2),
    time: frame * 6,
    scale: 1,
  })
  return rgbToHalfBlock(pixels, cols, Math.max(2, rows * 2)).split('\n')
}

export function renderMark(props: MarkProps = {}): string {
  const cols = props.cols ?? liveCols()
  const rows = props.rows ?? liveRows()
  const pixels = rasterFlowerOfLife({
    width: cols,
    height: rows * 2,
    time: props.frame ?? 1.8,
    scale: props.scale ?? 1,
  })
  return rgbToHalfBlock(pixels, cols, rows * 2)
}

export function Mark(props: MarkProps): JSX.Element {
  return <text className={props.className}>{renderMark(props)}</text>
}
