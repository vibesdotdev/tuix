/**
 * Format an error into a readable multi-line string for logging and crash
 * overlays. Walks the `.cause` chain and appends a trimmed stack frame so
 * render/update/input failures show *what* broke and *where*, not `{}`.
 *
 * Effect.logError JSON-stringifies Error objects — but `Error.message` and
 * nested causes are non-enumerable, so the structured log emits `message={}`
 * and the actual reason vanishes. formatError pulls the human-readable parts
 * out first.
 */
export function formatError(error: unknown): string {
  if (error === null || error === undefined) return 'unknown error'
  if (typeof error === 'string') return error
  if (typeof error === 'number' || typeof error === 'boolean' || typeof error === 'bigint') {
    return String(error)
  }
  const lines: string[] = []
  let cur: unknown = error
  let depth = 0
  const seen = new WeakSet<object>()
  while (cur && depth < 8) {
    if (cur instanceof Error) {
      if (seen.has(cur)) break
      seen.add(cur)
      const label = `${cur.name || 'Error'}: ${cur.message || '(no message)'}`
      lines.push(depth === 0 ? label : `  caused by: ${label}`)
      cur = (cur as { cause?: unknown }).cause
    } else if (typeof cur === 'object') {
      const obj = cur as Record<string, unknown>
      let msg = obj.message
      if (typeof msg !== 'string') {
        try {
          msg = JSON.stringify(cur)
        } catch {
          msg = String(cur)
        }
      }
      lines.push(depth === 0 ? String(msg) : `  caused by: ${String(msg)}`)
      cur = (obj as { cause?: unknown }).cause
    } else {
      lines.push(depth === 0 ? String(cur) : `  caused by: ${String(cur)}`)
      break
    }
    depth++
  }
  if (error instanceof Error && error.stack) {
    const frame = error.stack
      .split('\n')
      .slice(1, 5)
      .map(l => l.trim())
      .filter(Boolean)
      .join('\n')
    if (frame) lines.push('  at:\n' + frame)
  }
  return lines.join('\n')
}
