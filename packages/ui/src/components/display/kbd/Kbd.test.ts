import { describe, expect, it } from 'bun:test'
import { formatKeys } from './Kbd.tsx'
import { initialsOf, avatarAccent } from '../avatar/Avatar.tsx'
import { skeletonLine } from '../../feedback/skeleton/Skeleton.tsx'
import { sparklineBars } from '../../data/sparkline/Sparkline.tsx'

describe('Kbd.formatKeys', () => {
  it('renders single keys as typed (what the user presses)', () => {
    expect(formatKeys('/')).toBe('/')
    expect(formatKeys('a')).toBe('a')
    expect(formatKeys('?')).toBe('?')
  })

  it('expands modifiers and named keys', () => {
    expect(formatKeys('ctrl+s')).toBe('^s')
    expect(formatKeys('alt+enter')).toBe('⌥Enter')
    expect(formatKeys('esc')).toBe('Esc')
    expect(formatKeys('space')).toBe('Space')
    expect(formatKeys('tab')).toBe('Tab')
  })

  it('keeps combos as written', () => {
    expect(formatKeys('j/k')).toBe('j/k')
    expect(formatKeys('1/2/3')).toBe('1/2/3')
  })

  it('drops empty parts', () => {
    expect(formatKeys('a++b')).toBe('ab')
    expect(formatKeys('ctrl + x')).toBe('^x')
  })
})

describe('Avatar.initialsOf', () => {
  it('takes the first two word initials', () => {
    expect(initialsOf('Ada Lovelace')).toBe('AL')
    expect(initialsOf('grace hopper')).toBe('GH')
  })

  it('falls back to two letters of one word', () => {
    expect(initialsOf('tuix')).toBe('TU')
  })

  it('handles blank names', () => {
    expect(initialsOf('   ')).toBe('?')
  })
})

describe('Avatar.avatarAccent', () => {
  it('is stable per name', () => {
    const palette = ['#a', '#b', '#c']
    expect(avatarAccent('ada', palette)).toBe(avatarAccent('ada', palette))
  })

  it('picks from the palette only', () => {
    const palette = ['#a', '#b', '#c']
    for (const name of ['ada', 'grace', 'linus', 'x', 'y', 'z']) {
      expect(palette).toContain(avatarAccent(name, palette))
    }
  })

  it('throws on an empty palette', () => {
    expect(() => avatarAccent('ada', [])).toThrow()
  })
})

describe('Skeleton.skeletonLine', () => {
  it('fills the requested width', () => {
    expect(skeletonLine(5)).toBe('▒▒▒▒▒')
  })

  it('never returns an empty line', () => {
    expect(skeletonLine(0)).toBe('▒')
  })
})

describe('Sparkline.sparklineBars', () => {
  it('scales values across block glyphs', () => {
    expect(sparklineBars([0, 5, 10])).toBe('▁▅█')
  })

  it('renders flat series at full height', () => {
    expect(sparklineBars([4, 4, 4])).toBe('███')
  })

  it('marks non-finite points as empty', () => {
    expect(sparklineBars([1, Number.NaN, 3])).toBe('▁·█')
  })

  it('resamples to the requested width', () => {
    expect(sparklineBars([0, 10], 4)).toBe('▁▁██')
  })

  it('returns empty for no values', () => {
    expect(sparklineBars([])).toBe('')
  })
})
