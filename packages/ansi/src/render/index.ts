import { BorderSide } from '../types'
import type { RenderOptions, StyleProps } from '../types'
import { getBorderFromStyle, renderBox } from '../border/utils'
import { ColorProfile } from '../color/profile'
import { toAnsiSequence } from '../color/convert'
import { Style } from '../style'
import { pad as padToWidth, visualWidth } from '../core/width'
import { stripAnsi } from '../core/strip'

const RESET = '\u001b[0m'
const DECORATIONS: Record<string, string> = {
  bold: '\u001b[1m',
  faint: '\u001b[2m',
  italic: '\u001b[3m',
  underline: '\u001b[4m',
  blink: '\u001b[5m',
  reverse: '\u001b[7m',
  strikethrough: '\u001b[9m',
}

const toProps = (style: Style | StyleProps): StyleProps =>
  style instanceof Style ? style.props : style

const applyTransform = (text: string, props: StyleProps): string =>
  props.transform ? props.transform(text) : text

const wrapLine = (line: string, width: number): string[] => {
  if (visualWidth(line) <= width || width <= 0) return [line]

  const result: string[] = []
  let buffer = ''
  let currentWidth = 0

  for (const char of [...line]) {
    const charWidth = visualWidth(char)
    if (currentWidth + charWidth > width && buffer) {
      result.push(buffer)
      buffer = char
      currentWidth = charWidth
    } else {
      buffer += char
      currentWidth += charWidth
    }
  }

  if (buffer) result.push(buffer)
  return result
}

const wrapLines = (lines: string[], width: number | undefined, shouldWrap: boolean): string[] => {
  if (!width || !shouldWrap) return lines
  return lines.flatMap(line => wrapLine(line, width))
}

const alignHorizontal = (line: string, width: number, alignment: StyleProps['align']): string => {
  if (!alignment) return padToWidth(line, width)

  switch (alignment) {
    case 'right':
      return padToWidth(line, width, 'right')
    case 'center':
      return padToWidth(line, width, 'center')
    case 'justify': {
      const words = line.split(' ')
      if (words.length <= 1) return padToWidth(line, width)
      const textWidth = visualWidth(stripAnsi(line))
      const totalSpace = width - textWidth
      const gaps = words.length - 1
      const spacePerGap = Math.floor(totalSpace / gaps)
      const extra = totalSpace % gaps
      let result = words[0] ?? ''
      for (let index = 1; index < words.length; index++) {
        const spaces = spacePerGap + (index <= extra ? 1 : 0)
        result += ' '.repeat(spaces + 1) + (words[index] ?? '')
      }
      return result
    }
    case 'left':
    default:
      return padToWidth(line, width)
  }
}

const alignLines = (lines: string[], width: number | undefined, alignment: StyleProps['align']): string[] => {
  if (!width) return lines
  return lines.map(line => alignHorizontal(line, width, alignment))
}

const applyVerticalAlign = (
  lines: string[],
  height: number | undefined,
  alignment: StyleProps['valign']
): string[] => {
  if (!height || lines.length >= height) return lines.slice(0, height ?? lines.length)

  const emptyLine = ' '.repeat(Math.max(...lines.map(visualWidth), 0))
  const padCount = height - lines.length

  switch (alignment) {
    case 'bottom':
      return Array(padCount).fill(emptyLine).concat(lines)
    case 'middle': {
      const top = Math.floor(padCount / 2)
      const bottom = padCount - top
      return [
        ...Array(top).fill(emptyLine),
        ...lines,
        ...Array(bottom).fill(emptyLine),
      ]
    }
    case 'top':
    default:
      return [...lines, ...Array(padCount).fill(emptyLine)]
  }
}

const applyPadding = (lines: string[], props: StyleProps): string[] => {
  const top = props.paddingTop ?? 0
  const right = props.paddingRight ?? 0
  const bottom = props.paddingBottom ?? 0
  const left = props.paddingLeft ?? 0

  if (!top && !right && !bottom && !left) return lines

  const contentWidth = Math.max(0, ...lines.map(visualWidth))
  const paddedWidth = contentWidth + left + right
  const emptyLine = ' '.repeat(paddedWidth)

  const horizontal = lines.map(line => {
    const base = padToWidth(line, contentWidth)
    return ' '.repeat(left) + base + ' '.repeat(right)
  })

  return [
    ...Array(top).fill(emptyLine),
    ...horizontal,
    ...Array(bottom).fill(emptyLine),
  ]
}

const applyBorder = (lines: string[], props: StyleProps): string[] => {
  const borderStyle = props.border
  if (!borderStyle) return lines

  const border = getBorderFromStyle(borderStyle)
  const sides = borderStyle.sides ?? BorderSide.All
  const contentWidth = Math.max(0, ...lines.map(visualWidth))
  const width = Math.max(borderStyle.type ? contentWidth + 2 : contentWidth, props.width ?? contentWidth + 2)
  const height = lines.length + 2

  const rendered = renderBox({
    width,
    height,
    border,
    sides,
    content: lines,
    padding: 0,
  })

  return rendered.split('\n')
}

export const buildDecorationSequence = (props: StyleProps): string => {
  let sequence = ''
  if (props.bold) sequence += DECORATIONS.bold
  if (props.faint) sequence += DECORATIONS.faint
  if (props.italic) sequence += DECORATIONS.italic
  if (props.underline) sequence += DECORATIONS.underline
  if (props.blink) sequence += DECORATIONS.blink
  if (props.reverse) sequence += DECORATIONS.reverse
  if (props.strikethrough) sequence += DECORATIONS.strikethrough
  return sequence
}

const applyColors = (line: string, props: StyleProps, profile: ColorProfile): string => {
  if (profile === ColorProfile.NoColor) return stripAnsi(line)

  let sequence = ''

  if (props.foreground) {
    sequence += toAnsiSequence(props.foreground, profile, false)
  }
  if (props.background) {
    sequence += toAnsiSequence(props.background, profile, true)
  }

  sequence += buildDecorationSequence(props)

  if (!sequence) return line
  return sequence + line + RESET
}

const applyMargin = (lines: string[], props: StyleProps): string[] => {
  const top = props.marginTop ?? 0
  const bottom = props.marginBottom ?? 0
  const left = props.marginLeft ?? 0
  const right = props.marginRight ?? 0

  if (!top && !bottom && !left && !right) return lines

  const leftPad = ' '.repeat(left)
  const rightPad = ' '.repeat(right)
  const widest = Math.max(0, ...lines.map(visualWidth)) + left + right
  const emptyLine = ' '.repeat(widest)

  const margined = lines.map(line => leftPad + line + rightPad)
  return [
    ...Array(top).fill(emptyLine),
    ...margined,
    ...Array(bottom).fill(emptyLine),
  ]
}

const shouldWrap = (props: StyleProps, options: RenderOptions): boolean => {
  if (typeof options.wrapText === 'boolean') return options.wrapText
  return props.overflow !== 'visible'
}

export const renderStyled = (
  input: string,
  style: Style | StyleProps,
  options: RenderOptions = {}
): string => {
  const props = toProps(style)
  const profile = options.colorProfile ?? ColorProfile.TrueColor

  const transformed = applyTransform(input, props)
  const wrapWidth = options.width ?? props.width ?? props.maxWidth
  let lines = transformed.split('\n')

  lines = wrapLines(lines, wrapWidth, shouldWrap(props, options))
  lines = alignLines(lines, wrapWidth, props.align)

  const height = options.height ?? props.height
  lines = applyVerticalAlign(lines, height, props.valign)

  lines = applyPadding(lines, props)
  lines = applyBorder(lines, props)

  lines = lines.map(line => applyColors(line, props, profile))
  lines = applyMargin(lines, props)

  return lines.join('\n')
}

export const renderStyledSync = (
  input: string,
  style: Style | StyleProps,
  options: RenderOptions = {}
): string => renderStyled(input, style, options)

export const renderLines = (
  input: string,
  style: Style | StyleProps,
  options: RenderOptions = {}
): string[] => renderStyled(input, style, options).split('\n')

/**
 * Convert style props to ANSI escape sequence
 */
export const toAnsiStyleCode = (props: StyleProps, profile: ColorProfile = ColorProfile.TrueColor): string => {
  let sequence = ''

  // Add color sequences
  if (props.foreground) {
    sequence += toAnsiSequence(props.foreground, profile, false)
  }
  if (props.background) {
    sequence += toAnsiSequence(props.background, profile, true)
  }

  // Add decoration sequences
  sequence += buildDecorationSequence(props)

  return sequence
}
