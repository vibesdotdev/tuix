import { describe, test, expect } from 'bun:test'
import { LargeText } from './LargeText'

describe('LargeText', () => {
  test('returns a JSX element tree for banner text', () => {
    const el = LargeText({ children: 'OK' }) as {
      type?: unknown
      props?: { children?: unknown }
    }
    expect(el).toBeDefined()
    // Box wrapper with three text rows
    const kids = el.props?.children
    const arr = Array.isArray(kids) ? kids : kids != null ? [kids] : []
    expect(arr.length).toBeGreaterThanOrEqual(1)
  })

  test('empty string still produces element', () => {
    const el = LargeText({ children: '' })
    expect(el).toBeDefined()
  })
})
