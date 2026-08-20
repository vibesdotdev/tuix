/**
 * Inline renderer — writes to terminal scrollback without entering alt-screen.
 *
 * Unlike the fullscreen RendererService which owns the entire alt-screen buffer,
 * the inline renderer paints a fixed-height region at the bottom of the terminal
 * using DECSTBM scroll margins and cursor positioning. Content above the region
 * scrolls into scrollback naturally.
 *
 * Use cases:
 * - CLI tools that show progress/status below streaming output
 * - Inline prompts (like fzf) that don't take over the full screen
 * - Log viewers that want stable chrome at the bottom
 *
 * @since 1.0.0
 */

import { Effect } from 'effect'
import { TerminalService } from '../terminal'
import { TerminalError } from '../../types/errors'

/**
 * Configuration for inline rendering.
 */
export interface InlineRendererConfig {
  /** Height of the sticky region at the bottom (in rows). */
  stickyHeight: number
  /** Whether to use DECSTBM scroll margins to pin the region. Defaults to true. */
  useScrollMargins?: boolean
}

/**
 * Inline render session state.
 */
export interface InlineSession {
  /** Write content to the streaming area (scrolls up naturally). */
  writeStream: (text: string) => Effect.Effect<void, TerminalError, never>
  /** Update the sticky footer region (repaints in place). */
  updateSticky: (lines: string[]) => Effect.Effect<void, TerminalError, never>
  /** Clear the sticky region and restore normal terminal behavior. */
  dispose: Effect.Effect<void, TerminalError, never>
  /** Current height of the sticky region. */
  readonly stickyHeight: number
}

/**
 * Create an inline rendering session.
 *
 * Sets up DECSTBM scroll margins so the top region scrolls freely while
 * the bottom `stickyHeight` rows remain pinned for status/chrome.
 *
 * @example
 * ```typescript
 * const session = yield* createInlineSession({ stickyHeight: 3 })
 * yield* session.writeStream("Processing file 1...")
 * yield* session.updateSticky(["[1/10] ████░░░░ 40%", "", "ctrl+c to cancel"])
 * // ... when done:
 * yield* session.dispose
 * ```
 */
export const createInlineSession = (
  config: InlineRendererConfig
): Effect.Effect<InlineSession, TerminalError, TerminalService> =>
  Effect.gen(function* (_) {
    const terminal = yield* _(TerminalService)
    const size = yield* _(terminal.getSize)
    const totalRows = size.height
    const stickyHeight = Math.min(config.stickyHeight, Math.floor(totalRows / 2))
    const scrollRegionEnd = totalRows - stickyHeight

    // Set scroll region: rows 1 to (totalRows - stickyHeight) scroll freely.
    // The bottom `stickyHeight` rows are outside the scroll region.
    if (config.useScrollMargins !== false) {
      yield* _(terminal.write(`\x1b[1;${scrollRegionEnd}r`))
    }

    // Position cursor at the bottom of the scroll region to start.
    yield* _(terminal.write(`\x1b[${scrollRegionEnd};1H`))

    let disposed = false

    const writeStream = (text: string): Effect.Effect<void, TerminalError, never> =>
      Effect.gen(function* (_) {
        if (disposed) return
        // Save cursor, move to scroll region bottom, write, restore
        yield* _(terminal.write(`\x1b7`)) // DECSC — save cursor
        yield* _(terminal.write(`\x1b[${scrollRegionEnd};1H`)) // bottom of scroll region
        yield* _(terminal.write(text + '\n'))
        yield* _(terminal.write(`\x1b8`)) // DECRC — restore cursor
      })

    const updateSticky = (lines: string[]): Effect.Effect<void, TerminalError, never> =>
      Effect.gen(function* (_) {
        if (disposed) return
        yield* _(terminal.write(`\x1b7`)) // DECSC — save cursor
        // Paint each sticky line below the scroll region
        for (let i = 0; i < stickyHeight; i++) {
          const row = scrollRegionEnd + 1 + i
          const line = lines[i] ?? ''
          yield* _(terminal.write(`\x1b[${row};1H`)) // move to row
          yield* _(terminal.write(`\x1b[2K`)) // erase entire line
          yield* _(terminal.write(line))
        }
        yield* _(terminal.write(`\x1b8`)) // DECRC — restore cursor
      })

    const dispose: Effect.Effect<void, TerminalError, never> = Effect.gen(function* (_) {
      if (disposed) return
      disposed = true
      // Reset scroll region to full terminal height
      yield* _(terminal.write(`\x1b[r`))
      // Clear the sticky area
      for (let i = 0; i < stickyHeight; i++) {
        const row = scrollRegionEnd + 1 + i
        yield* _(terminal.write(`\x1b[${row};1H\x1b[2K`))
      }
      // Move cursor to bottom
      yield* _(terminal.write(`\x1b[${totalRows};1H`))
    })

    return {
      writeStream,
      updateSticky,
      dispose,
      stickyHeight,
    } satisfies InlineSession
  })
