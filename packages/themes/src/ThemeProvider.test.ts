/**
 * @tuix/themes - ThemeProvider / withTheme tests
 */
import { test, expect, describe } from 'bun:test'
import { ThemeProvider, withTheme } from './ThemeProvider'
import { vibesTheme } from './themes/vibes'

describe('@tuix/themes - withTheme', () => {
  test('does not throw when wrapping and invoking a component', () => {
    const Wrapped = withTheme<{ label: string }>(() => null as any)

    expect(() => Wrapped({ label: 'hi' })).not.toThrow()
  })

  test('passes props through and injects the ambient theme', () => {
    let received: { label?: string; theme?: typeof vibesTheme } | undefined
    const Wrapped = withTheme<{ label: string }>(props => {
      received = props
      return null as any
    })

    const element = Wrapped({ label: 'hi' }) as { type: unknown; props: Record<string, unknown> }

    expect(element.type).toBeTypeOf('function')
    expect(element.props.label).toBe('hi')
    expect((element.props.theme as typeof vibesTheme).name).toBe(vibesTheme.name)
  })
})

describe('@tuix/themes - ThemeProvider', () => {
  test('renders its children', () => {
    const children = { sentinel: true }
    const result = ThemeProvider({ children: children as any }) as {
      props: { children: unknown }
    }

    expect(result).toBeTypeOf('object')
    expect(result.props.children).toBe(children)
  })

  test('accepts a config without crashing', () => {
    const children = { sentinel: true }
    expect(() =>
      ThemeProvider({ config: { defaultTheme: 'nord' }, children: children as any })
    ).not.toThrow()
  })
})
