import { Data } from 'effect'
import type {
  BorderStyle,
  Color,
  HorizontalAlign,
  StyleProps,
  StyleTransform,
  VerticalAlign,
} from '../types'

const normalizeSpacing = (values: number[]): [number, number, number, number] => {
  if (values.length === 0) return [0, 0, 0, 0]
  if (values.length === 1) {
    const [all] = values
    return [all, all, all, all]
  }
  if (values.length === 2) {
    const [vertical, horizontal] = values
    return [vertical, horizontal, vertical, horizontal]
  }
  const [top, right, bottom, left] = values as [number, number, number, number]
  return [top, right, bottom, left]
}

export class Style extends Data.Class<{ props: StyleProps }> {
  constructor(props: Partial<StyleProps> = {}) {
    super({ props: { ...props } })
    Object.freeze(this.props)
  }

  fg(color: Color): Style {
    return new Style({ ...this.props, foreground: color })
  }

  bg(color: Color): Style {
    return new Style({ ...this.props, background: color })
  }

  foreground(color: Color): Style {
    return this.fg(color)
  }

  background(color: Color): Style {
    return this.bg(color)
  }

  bold(enable = true): Style {
    return new Style({ ...this.props, bold: enable })
  }

  italic(enable = true): Style {
    return new Style({ ...this.props, italic: enable })
  }

  underline(enable = true): Style {
    return new Style({ ...this.props, underline: enable })
  }

  strikethrough(enable = true): Style {
    return new Style({ ...this.props, strikethrough: enable })
  }

  faint(enable = true): Style {
    return new Style({ ...this.props, faint: enable })
  }

  blink(enable = true): Style {
    return new Style({ ...this.props, blink: enable })
  }

  reverse(enable = true): Style {
    return new Style({ ...this.props, reverse: enable })
  }

  invisible(enable = true): Style {
    return new Style({ ...this.props, invisible: enable })
  }

  border(style: BorderStyle): Style {
    return new Style({ ...this.props, border: style })
  }

  borderFg(color: Color): Style {
    return new Style({ ...this.props, borderForeground: color })
  }

  borderBg(color: Color): Style {
    return new Style({ ...this.props, borderBackground: color })
  }

  padding(all: number): Style
  padding(vertical: number, horizontal: number): Style
  padding(top: number, right: number, bottom: number, left: number): Style
  padding(...values: number[]): Style {
    if (values.length === 1) {
      const [all] = values
      return new Style({
        ...this.props,
        paddingTop: all,
        paddingRight: all,
        paddingBottom: all,
        paddingLeft: all,
      })
    } else if (values.length === 2) {
      const [vertical, horizontal] = values
      return new Style({
        ...this.props,
        paddingTop: vertical,
        paddingRight: horizontal,
        paddingBottom: vertical,
        paddingLeft: horizontal,
      })
    } else {
      const [top, right, bottom, left] = values
      return new Style({
        ...this.props,
        paddingTop: top,
        paddingRight: right,
        paddingBottom: bottom,
        paddingLeft: left,
      })
    }
  }

  paddingTop(value: number): Style {
    return new Style({ ...this.props, paddingTop: value })
  }

  paddingRight(value: number): Style {
    return new Style({ ...this.props, paddingRight: value })
  }

  paddingBottom(value: number): Style {
    return new Style({ ...this.props, paddingBottom: value })
  }

  paddingLeft(value: number): Style {
    return new Style({ ...this.props, paddingLeft: value })
  }

  margin(all: number): Style
  margin(vertical: number, horizontal: number): Style
  margin(top: number, right: number, bottom: number, left: number): Style
  margin(...values: number[]): Style {
    if (values.length === 1) {
      const [all] = values
      return new Style({
        ...this.props,
        marginTop: all,
        marginRight: all,
        marginBottom: all,
        marginLeft: all,
      })
    } else if (values.length === 2) {
      const [vertical, horizontal] = values
      return new Style({
        ...this.props,
        marginTop: vertical,
        marginRight: horizontal,
        marginBottom: vertical,
        marginLeft: horizontal,
      })
    } else {
      const [top, right, bottom, left] = values
      return new Style({
        ...this.props,
        marginTop: top,
        marginRight: right,
        marginBottom: bottom,
        marginLeft: left,
      })
    }
  }

  marginTop(value: number): Style {
    return new Style({ ...this.props, marginTop: value })
  }

  marginRight(value: number): Style {
    return new Style({ ...this.props, marginRight: value })
  }

  marginBottom(value: number): Style {
    return new Style({ ...this.props, marginBottom: value })
  }

  marginLeft(value: number): Style {
    return new Style({ ...this.props, marginLeft: value })
  }

  width(value: number): Style {
    return new Style({ ...this.props, width: value })
  }

  height(value: number): Style {
    return new Style({ ...this.props, height: value })
  }

  maxWidth(value: number): Style {
    return new Style({ ...this.props, maxWidth: value })
  }

  maxHeight(value: number): Style {
    return new Style({ ...this.props, maxHeight: value })
  }

  minWidth(value: number): Style {
    return new Style({ ...this.props, minWidth: value })
  }

  minHeight(value: number): Style {
    return new Style({ ...this.props, minHeight: value })
  }

  align(value: HorizontalAlign): Style {
    return new Style({ ...this.props, align: value })
  }

  valign(value: VerticalAlign): Style {
    return new Style({ ...this.props, valign: value })
  }

  transform(fn: StyleTransform): Style {
    return new Style({ ...this.props, transform: fn })
  }

  inline(enable = true): Style {
    return new Style({ ...this.props, inline: enable })
  }

  inherit(enable = true): Style {
    return new Style({ ...this.props, inherit: enable })
  }

  overflow(value: StyleProps['overflow']): Style {
    return new Style({ ...this.props, overflow: value })
  }

  wordBreak(value: StyleProps['wordBreak']): Style {
    return new Style({ ...this.props, wordBreak: value })
  }

  merge(other: Style): Style {
    return new Style({ ...this.props, ...other.props })
  }

  copy(props: Partial<StyleProps>): Style {
    return new Style({ ...this.props, ...props })
  }

  toProps(): StyleProps {
    return { ...this.props }
  }
}

export const style = (props?: Partial<StyleProps>): Style => new Style(props)

export const fromProps = (props: StyleProps): Style => new Style(props)

export const styles = {
  bold: style().bold(),
  italic: style().italic(),
  underline: style().underline(),
  faint: style().faint(),
  strikethrough: style().strikethrough(),
  centered: style().align('center'),
  right: style().align('right'),
  padded: style().padding(1),
  inline: style().inline(),
  none: style(),
} as const

export type { StyleProps, HorizontalAlign, VerticalAlign, StyleTransform }
