import { describe, expect, test } from 'bun:test'
import { renderMarkGrid } from './Mark'

describe('Mark', () => {
  test('flower and symbol frames are distinct and non-empty', () => {
    const flower = renderMarkGrid(0).join('\n')
    const symbol = renderMarkGrid(1).join('\n')
    expect(flower.trim().length).toBeGreaterThan(4)
    expect(symbol.trim().length).toBeGreaterThan(4)
    expect(flower).not.toBe(symbol)
    expect(flower).not.toContain('[object Object]')
  })
})
