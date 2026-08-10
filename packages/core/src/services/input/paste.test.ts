import { test, expect, describe } from 'bun:test'
import {
  extractBracketedPaste,
  createPasteAccumulator,
  BRACKETED_PASTE_START,
  BRACKETED_PASTE_END,
} from './paste'

describe('extractBracketedPaste', () => {
  test('extracts complete paste', () => {
    const r = extractBracketedPaste(
      `pre${BRACKETED_PASTE_START}hello world${BRACKETED_PASTE_END}post`
    )
    expect(r).toEqual({ paste: 'hello world', rest: 'prepost' })
  })
  test('incomplete returns null', () => {
    expect(extractBracketedPaste(`${BRACKETED_PASTE_START}partial`)).toBeNull()
  })
})

describe('createPasteAccumulator', () => {
  test('emits across chunks', () => {
    const acc = createPasteAccumulator()
    expect(acc.push(BRACKETED_PASTE_START + 'ab')).toEqual([])
    expect(acc.push('cd' + BRACKETED_PASTE_END)).toEqual(['abcd'])
  })
})
