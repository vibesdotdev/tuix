/** @jsxImportSource @tuix/jsx */

import { useUITheme } from '../../../theme'

export interface MarkProps {
  /** 0 = flower of life, 1 = Vibes symbol. */
  frame?: number
  cols?: number
  rows?: number
  className?: string
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

function nearCircle(x: number, y: number, cx: number, cy: number, r: number, band: number): number {
  const dx = (x - cx) * 0.55
  const dy = y - cy
  const d = Math.hypot(dx, dy)
  const err = Math.abs(d - r)
  if (err > band) return 0
  return 1 - err / band
}

function flowerScore(x: number, y: number, cx: number, cy: number, r: number): number {
  const ring = [
    [cx, cy],
    [cx + r, cy],
    [cx - r, cy],
    [cx + r * 0.5, cy - r * 0.87],
    [cx - r * 0.5, cy - r * 0.87],
    [cx + r * 0.5, cy + r * 0.87],
    [cx - r * 0.5, cy + r * 0.87],
  ] as const
  let best = 0
  for (const [ox, oy] of ring) {
    best = Math.max(best, nearCircle(x, y, ox, oy, r, 0.55))
  }
  return best
}

function symbolScore(x: number, y: number, cx: number, cy: number, r: number): number {
  const nx = (x - cx) / r
  const ny = (y - cy) / r
  const stem = Math.abs(nx) < 0.18 && ny > -0.15 && ny < 1.05 ? 1 - Math.abs(nx) / 0.18 : 0
  const head = nearCircle(x, y, cx, cy - r * 0.55, r * 0.42, 0.5)
  const left = Math.abs(ny - 0.15 - nx * 0.9) < 0.22 && nx < 0 && ny > -0.2 && ny < 0.85 ? 0.9 : 0
  const right = Math.abs(ny - 0.15 + nx * 0.9) < 0.22 && nx > 0 && ny > -0.2 && ny < 0.85 ? 0.9 : 0
  const seed = Math.hypot(nx, ny + 0.15) < 0.22 ? 1 : 0
  return Math.max(stem, head, left, right, seed)
}

function glyph(strength: number): string {
  if (strength > 0.85) return '●'
  if (strength > 0.55) return '○'
  if (strength > 0.28) return '·'
  return ' '
}

/**
 * Flower-of-life field collapsing into the Vibes symbol.
 * Boot/idle only. Cancel when the user types.
 */
export function renderMarkGrid(frame = 0, cols = 17, rows = 9): string[] {
  const t = clamp01(frame)
  const cx = (cols - 1) / 2
  const cy = (rows - 1) / 2
  const r = Math.min(cols, rows) * 0.28
  const lines: string[] = []
  for (let y = 0; y < rows; y++) {
    let line = ''
    for (let x = 0; x < cols; x++) {
      const flower = flowerScore(x, y, cx, cy, r)
      const symbol = symbolScore(x, y, cx, cy, r)
      line += glyph(flower * (1 - t) + symbol * t)
    }
    lines.push(line)
  }
  return lines
}

export function Mark(props: MarkProps): JSX.Element {
  const { theme, depth } = useUITheme()
  const lines = renderMarkGrid(props.frame ?? 0, props.cols ?? 17, props.rows ?? 9)
  return (
    <box className={props.className} background={depth.base} padding={0}>
      <vstack>
        {lines.map((line, index) => (
          <text key={index} fg={theme.colors.primary}>
            {line}
          </text>
        ))}
      </vstack>
    </box>
  )
}
