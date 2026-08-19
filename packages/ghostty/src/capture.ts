/**
 * captureGhosttyShot — run a command in an isolated Ghostty window and
 * capture a real GPU-rendered screenshot of exactly its terminal grid.
 *
 * Pipeline:
 *  1. temp config (chroma background, hidden titlebar, forced title) → a
 *     separate Ghostty instance (never touches the user's running app)
 *  2. command wrapped in `stty cols/rows` so the TUI sizes itself to the
 *     requested grid even though macOS sizes the window larger
 *  3. find our window by forced title via CGWindowList (Swift lister)
 *  4. `screencapture -x -o -l<window-id>` (real pixels, truecolor, fonts)
 *  5. decode, crop to the non-chroma content box plus symmetric padding,
 *     re-encode
 *  6. always SIGTERM the instance and remove the temp config
 */

import { spawn, type ChildProcess } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execSyncText } from './exec'
import { resolveGhosttyBin } from './locate'
import {
  buildGhosttyConfig,
  buildShellWrapper,
  DEFAULT_CHROMA,
  themeToGhosttyColorLines,
  type GhosttyShotTheme,
} from './config'
import { findWindowByTitlePrefix, listGhosttyWindows } from './windows'
import { cropRgba, decodePng, encodePng, findContentBounds, hexToRgbTuple } from './png'

export interface CaptureOptions {
  /** Command to run, e.g. ['bun', 'src/index.ts', 'kit']. */
  command: string[]
  /** Working directory for the command. */
  cwd: string
  /** Grid size the TUI should see (stty cols/rows). */
  cols: number
  rows: number
  /** Output PNG path. */
  out: string
  /** Extra padding (points) added around the cropped grid. */
  padding?: number
  fontFamily?: string
  fontSize?: number
  /**
   * Chroma key for content detection. Defaults to magenta; pass the app's own
   * background (e.g. '#000000') so transparent unpainted cells blend
   * seamlessly and the shot matches the app's real theme.
   */
  chroma?: string
  theme?: GhosttyShotTheme
  /** ms to wait for the window before failing (default 15000). */
  windowTimeoutMs?: number
  /** ms to settle after the window appears (default 1200). */
  settleMs?: number
  /** Keystrokes sent to the window after settling (plain characters). */
  keys?: string[]
  /** ms to wait after each keystroke (default 350). */
  keySettleMs?: number
  /** Override for tests. */
  exec?: typeof execSyncText
  /** Cell size in captured pixels (auto-measured constants for font-size 15). */
  cellSize?: { width: number; height: number }
}

export interface CaptureResult {
  out: string
  width: number
  height: number
  bytes: number
  windowId: number
}

export async function captureGhosttyShot(options: CaptureOptions): Promise<CaptureResult> {
  const exec = options.exec ?? execSyncText
  if (process.platform !== 'darwin') {
    throw new Error('ghostty capture currently supports macOS (screencapture + CGWindowList)')
  }
  const { bin } = resolveGhosttyBin()
  const title = `tuix-shot-${process.pid}-${Date.now().toString(36)}`
  const chroma = options.chroma ?? DEFAULT_CHROMA
  const configDir = mkdtempSync(join(tmpdir(), 'tuix-ghostty-cfg-'))
  const configPath = join(configDir, 'config')

  const themeLines = options.theme ? themeToGhosttyColorLines(options.theme) : []
  const config = buildGhosttyConfig({
    title,
    chroma,
    fontFamily: options.fontFamily,
    fontSize: options.fontSize,
    padding: options.padding ?? 14,
    extra: themeLines,
  })
  writeFileSync(configPath, config, 'utf8')

  const child: ChildProcess = spawn(
    bin,
    [
      '--config-file=' + configPath,
      '--title=' + title,
      '-e',
      ...buildShellWrapper(options.command, options.cols, options.rows),
    ],
    { cwd: options.cwd, stdio: 'ignore' }
  )

  const cleanup = () => {
    try {
      child.kill('SIGTERM')
    } catch {
      /* already gone */
    }
    rmSync(configDir, { recursive: true, force: true })
  }

  try {
    const window = await waitForWindow(title, options.windowTimeoutMs ?? 15_000, exec)
    await sleep(options.settleMs ?? 1200)

    for (const key of options.keys ?? []) {
      // Bun's execSync mishandles nested quotes, so the AppleScript goes
      // through a temp file — no shell quoting involved.
      const keyPath = join(configDir, 'key.applescript')
      writeFileSync(
        keyPath,
        `tell application "System Events" to keystroke "${key.replace(/"/g, '\\"')}"`,
        'utf8'
      )
      exec(`osascript ${keyPath}`)
      await sleep(options.keySettleMs ?? 350)
    }

    const rawPath = join(configDir, 'raw.png')
    exec(`screencapture -x -o -l${window.id} ${rawPath}`)
    const raw = await import('node:fs/promises').then(fs => fs.readFile(rawPath))

    const image = decodePng(raw)
    const key = hexToRgbTuple(chroma)
    const bounds = findContentBounds(image, key)
    if (!bounds) {
      throw new Error('no content found — the TUI never painted over the chroma background')
    }
    const pad = options.padding ?? 14
    const cell = options.cellSize ?? { width: 7.95, height: 18.5 }
    // Anchor to the first inked cell and extend to the exact grid rectangle:
    // interior rows can be legitimately ink-free (opaque bg), so ink bounds
    // alone under-measure the grid.
    const col0 = Math.max(0, Math.round((bounds.x - pad) / cell.width))
    const row0 = Math.max(0, Math.round((bounds.y - pad) / cell.height))
    const gridX = Math.max(0, Math.round(pad + col0 * cell.width) - 1)
    const gridY = Math.max(0, Math.round(pad + row0 * cell.height) - 1)
    const gridW = Math.min(image.width - gridX, Math.round(options.cols * cell.width) + 2)
    const gridH = Math.min(image.height - gridY, Math.round(options.rows * cell.height) + 2)
    const cropped = cropRgba(image, { x: gridX, y: gridY, width: gridW, height: gridH })
    const encoded = encodePng(cropped)
    const { writeFile } = await import('node:fs/promises')
    await writeFile(options.out, encoded)
    return {
      out: options.out,
      width: cropped.width,
      height: cropped.height,
      bytes: encoded.length,
      windowId: window.id,
    }
  } finally {
    cleanup()
  }
}

async function waitForWindow(titlePrefix: string, timeoutMs: number, exec: typeof execSyncText) {
  const deadline = Date.now() + timeoutMs
  let lastError = 'window never appeared'
  while (Date.now() < deadline) {
    try {
      const win = findWindowByTitlePrefix(listGhosttyWindows(exec), titlePrefix)
      if (win) return win
    } catch (err) {
      lastError = (err as Error).message
    }
    await sleep(300)
  }
  throw new Error(`Ghostty window "${titlePrefix}…" not found within ${timeoutMs}ms: ${lastError}`)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
