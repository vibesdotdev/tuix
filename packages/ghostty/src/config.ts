/**
 * Ghostty config generation for deterministic shot windows.
 *
 * Key facts (Ghostty 1.3, macOS):
 * - `--config-file` with a fresh path spawns a SEPARATE app instance, so the
 *   user's running Ghostty is never touched.
 * - `window-save-state = never` avoids state restore.
 * - macOS copies the previous window's frame for new windows regardless of
 *   `window-width/height`, so grid size is instead pinned with `stty` inside
 *   the spawned shell (see capture.ts) and the shot is cropped to content.
 * - The window background is a chroma key (magenta) so the TUI's grid can be
 *   located by pixel scan even though the window is larger than the grid.
 */

export interface GhosttyShotTheme {
  /** Normal text color. */
  foreground: string
  /** 16-color palette mapping (0-15) as hex strings. */
  palette?: Record<number, string>
  cursor?: string
  selectionBackground?: string
  selectionForeground?: string
}

export interface GhosttyShotConfigOptions {
  /** Forced window title (used to find the window via CGWindowList). */
  title: string
  /** Chroma-key window background (also the crop key). */
  chroma?: string
  fontFamily?: string
  fontSize?: number
  /** Window padding in points. */
  padding?: number
  /** Extra raw config lines appended verbatim. */
  extra?: string[]
}

export const DEFAULT_CHROMA = '#ff00ff'

/** Render one config file's text. Pure; unit-tested. */
export function buildGhosttyConfig(options: GhosttyShotConfigOptions): string {
  const chroma = normalizeHex(options.chroma ?? DEFAULT_CHROMA)
  const font = options.fontFamily ?? 'JetBrains Mono'
  const size = options.fontSize ?? 15
  const pad = options.padding ?? 14
  const lines = [
    `title = ${options.title}`,
    `background = ${chroma}`,
    `foreground = ${normalizeHex('#e8eef7')}`,
    `font-family = ${font}`,
    `font-size = ${size}`,
    `window-save-state = never`,
    `window-padding-x = ${pad}`,
    `window-padding-y = ${pad}`,
    `window-padding-color = background`,
    `macos-titlebar-style = hidden`,
    `quit-after-last-window-closed = true`,
    `confirm-close-surface = false`,
    `shell-integration = none`,
  ]
  if (options.extra?.length) lines.push(...options.extra)
  return `${lines.join('\n')}\n`
}

/**
 * Emit ghostty color lines derived from a Tuix theme: the 16-color palette,
 * cursor, and selection colors. The window background stays the chroma key —
 * theme colors only affect how the TUI's own color output is rendered.
 */
export function themeToGhosttyColorLines(theme: GhosttyShotTheme): string[] {
  const lines: string[] = [`foreground = ${normalizeHex(theme.foreground)}`]
  if (theme.palette) {
    for (const [index, hex] of Object.entries(theme.palette)) {
      const n = Number(index)
      if (!Number.isInteger(n) || n < 0 || n > 15) continue
      lines.push(`palette = ${n}=${normalizeHex(hex)}`)
    }
  }
  if (theme.cursor) lines.push(`cursor-color = ${normalizeHex(theme.cursor)}`)
  if (theme.selectionBackground) {
    lines.push(`selection-background = ${normalizeHex(theme.selectionBackground)}`)
  }
  if (theme.selectionForeground) {
    lines.push(`selection-foreground = ${normalizeHex(theme.selectionForeground)}`)
  }
  return lines
}

function normalizeHex(hex: string): string {
  const v = hex.trim().replace('#', '')
  return `#${v}`
}

/**
 * Wrap the user command so the PTY grid is exactly cols×rows: our TUIs size
 * themselves from the kernel winsize, and `stty` sets it before exec.
 */
export function buildShellWrapper(command: string[], cols?: number, rows?: number): string[] {
  const quoted = command.map(arg => `'${arg.replace(/'/g, `'\\''`)}'`).join(' ')
  const stty =
    cols && rows ? `stty cols ${Math.max(10, cols)} rows ${Math.max(4, rows)} 2>/dev/null; ` : ''
  return ['/bin/sh', '-c', `${stty}exec ${quoted}`]
}
