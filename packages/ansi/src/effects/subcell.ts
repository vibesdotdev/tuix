/**
 * Sub-cell rendering primitives for terminal UIs.
 *
 * The terminal grid is 1 character = 1 cell, but Unicode provides characters
 * that represent sub-cell precision:
 * - Half-blocks (▀▄▌▐█) give 2x vertical resolution
 * - Braille patterns (U+2800-U+28FF) give 2x4 sub-cell resolution per cell
 * - Quarter blocks (▖▗▘▝▞▟) give 2x2 resolution
 * - Fractional blocks (▏▎▍▌▋▊▉█) give 8 horizontal levels per cell
 */

/** A single terminal cell with optional truecolor foreground and background. */
export interface SubCell {
  char: string
  fg?: { r: number; g: number; b: number }
  bg?: { r: number; g: number; b: number }
}

/** A drawable braille canvas that maps pixel coordinates to braille characters. */
export interface BrailleCanvas {
  /** Canvas width in dots (2x the cell width). */
  readonly pixelWidth: number
  /** Canvas height in dots (4x the cell height). */
  readonly pixelHeight: number
  /** Set a dot at the given pixel coordinate. */
  set(x: number, y: number): void
  /** Clear a dot at the given pixel coordinate. */
  unset(x: number, y: number): void
  /** Toggle a dot at the given pixel coordinate. */
  toggle(x: number, y: number): void
  /** Render the canvas to an array of braille character strings (one per cell row). */
  render(): string[]
  /** Render the canvas to a 2D grid of SubCells with color info. */
  renderCells(): SubCell[][]
}

/**
 * Braille dot offsets within a cell. Each cell is 2 columns x 4 rows of dots.
 * The Unicode braille pattern U+2800 is the blank; each dot adds a specific bit:
 *
 *   Col 0   Col 1
 *   0x01    0x08   (row 0)
 *   0x02    0x10   (row 1)
 *   0x04    0x20   (row 2)
 *   0x40    0x80   (row 3)
 */
const BRAILLE_DOT_MAP: number[][] = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
]

/** Fractional horizontal block characters, from empty to full (8 levels + full). */
const FRACTIONAL_BLOCKS = [' ', '\u258f', '\u258e', '\u258d', '\u258c', '\u258b', '\u258a', '\u2589', '\u2588']
//                          0     ▏        ▎        ▍        ▌        ▋        ▊        ▉        █

/**
 * Render a sparkline/bar row using half-block characters for 2x vertical resolution.
 *
 * Each output cell represents 2 vertical units. The upper half-block (▀) is used
 * with fg for the top pixel and bg for the bottom pixel, enabling smooth gradients.
 *
 * @param values - Array of numeric values to plot
 * @param maxValue - Maximum value for normalization (values are clamped to this)
 * @param width - Number of output cells
 * @returns Array of SubCells representing the sparkline row
 */
export function halfBlockRow(values: number[], maxValue: number, width: number): SubCell[] {
  const cells: SubCell[] = []
  const max = Math.max(maxValue, 1)

  for (let i = 0; i < width; i++) {
    const val = Math.max(0, Math.min(max, values[i] ?? 0))
    const normalized = val / max
    // Map to 0-2 range (2 sub-rows per cell)
    const level = normalized * 2

    const topIntensity = Math.max(0, Math.min(1, level - 1))
    const botIntensity = Math.max(0, Math.min(1, level))

    if (topIntensity === 0 && botIntensity === 0) {
      cells.push({ char: ' ' })
    } else if (topIntensity > 0 && botIntensity > 0) {
      // Both halves active: use ▀ with fg=top color, bg=bottom color
      cells.push({
        char: '\u2580', // ▀
        fg: intensityToGray(topIntensity),
        bg: intensityToGray(botIntensity),
      })
    } else {
      // Only bottom half active: use ▄ with fg=bottom color
      cells.push({
        char: '\u2584', // ▄
        fg: intensityToGray(botIntensity),
      })
    }
  }

  return cells
}

/**
 * Create a drawable braille canvas.
 *
 * The actual pixel resolution is `width*2` x `height*4` since each terminal cell
 * maps to a 2x4 grid of braille dots.
 *
 * @param width - Width in terminal cells
 * @param height - Height in terminal cells
 * @returns A BrailleCanvas instance with set/unset/toggle/render methods
 */
export function brailleCanvas(width: number, height: number): BrailleCanvas {
  const cellW = Math.max(1, Math.floor(width))
  const cellH = Math.max(1, Math.floor(height))
  const pixelWidth = cellW * 2
  const pixelHeight = cellH * 4
  const grid = new Uint8Array(cellW * cellH)

  function cellIndex(px: number, py: number): { idx: number; bit: number } | null {
    if (px < 0 || px >= pixelWidth || py < 0 || py >= pixelHeight) return null
    const cx = Math.floor(px / 2)
    const cy = Math.floor(py / 4)
    const dx = px % 2
    const dy = py % 4
    const bit = BRAILLE_DOT_MAP[dy]![dx]!
    return { idx: cy * cellW + cx, bit }
  }

  return {
    pixelWidth,
    pixelHeight,

    set(x: number, y: number): void {
      const loc = cellIndex(x, y)
      if (loc) grid[loc.idx] |= loc.bit
    },

    unset(x: number, y: number): void {
      const loc = cellIndex(x, y)
      if (loc) grid[loc.idx] &= ~loc.bit
    },

    toggle(x: number, y: number): void {
      const loc = cellIndex(x, y)
      if (loc) grid[loc.idx] ^= loc.bit
    },

    render(): string[] {
      const rows: string[] = []
      for (let cy = 0; cy < cellH; cy++) {
        let row = ''
        for (let cx = 0; cx < cellW; cx++) {
          const code = grid[cy * cellW + cx]!
          row += String.fromCharCode(0x2800 + code)
        }
        rows.push(row)
      }
      return rows
    },

    renderCells(): SubCell[][] {
      const result: SubCell[][] = []
      for (let cy = 0; cy < cellH; cy++) {
        const row: SubCell[] = []
        for (let cx = 0; cx < cellW; cx++) {
          const code = grid[cy * cellW + cx]!
          row.push({ char: String.fromCharCode(0x2800 + code) })
        }
        result.push(row)
      }
      return result
    },
  }
}

/**
 * Render a progress bar with sub-cell precision using fractional block characters.
 *
 * Uses 8 fractional levels per cell (' ▏▎▍▌▋▊▉█'), providing smooth fill
 * with truecolor foreground/background on the partial cell.
 *
 * @param fraction - Fill amount from 0 to 1
 * @param width - Total width in terminal cells
 * @param filled - Color for the filled portion
 * @param empty - Color for the unfilled portion
 * @returns Array of SubCells representing the progress bar
 */
export function progressFill(
  fraction: number,
  width: number,
  filled: { r: number; g: number; b: number },
  empty: { r: number; g: number; b: number }
): SubCell[] {
  const cells: SubCell[] = []
  const w = Math.max(1, Math.floor(width))
  const clamped = Math.max(0, Math.min(1, fraction))

  // Total sub-units: 8 per cell
  const totalUnits = w * 8
  const filledUnits = Math.round(clamped * totalUnits)
  const fullCells = Math.floor(filledUnits / 8)
  const remainder = filledUnits % 8

  // Full filled cells
  for (let i = 0; i < fullCells && i < w; i++) {
    cells.push({ char: '\u2588', fg: filled, bg: empty }) // █
  }

  // Partial cell
  if (fullCells < w && remainder > 0) {
    cells.push({ char: FRACTIONAL_BLOCKS[remainder]!, fg: filled, bg: empty })
  }

  // Empty cells
  while (cells.length < w) {
    cells.push({ char: ' ', bg: empty })
  }

  return cells
}

/**
 * Render a vertical bar (bottom-up) using half-blocks for a smooth top edge.
 *
 * The returned cells are ordered top-to-bottom. The bar fills from the bottom,
 * with the topmost partial cell using ▄ for sub-cell precision.
 *
 * @param value - Current value
 * @param maxValue - Maximum value for normalization
 * @param height - Total height in terminal cells
 * @param color - Color of the filled bar
 * @returns Array of SubCells from top to bottom
 */
export function verticalBar(
  value: number,
  maxValue: number,
  height: number,
  color: { r: number; g: number; b: number }
): SubCell[] {
  const cells: SubCell[] = []
  const h = Math.max(1, Math.floor(height))
  const max = Math.max(maxValue, 1)
  const clamped = Math.max(0, Math.min(max, value))

  // Total sub-units: 2 per cell (top half, bottom half)
  const totalUnits = h * 2
  const filledUnits = Math.round((clamped / max) * totalUnits)
  const fullCells = Math.floor(filledUnits / 2)
  const hasHalf = filledUnits % 2 === 1

  // Fill from bottom: empty cells at top, partial cell, then full cells
  const emptyCells = h - fullCells - (hasHalf ? 1 : 0)

  // Empty cells (top)
  for (let i = 0; i < emptyCells; i++) {
    cells.push({ char: ' ' })
  }

  // Partial cell (▄ lower half block with fg = bar color)
  if (hasHalf) {
    cells.push({ char: '\u2584', fg: color }) // ▄
  }

  // Full cells (█ with fg = bar color)
  for (let i = 0; i < fullCells; i++) {
    cells.push({ char: '\u2588', fg: color }) // █
  }

  return cells
}

/**
 * Generate a 2D grid of shade characters based on a density value.
 *
 * Maps density (0-1) to Unicode shade block characters:
 * - 0: ' ' (space)
 * - 0 < d <= 0.25: '░' (light shade)
 * - 0.25 < d <= 0.5: '▒' (medium shade)
 * - 0.5 < d <= 0.75: '▓' (dark shade)
 * - 0.75 < d <= 1: '█' (full block)
 *
 * @param density - Fill density from 0 to 1
 * @param width - Width in terminal cells
 * @param height - Height in terminal cells
 * @returns 2D grid of SubCells (rows x columns)
 */
export function densityFill(density: number, width: number, height: number): SubCell[][] {
  const w = Math.max(1, Math.floor(width))
  const h = Math.max(1, Math.floor(height))
  const clamped = Math.max(0, Math.min(1, density))

  let char: string
  if (clamped === 0) {
    char = ' '
  } else if (clamped <= 0.25) {
    char = '\u2591' // ░
  } else if (clamped <= 0.5) {
    char = '\u2592' // ▒
  } else if (clamped <= 0.75) {
    char = '\u2593' // ▓
  } else {
    char = '\u2588' // █
  }

  const cell: SubCell = { char }
  const grid: SubCell[][] = []
  for (let y = 0; y < h; y++) {
    const row: SubCell[] = []
    for (let x = 0; x < w; x++) {
      row.push({ ...cell })
    }
    grid.push(row)
  }

  return grid
}

/** Map an intensity (0-1) to a grayscale Rgb value. */
function intensityToGray(intensity: number): { r: number; g: number; b: number } {
  const v = Math.round(Math.max(0, Math.min(1, intensity)) * 255)
  return { r: v, g: v, b: v }
}
