import { describe, expect, it } from 'bun:test'
import { formatStatusBar, formatStatusBarSegments, clipStatusBarSegments } from './StatusBar.tsx'

describe('StatusBar', () => {
  it('joins facts and hints into one line', () => {
    expect(
      formatStatusBar({
        facts: [{ slot: 'context', value: 'main · dirty' }],
        hints: [{ keys: '?', label: 'help' }],
      })
    ).toBe('main · dirty  ·  [?] help')
  })

  it('drops blank facts', () => {
    expect(formatStatusBar({ facts: [{ slot: 'context', value: '  ' }] })).toBe('')
  })

  it('clips to width', () => {
    expect(
      formatStatusBar({
        facts: [{ slot: 'context', value: 'rewrite auth' }],
        hints: [{ keys: '?', label: 'help' }],
        width: 10,
      })
    ).toBe('rewrite a…')
  })

  it('carries fact tones into segments', () => {
    const segments = formatStatusBarSegments({
      facts: [
        { slot: 'branch', value: 'main', tone: 'default' },
        { slot: 'ci', value: 'failing', tone: 'danger' },
      ],
      hints: [{ keys: '?', label: 'help' }],
    })

    expect(segments.map(segment => segment.text)).toEqual([
      'main',
      '  ·  ',
      'failing',
      '  ·  ',
      '[?] help',
    ])
    expect(segments.map(segment => segment.tone)).toEqual([
      'default',
      'muted',
      'danger',
      'muted',
      'hint',
    ])
  })

  it('defaults facts to muted tone', () => {
    const segments = formatStatusBarSegments({ facts: [{ slot: 'a', value: 'x' }] })
    expect(segments[0]?.tone).toBe('muted')
  })

  it('clips segments across boundaries with an ellipsis', () => {
    const clipped = clipStatusBarSegments(
      [
        { text: 'rewrite', tone: 'muted' },
        { text: '  ·  ', tone: 'muted' },
        { text: 'auth', tone: 'muted' },
      ],
      10
    )
    expect(clipped.map(segment => segment.text).join('')).toBe('rewrite  …')
  })

  it('leaves short segments unclipped', () => {
    const segments = [{ text: 'ok', tone: 'muted' }]
    expect(clipStatusBarSegments(segments, 80)).toBe(segments)
  })
})
