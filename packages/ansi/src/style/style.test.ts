import { describe, expect, test } from 'bun:test'

import { style, fromProps, styles, Style } from './index'
import { colors, color } from '../color'

describe('Style builder', () => {
  test('style() creates style with props', () => {
    const s = style({ foreground: colors.red })
    expect(s.props.foreground).toEqual(colors.red)
  })

  test('fromProps clones provided props', () => {
    const props = { foreground: colors.blue, bold: true }
    const s = fromProps(props)
    expect(s.props.foreground).toEqual(colors.blue)
    expect(s.props.bold).toBe(true)
  })

  test('methods create new instances', () => {
    const base = style({ foreground: colors.green })
    const next = base.bold()
    expect(base).not.toBe(next)
    expect(base.props.bold).toBeUndefined()
    expect(next.props.bold).toBe(true)
  })

  test('color helpers set foreground/background', () => {
    const fg = style().fg(color.rgb(255, 0, 0))
    const bg = style().bg(color.rgb(0, 0, 255))
    expect(fg.props.foreground).toEqual({ type: 'rgb', r: 255, g: 0, b: 0 })
    expect(bg.props.background).toEqual({ type: 'rgb', r: 0, g: 0, b: 255 })
  })

  test('spacing helpers support CSS-like shorthands', () => {
    const s1 = style().padding(2)
    expect(s1.props.paddingTop).toBe(2)
    expect(s1.props.paddingLeft).toBe(2)

    const s2 = style().padding(1, 3)
    expect(s2.props.paddingTop).toBe(1)
    expect(s2.props.paddingRight).toBe(3)

    const s3 = style().padding(1, 2, 3, 4)
    expect(s3.props.paddingBottom).toBe(3)
    expect(s3.props.paddingLeft).toBe(4)
  })

  test('margin helpers mirror padding behaviour', () => {
    const s = style().margin(1, 2, 3, 4)
    expect(s.props.marginTop).toBe(1)
    expect(s.props.marginRight).toBe(2)
    expect(s.props.marginBottom).toBe(3)
    expect(s.props.marginLeft).toBe(4)
  })

  test('dimension helpers store numeric values', () => {
    const s = style().width(10).height(5).minWidth(2).maxHeight(20)
    expect(s.props.width).toBe(10)
    expect(s.props.height).toBe(5)
    expect(s.props.minWidth).toBe(2)
    expect(s.props.maxHeight).toBe(20)
  })

  test('alignment helpers store alignment preferences', () => {
    const s = style().align('center').valign('middle')
    expect(s.props.align).toBe('center')
    expect(s.props.valign).toBe('middle')
  })

  test('merge combines props from other styles', () => {
    const left = style().align('left')
    const bold = style().bold()
    const merged = left.merge(bold)
    expect(merged.props.align).toBe('left')
    expect(merged.props.bold).toBe(true)
  })

  test('copy overrides specific props', () => {
    const s = style({ foreground: colors.red }).copy({ bold: true })
    expect(s.props.foreground).toEqual(colors.red)
    expect(s.props.bold).toBe(true)
  })

  test('styles presets expose ready-to-use definitions', () => {
    expect(styles.bold.props.bold).toBe(true)
    expect(styles.centered.props.align).toBe('center')
    expect(styles.padded.props.paddingTop).toBe(1)
  })

  test('Style#toProps returns mutable snapshot', () => {
    const s = style().bold()
    const props = s.toProps()
    props.bold = false
    expect(s.props.bold).toBe(true)
    expect(props.bold).toBe(false)
  })

  test('inline flags are preserved', () => {
    expect(style().inline().props.inline).toBe(true)
    expect(style().inherit().props.inherit).toBe(true)
  })

  test('Style class keeps props read-only', () => {
    const s = new Style({ bold: true })
    expect(() => ((s.props as unknown as { bold: boolean }).bold = false)).toThrow()
  })
})
