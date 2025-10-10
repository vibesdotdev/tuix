/** @jsxImportSource @tuix/jsx */

import { style, colors } from '@tuix/ansi'

export default function HelloTest() {
  return (
    <vstack>
      <text style={style().fg(colors.green).bold()}>👋 Hello, World!</text>
      <text style={style().fg(colors.gray)}>Welcome to Tuix - the JSX-powered TUI framework</text>
    </vstack>
  )
}
