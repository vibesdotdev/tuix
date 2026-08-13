import { describe, expect, test } from 'bun:test'
import { $state } from '@tuix/reactive'
import { labelOf, readBound } from './bind'

describe('bind helpers', () => {
  test('readBound unwraps runes and passes values through', () => {
    const name = $state('Ada')
    expect(readBound(name)).toBe('Ada')
    expect(readBound('plain')).toBe('plain')
    expect(readBound(undefined)).toBeUndefined()
  })

  test('labelOf flattens children', () => {
    expect(labelOf('Save')).toBe('Save')
    expect(labelOf(['Sa', 've'])).toBe('Save')
    expect(labelOf(null, 'OK')).toBe('OK')
  })
})
