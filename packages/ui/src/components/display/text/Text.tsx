/**
 * Text Component - JSX version for styled text display
 *
 * Rich text display with:
 * - Multiple color options
 * - Text styles (bold, italic, underline, etc.)
 * - Alignment options
 * - Truncation and wrapping
 * - Gradients and animations
 *
 * @example
 * ```tsx
 * import { Text, Heading, Code } from 'tuix/components/display/text'
 *
 * function MyComponent() {
 *   return (
 *     <vstack>
 *       <Heading level={1}>Welcome!</Heading>
 *
 *       <Text color="blue" bold>
 *         Important message
 *       </Text>
 *
 *       <Code language="typescript">
 *         const greeting = "Hello, World!"
 *       </Code>
 *     </vstack>
 *   )
 * }
 * ```
 */

import { $state, $derived, $effect } from '@tuix/reactive/runes/runes'
import { style, colors, color, parseColor, type Style, type Color } from '@tuix/ansi'
import { stringWidth } from '@tuix/view/string/width'

export interface TextProps {
  children: string | number | boolean

  // Colors (accept both Color objects and string shortcuts)
  color?: Color | string
  background?: Color | string
  gradient?: { from: Color | string; to: Color | string; direction?: 'horizontal' | 'vertical' }

  // Styles
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  dim?: boolean
  bright?: boolean
  inverse?: boolean

  // Layout
  align?: 'left' | 'center' | 'right'
  width?: number
  wrap?: boolean | 'word' | 'char'
  truncate?: boolean | number
  ellipsis?: string

  // Effects
  blink?: boolean
  rainbow?: boolean
  pulse?: boolean

  // Behavior
  selectable?: boolean
  copyable?: boolean

  className?: string
  style?: Style
}

/**
 * Text Component
 */
/** Flatten JSX text children without Array.prototype.toString commas. */
function childrenToText(children: TextProps['children'] | unknown): string {
  if (children == null || typeof children === 'boolean') return ''
  if (typeof children === 'string' || typeof children === 'number') return String(children)
  if (Array.isArray(children)) {
    return children.map(childrenToText).join('')
  }
  return String(children)
}

export function Text(props: TextProps): JSX.Element {
  // Convert children to string (arrays must not use Array#toString → "a,b")
  const content = childrenToText(props.children)

  // Computed style
  const textStyle = $derived(() => {
    const baseStyle: Style = {
      ...props.style,
    }

    // Colors - map to correct property names (foreground/background) and convert strings
    if (props.color) baseStyle.foreground = parseColor(props.color)
    if (props.background) baseStyle.background = parseColor(props.background)
    if (props.gradient) {
      baseStyle.gradient = {
        from: parseColor(props.gradient.from)!,
        to: parseColor(props.gradient.to)!,
        direction: props.gradient.direction || 'horizontal',
      }
    }

    // Text styles
    if (props.bold) baseStyle.bold = true
    if (props.italic) baseStyle.italic = true
    if (props.underline) baseStyle.underline = true
    if (props.strikethrough) baseStyle.strikethrough = true
    if (props.dim) baseStyle.dim = true
    if (props.bright) baseStyle.bright = true
    if (props.inverse) baseStyle.inverse = true

    // Effects
    if (props.blink) baseStyle.blink = true

    // Layout
    if (props.align) baseStyle.textAlign = props.align
    if (props.width) baseStyle.width = props.width

    return style(baseStyle)
  })

  // Process text
  const processedText = $derived(() => {
    let text = content

    // Handle truncation
    if (props.truncate && props.width) {
      const maxWidth = typeof props.truncate === 'number' ? props.truncate : props.width
      if (stringWidth(text) > maxWidth) {
        const ellipsis = props.ellipsis || '...'
        const ellipsisWidth = stringWidth(ellipsis)
        const availableWidth = maxWidth - ellipsisWidth

        // Truncate to fit
        while (stringWidth(text) > availableWidth && text.length > 0) {
          text = text.slice(0, -1)
        }
        text += ellipsis
      }
    }

    // Handle wrapping
    if (props.wrap && props.width) {
      const maxW = props.width
      const mode = props.wrap === 'char' ? 'char' : 'word'
      const lines: string[] = []
      if (mode === 'char') {
        let rest = text
        while (rest.length > 0) {
          let take = rest.length
          while (take > 0 && stringWidth(rest.slice(0, take)) > maxW) take--
          if (take === 0) take = 1
          lines.push(rest.slice(0, take))
          rest = rest.slice(take)
        }
      } else {
        const words = text.split(/(\s+)/)
        let line = ''
        for (const w of words) {
          const candidate = line + w
          if (stringWidth(candidate) <= maxW) {
            line = candidate
          } else {
            if (line) lines.push(line)
            line = w.trimStart()
            if (stringWidth(line) > maxW) {
              let rest = line
              line = ''
              while (stringWidth(rest) > maxW) {
                let take = rest.length
                while (take > 0 && stringWidth(rest.slice(0, take)) > maxW) take--
                if (take === 0) take = 1
                lines.push(rest.slice(0, take))
                rest = rest.slice(take)
              }
              line = rest
            }
          }
        }
        if (line) lines.push(line)
      }
      text = lines.join('\n')
    }

    return text
  })

  // Handle effects
  if (props.rainbow) {
    return <RainbowText {...props}>{content}</RainbowText>
  }

  if (props.pulse) {
    return <PulsingText {...props}>{content}</PulsingText>
  }

  return (
    <text style={textStyle()} className={props.className}>
      {processedText()}
    </text>
  )
}

// Effect components
function RainbowText(props: TextProps): JSX.Element {
  const rainbowColors = [
    colors.red,
    colors.yellow,
    colors.green,
    colors.cyan,
    colors.blue,
    colors.magenta,
  ]

  const colorIndex = $state(0)

  $effect(() => {
    const interval = setInterval(() => {
      colorIndex.$set((colorIndex() + 1) % colors.length)
    }, 100)

    return () => clearInterval(interval)
  })

  return <Text {...props} color={rainbowColors[colorIndex()]} rainbow={false} />
}

function PulsingText(props: TextProps): JSX.Element {
  const bright = $state(false)

  $effect(() => {
    const interval = setInterval(() => {
      bright.$set(!bright())
    }, 500)

    return () => clearInterval(interval)
  })

  return <Text {...props} bright={bright()} pulse={false} />
}

// Specialized text components
export function Heading(props: TextProps & { level?: 1 | 2 | 3 | 4 | 5 | 6 }): JSX.Element {
  const { level = 1, ...textProps } = props

  const palette = {
    1: { bold: true, color: colors.white },
    2: { bold: true, color: colors.white },
    3: { bold: true, color: colors.gray },
    4: { color: colors.white },
    5: { color: colors.gray },
    6: { color: colors.gray, dim: true },
  } as const

  return <Text {...palette[level]} {...textProps} />
}

export function Code(props: TextProps & { language?: string }): JSX.Element {
  return (
    <Text
      color={colors.green}
      background={colors.black}
      style={{ padding: { horizontal: 1 } }}
      {...props}
    />
  )
}

export function Link(props: TextProps & { href?: string; onClick?: () => void }): JSX.Element {
  const hovering = $state(false)

  return (
    <interactive
      onMouseEnter={() => {
        hovering.$set(true)
      }}
      onMouseLeave={() => {
        hovering.$set(false)
      }}
      onClick={props.onClick}
    >
      <Text color={colors.blue} underline={hovering()} bright={hovering()} {...props} />
    </interactive>
  )
}

export function Label(props: TextProps): JSX.Element {
  return <Text color={colors.gray} {...props} />
}

export function Success(props: TextProps): JSX.Element {
  return <Text color={colors.green} {...props} />
}

export function Error(props: TextProps): JSX.Element {
  return <Text color={colors.red} {...props} />
}

export function Warning(props: TextProps): JSX.Element {
  return <Text color={colors.yellow} {...props} />
}

export function Info(props: TextProps): JSX.Element {
  return <Text color={colors.blue} {...props} />
}

// Factory functions
export const text = (props: TextProps) => <Text {...props} />
export const heading = (props: TextProps & { level?: 1 | 2 | 3 | 4 | 5 | 6 }) => (
  <Heading {...props} />
)
export const code = (props: TextProps & { language?: string }) => <Code {...props} />
export const link = (props: TextProps & { href?: string; onClick?: () => void }) => (
  <Link {...props} />
)
