/**
 * E2E harness screen-emulator: replays raw PTY streams onto a cell grid so
 * assertions can target visible text instead of escape-laden output.
 *
 * Live PTY drives are run from the node-based evidence capture script
 * (docs/evidence) rather than under `bun test` — node-pty spawns are
 * unstable inside Bun's test runner on this machine.
 */
import { describe, expect, it } from 'bun:test'
import { decodeScreen } from './e2eHarness'

function linesOf(stream: string, cols = 20, rows = 5): string[] {
  return decodeScreen(stream, cols, rows).grid.map(l => l.join('').replace(/\s+$/, ''))
}

describe('e2e screen emulator', () => {
  it('replays CUP + SGR streams onto a grid', () => {
    const stream = '\x1b[2J\x1b[Hhi\x1b[1;5Hthere\x1b[38;2;1;2;3m\x1b[3;1Hcolor'
    const lines = linesOf(stream)
    expect(lines[0]?.startsWith('hi')).toBe(true)
    expect(lines[0]?.slice(4, 9)).toBe('there')
    expect(lines[2]?.startsWith('color')).toBe(true)
  })

  it('handles CR/LF and erase-to-end-of-line', () => {
    const lines = linesOf('abc\r\n\x1b[2;1Hxy\x1b[Kz')
    expect(lines[0]).toBe('abc')
    expect(lines[1]).toBe('xyz') // K cleared from cursor, then z wrote after it
  })

  it('consumes OSC sequences without width', () => {
    const lines = linesOf('\x1b]0;title\x07ok')
    expect(lines[0]?.startsWith('ok')).toBe(true)
  })

  it('tracks relative cursor moves', () => {
    const lines = linesOf('abcde\x1b[3D\x1b[1AXY')
    // 'abcde' at row 0, cursor left 3 → col 2, up 1 clamps at row 0; XY overwrites from col 2.
    expect(lines[0]?.slice(0, 5)).toBe('abXYe')
  })

  it('clips writes beyond the grid bounds', () => {
    const lines = linesOf('x'.repeat(30), 10, 2)
    expect(lines[0]).toBe('x'.repeat(10))
    expect(lines[1]).toBe('')
  })

  it('exposes the final cursor position', () => {
    const state = decodeScreen('\x1b[3;4Hq', 20, 5)
    expect(state.cursorY).toBe(2)
    expect(state.cursorX).toBe(4) // advanced past the written cell
  })

  it('full-screen erase clears previous content', () => {
    const lines = linesOf('old stuff\x1b[2J\x1b[Hnew')
    expect(lines[0]?.startsWith('new')).toBe(true)
    expect(lines[0]?.includes('old')).toBe(false)
  })
})
