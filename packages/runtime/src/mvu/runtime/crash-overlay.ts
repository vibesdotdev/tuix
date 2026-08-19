/**
 * Build a bordered crash overlay string for direct terminal write.
 *
 * When the renderer's frame fails, the runtime writes this straight to
 * stdout (bypassing the diff pipeline that just broke) so the developer
 * sees *what* crashed instead of a frozen blank screen. The next
 * successful frame clears + repaints and the overlay is gone.
 *
 * @param message - pre-formatted error (from formatError)
 * @param cols - terminal column count
 */
export function buildCrashOverlay(message: string, cols: number): string {
  const width = Math.max(24, Math.min(cols - 2, 64))
  const inner = width - 4 // ╭ + space + content + space + ╮

  const title = ' render error '
  const titleLine = '─'.repeat(Math.max(0, width - 2 - title.length))

  const wrap = (line: string, max: number): string => {
    if (line.length <= max) return line
    return line.slice(0, max)
  }

  const contentLines: string[] = []
  for (const raw of message.split('\n')) {
    if (raw.length === 0) {
      contentLines.push('')
    } else {
      // Hard-wrap long lines to the inner width.
      let i = 0
      while (i < raw.length) {
        contentLines.push(wrap(raw.slice(i, i + inner), inner))
        i += inner
      }
    }
  }
  // Cap height so small terminals aren't overwhelmed.
  const capped = contentLines.slice(0, Math.max(1, 20))

  const pad = (text: string) => `│ ${text}${' '.repeat(Math.max(0, inner - text.length))} │`

  const lines: string[] = []
  lines.push(`╭${title}${titleLine}╮`)
  for (const line of capped) {
    lines.push(pad(line))
  }
  lines.push(pad(''))
  const hint = 'press r to retry · esc to exit'
  for (let i = 0; i < hint.length; i += inner) {
    lines.push(pad(wrap(hint.slice(i, i + inner), inner)))
  }
  lines.push(`╰${'─'.repeat(Math.max(0, width - 2))}╯`)

  // Clear screen, home cursor, hide cursor (the overlay is transient).
  return `\x1b[2J\x1b[H\x1b[?25l${lines.join('\r\n')}\x1b[?25h`
}
