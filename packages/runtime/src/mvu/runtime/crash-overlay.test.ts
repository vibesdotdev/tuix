import { describe, expect, test } from 'bun:test'
import { buildCrashOverlay } from './crash-overlay'

describe('buildCrashOverlay', () => {
  test('renders a bordered box with the error message', () => {
    const out = buildCrashOverlay(
      'RuntimeError: render fiber failed\n  caused by: RangeError: bad array',
      80
    )
    expect(out).toContain('\x1b[2J\x1b[H')
    expect(out).toContain('╭')
    expect(out).toContain('╰')
    expect(out).toContain('│ RuntimeError: render fiber failed')
    expect(out).toContain('press r to retry')
  })

  test('wraps long lines to the inner width', () => {
    const long = 'x'.repeat(120)
    const out = buildCrashOverlay(long, 80)
    const rows = out.split('\r\n')
    // Title + content rows + empty + hint + bottom = several rows.
    expect(rows.length).toBeGreaterThan(3)
    // No row exceeds the box width (80 - 2 = 78 max).
    for (const row of rows) {
      const stripped = row.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '')
      expect(stripped.length).toBeLessThanOrEqual(80)
    }
  })

  test('clamps to terminal width', () => {
    const out = buildCrashOverlay('short', 30)
    expect(out).toContain('╭')
    // 30-col terminal → width ~28, inner ~24. No row exceeds the box.
    const rows = out.split('\r\n')
    for (const row of rows) {
      const stripped = row.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '')
      expect(stripped.length).toBeLessThanOrEqual(30)
    }
  })

  test('hides and restores the cursor', () => {
    const out = buildCrashOverlay('err', 80)
    expect(out).toContain('\x1b[?25l')
    expect(out).toContain('\x1b[?25h')
  })
})
