/** @jsxImportSource @tuix/jsx */

/**
 * Showcase Command - Demonstrates polished TUI components
 */

import {
  style,
  colors,
  textGradient,
  rainbowGradient,
  sunsetGradient,
  oceanGradient,
} from '@tuix/ansi'

export default function ShowcaseCommand() {
  return (
    <vstack>
      {/* Hero Section */}
      <box border="rounded" padding={1} style={style().fg(colors.cyan).bold()}>
        <text>✨ TUIX Component Showcase</text>
      </box>

      <text></text>

      {/* Introduction */}
      <box border="rounded" padding={1}>
        <vstack>
          <text style={style().fg(colors.green).bold()}>Welcome to TUIX</text>
          <text style={style().fg(colors.white)}>A Modern Terminal UI Framework</text>
          <text></text>
          <text style={style().fg(colors.gray)}>
            Build beautiful, reactive terminal applications with JSX
          </text>
        </vstack>
      </box>

      <text></text>

      {/* Feature Cards */}
      <hstack>
        <box border="rounded" padding={1} style={style().fg(colors.blue)}>
          <vstack>
            <text style={style().bold()}>⚡ Fast</text>
            <text style={style().faint()}>Effect-based</text>
          </vstack>
        </box>

        <text> </text>

        <box border="rounded" padding={1} style={style().fg(colors.magenta)}>
          <vstack>
            <text style={style().bold()}>🎨 Beautiful</text>
            <text style={style().faint()}>Rich styling</text>
          </vstack>
        </box>

        <text> </text>

        <box border="rounded" padding={1} style={style().fg(colors.yellow)}>
          <vstack>
            <text style={style().bold()}>🔄 Reactive</text>
            <text style={style().faint()}>Svelte runes</text>
          </vstack>
        </box>
      </hstack>

      <text></text>

      {/* Border Styles Section */}
      <text style={style().fg(colors.cyan).bold()}>Border Styles:</text>
      <hstack>
        <box border="rounded" padding={1}>
          <text>Rounded</text>
        </box>
        <text> </text>
        <box border="double" padding={1}>
          <text>Double</text>
        </box>
        <text> </text>
        <box border="thick" padding={1}>
          <text>Thick</text>
        </box>
        <text> </text>
        <box border="thin" padding={1}>
          <text>Thin</text>
        </box>
        <text> </text>
        <box border="ascii" padding={1}>
          <text>ASCII</text>
        </box>
      </hstack>

      <text></text>

      {/* Color Palette */}
      <text style={style().fg(colors.cyan).bold()}>Color Palette:</text>
      <hstack>
        <box border="thin" padding={1} style={style().bg(colors.red).fg(colors.white)}>
          <text>Red</text>
        </box>
        <text> </text>
        <box border="thin" padding={1} style={style().bg(colors.green).fg(colors.black)}>
          <text>Green</text>
        </box>
        <text> </text>
        <box border="thin" padding={1} style={style().bg(colors.yellow).fg(colors.black)}>
          <text>Yellow</text>
        </box>
        <text> </text>
        <box border="thin" padding={1} style={style().bg(colors.blue).fg(colors.white)}>
          <text>Blue</text>
        </box>
        <text> </text>
        <box border="thin" padding={1} style={style().bg(colors.magenta).fg(colors.white)}>
          <text>Magenta</text>
        </box>
        <text> </text>
        <box border="thin" padding={1} style={style().bg(colors.cyan).fg(colors.black)}>
          <text>Cyan</text>
        </box>
      </hstack>

      <text></text>

      {/* Status Messages */}
      <text style={style().fg(colors.cyan).bold()}>Status Messages:</text>
      <vstack>
        <box border="thin" padding={1} style={style().bg(colors.green).fg(colors.black)}>
          <text>✓ Success: Operation completed successfully</text>
        </box>
        <box border="thin" padding={1} style={style().bg(colors.yellow).fg(colors.black)}>
          <text>⚠ Warning: This action may have side effects</text>
        </box>
        <box border="thin" padding={1} style={style().bg(colors.red).fg(colors.white)}>
          <text>✗ Error: Something went wrong</text>
        </box>
        <box border="thin" padding={1} style={style().bg(colors.blue).fg(colors.white)}>
          <text>ℹ Info: Here's some helpful information</text>
        </box>
      </vstack>

      <text></text>

      {/* Text Decorations */}
      <text style={style().fg(colors.cyan).bold()}>Text Decorations:</text>
      <box border="rounded" padding={1}>
        <vstack>
          <text style={style().bold()}>Bold text</text>
          <text style={style().italic()}>Italic text</text>
          <text style={style().underline()}>Underlined text</text>
          <text style={style().faint()}>Faint text</text>
          <text style={style().strikethrough()}>Strikethrough text</text>
        </vstack>
      </box>

      <text></text>

      {/* Nested Layout Example */}
      <text style={style().fg(colors.cyan).bold()}>Nested Layouts:</text>
      <box border="double" padding={1} style={style().fg(colors.green)}>
        <vstack>
          <text style={style().bold()}>Dashboard View</text>
          <text></text>
          <hstack>
            <box border="rounded" padding={1}>
              <vstack>
                <text style={style().fg(colors.cyan).bold()}>CPU</text>
                <text>45%</text>
              </vstack>
            </box>
            <text> </text>
            <box border="rounded" padding={1}>
              <vstack>
                <text style={style().fg(colors.magenta).bold()}>Memory</text>
                <text>2.1 GB</text>
              </vstack>
            </box>
            <text> </text>
            <box border="rounded" padding={1}>
              <vstack>
                <text style={style().fg(colors.yellow).bold()}>Disk</text>
                <text>67%</text>
              </vstack>
            </box>
          </hstack>
        </vstack>
      </box>

      <text></text>

      {/* Gradient Effects */}
      <text style={style().fg(colors.cyan).bold()}>Gradient Effects:</text>
      <vstack>
        <box border="rounded" padding={1}>
          <vstack>
            <text>
              {textGradient({
                gradient: rainbowGradient(),
                text: '🌈 Rainbow Gradient - TUIX is Amazing!',
              })}
            </text>
            <text>
              {textGradient({
                gradient: sunsetGradient(),
                text: '🌅 Sunset Gradient - Beautiful Colors',
              })}
            </text>
            <text>
              {textGradient({
                gradient: oceanGradient(),
                text: '🌊 Ocean Gradient - Deep Blue Vibes',
              })}
            </text>
          </vstack>
        </box>
      </vstack>

      <text></text>

      {/* Chat Interface Example */}
      <text style={style().fg(colors.cyan).bold()}>Chat Interface Example:</text>
      <box border="double" padding={1} style={style().fg(colors.white)}>
        <vstack>
          {/* Chat messages */}
          <box border="thin" padding={1} style={style().bg(colors.blue).fg(colors.white)}>
            <text>Alice: Hey! Check out this new TUI framework</text>
          </box>
          <box border="thin" padding={1} style={style().bg(colors.green).fg(colors.white)}>
            <text>Bob: Wow, it looks amazing! 🎉</text>
          </box>
          <box border="thin" padding={1} style={style().bg(colors.blue).fg(colors.white)}>
            <text>Alice: Right? JSX for terminal UIs!</text>
          </box>

          <text></text>

          {/* Input field */}
          <hstack>
            <text style={style().fg(colors.cyan).bold()}>You:</text>
            <text> </text>
            <box border="rounded" padding={1} style={style().bg(colors.gray).fg(colors.white)}>
              <text>Type your message here... ✍️</text>
            </box>
          </hstack>
        </vstack>
      </box>

      <text></text>

      {/* Mixed Border Styles Layout */}
      <text style={style().fg(colors.cyan).bold()}>Mixed Border Styles:</text>
      <box border="double" padding={1} style={style().fg(colors.magenta)}>
        <vstack>
          <text style={style().bold()}>Container (Double Border)</text>
          <text></text>
          <hstack>
            <box border="rounded" padding={1} style={style().fg(colors.blue)}>
              <text>Rounded</text>
            </box>
            <text> </text>
            <box border="thick" padding={1} style={style().fg(colors.green)}>
              <text>Thick</text>
            </box>
            <text> </text>
            <box border="ascii" padding={1} style={style().fg(colors.yellow)}>
              <text>ASCII</text>
            </box>
          </hstack>
        </vstack>
      </box>

      <text></text>

      {/* Footer */}
      <box padding={1} style={style().bg(colors.blue).fg(colors.white)}>
        <text>Press Ctrl+C to exit | Try: showcase, hello, foo</text>
      </box>
    </vstack>
  )
}
