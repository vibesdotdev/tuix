import { describe, expect, test } from 'bun:test'

import { parseStyledText, tokenizeAnsi } from './index'

describe('ANSI parser', () => {
  test('parseStyledText splits text and retains style context', () => {
    const segments = parseStyledText('Hello \u001b[31mRed\u001b[0m')
    expect(segments).toEqual([
      { text: 'Hello ', codes: [] },
      { text: 'Red', codes: ['\u001b[31m'] },
    ])
  })

  test('tokenizeAnsi marks escape sequences as codes', () => {
    const tokens = tokenizeAnsi('\u001b[1mBold\u001b[0m')
    expect(tokens.filter(token => token.type === 'code')).toHaveLength(2)
    expect(tokens.filter(token => token.type === 'text')).toHaveLength(1)
  })
})
