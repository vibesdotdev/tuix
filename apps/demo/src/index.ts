#!/usr/bin/env bun
/** @jsxImportSource @tuix/jsx */

/**
 * Tuix Demo App
 *
 * Demonstrates JSX-based TUI with the runtime
 */

import { runApp } from '@tuix/jsx'
import { Effect } from 'effect'
import { TerminalService, TerminalServiceLive, colorSchemeFromBackground } from '@tuix/core'
import { setUIThemeForScheme } from '@tuix/ui'
import App from './app'

// Pick the theme variant that matches the user's terminal palette (OSC 11).
// TUIX_COLOR_SCHEME forces a side; probe failure keeps the dark default.
{
  const forced = process.env.TUIX_COLOR_SCHEME
  let scheme: 'light' | 'dark' | 'unknown' = 'unknown'
  if (forced === 'light' || forced === 'dark') {
    scheme = forced
  } else if (process.stdin.isTTY) {
    scheme = await Effect.runPromise(
      Effect.gen(function* (_) {
        const terminal = yield* _(TerminalService)
        const bg = yield* _(terminal.queryBackgroundColor)
        return bg ? colorSchemeFromBackground(bg) : 'unknown'
      }).pipe(Effect.provide(TerminalServiceLive))
    ).catch(() => 'unknown' as const)
  }
  setUIThemeForScheme(scheme)
}

const kit = process.argv.includes('kit')
const forms = process.argv.includes('forms')
await runApp(App, { fps: kit ? 12 : 60, enableMouse: forms })
