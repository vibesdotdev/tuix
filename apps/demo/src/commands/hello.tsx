#!/usr/bin/env bun
/** @jsxImportSource @tuix/jsx */

/**
 * Hello World Command
 *
 * A simple demo command showing JSX-based TUI
 */

import { style, colors } from '@tuix/ansi'

export interface HelloProps {
  name?: string
}

export default function Hello({ name = 'World' }: HelloProps) {
  return (
    <vstack>
      <text style={{ foreground: colors.green, bold: true }}>
        👋 Hello, {name}!
      </text>
      <text style={{ foreground: colors.gray }}>
        Welcome to Tuix - the JSX-powered TUI framework
      </text>
    </vstack>
  )
}
