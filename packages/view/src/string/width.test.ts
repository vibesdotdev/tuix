/**
 * String Width Tests
 *
 * Tests for the string width calculation utility that handles ANSI sequences and Unicode
 */

import { describe, it, expect } from 'bun:test'
import { stringWidth } from './width'

describe('String Width', () => {
  describe('Basic text', () => {
    it('should calculate width of plain ASCII text', () => {
      expect(stringWidth('hello')).toBe(5)
      expect(stringWidth('Hello, World!')).toBe(13)
      expect(stringWidth('')).toBe(0)
    })

    it('should handle single characters', () => {
      expect(stringWidth('a')).toBe(1)
      expect(stringWidth('A')).toBe(1)
      expect(stringWidth('1')).toBe(1)
      expect(stringWidth('@')).toBe(1)
    })

    it('should handle spaces and tabs', () => {
      expect(stringWidth(' ')).toBe(1)
      expect(stringWidth('  ')).toBe(2)
      expect(stringWidth('\t')).toBe(0) // Tab is a control character with 0 visual width
      expect(stringWidth('a b')).toBe(3)
    })
  })

  describe('ANSI escape sequences', () => {
    it('should ignore color codes', () => {
      expect(stringWidth('\x1b[31mred\x1b[0m')).toBe(3)
      expect(stringWidth('\x1b[32mgreen\x1b[0m')).toBe(5)
      expect(stringWidth('\x1b[91mbright red\x1b[0m')).toBe(10)
    })

    it('should ignore style codes', () => {
      expect(stringWidth('\x1b[1mbold\x1b[0m')).toBe(4)
      expect(stringWidth('\x1b[3mitalic\x1b[0m')).toBe(6)
      expect(stringWidth('\x1b[4munderline\x1b[0m')).toBe(9)
    })

    it('should ignore cursor movement codes', () => {
      expect(stringWidth('\x1b[2Jclear')).toBe(5)
      expect(stringWidth('\x1b[H\x1b[2Jtext')).toBe(4)
    })

    it('should handle multiple ANSI sequences', () => {
      const text = '\x1b[31m\x1b[1mbold red\x1b[0m\x1b[0m'
      expect(stringWidth(text)).toBe(8)
    })

    it('should handle mixed text and ANSI codes', () => {
      const text = 'Normal \x1b[31mred\x1b[0m more text'
      expect(stringWidth(text)).toBe(20) // "Normal red more text" = 20 chars
    })
  })

  describe('Unicode characters', () => {
    it('should handle basic Unicode characters', () => {
      expect(stringWidth('café')).toBe(4)
      expect(stringWidth('naïve')).toBe(5)
      expect(stringWidth('résumé')).toBe(6)
    })

    it('should handle emoji correctly', () => {
      expect(stringWidth('👋')).toBe(2) // Most emoji are wide
      expect(stringWidth('🚀')).toBe(2)
      expect(stringWidth('❤️')).toBe(2)
    })

    it('should handle combining characters', () => {
      expect(stringWidth('é')).toBe(1) // e + combining acute
      expect(stringWidth('ñ')).toBe(1) // n + combining tilde
    })

    it('should handle wide characters (CJK)', () => {
      expect(stringWidth('你好')).toBe(4) // Chinese characters are wide
      expect(stringWidth('こんにちは')).toBe(10) // Japanese hiragana
      expect(stringWidth('안녕하세요')).toBe(10) // Korean
    })
  })

  describe('Mixed content', () => {
    it('should handle text with emoji and ANSI codes', () => {
      const text = '\x1b[32m✅ Success\x1b[0m'
      expect(stringWidth(text)).toBe(10) // "✅ Success" (2 + 1 + 7) = 10 chars
    })

    it('should handle Unicode with ANSI codes', () => {
      const text = '\x1b[31mcafé\x1b[0m'
      expect(stringWidth(text)).toBe(4)
    })

    it('should handle complex mixed content', () => {
      const text = 'Hello \x1b[32m🌍\x1b[0m world! café'
      expect(stringWidth(text)).toBe(20) // "Hello 🌍 world! café" (6 + 2 + 7 + 5) = 20
    })
  })

  describe('Edge cases', () => {
    it('should handle null and undefined gracefully', () => {
      expect(stringWidth('')).toBe(0)
    })

    it('should handle control characters', () => {
      expect(stringWidth('\n')).toBe(0) // Newlines don't count for display width
      expect(stringWidth('\r')).toBe(0)
      expect(stringWidth('\b')).toBe(0) // Backspace
    })

    it('should handle malformed ANSI sequences', () => {
      expect(stringWidth('\x1b[')).toBe(0) // Incomplete sequence
      expect(stringWidth('\x1b[999mtext')).toBe(4) // Invalid code but valid text
    })

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000)
      expect(stringWidth(longString)).toBe(10000)
    })

    it('should handle strings with only ANSI codes', () => {
      expect(stringWidth('\x1b[31m\x1b[1m\x1b[0m')).toBe(0)
    })
  })

  describe('Multiline strings', () => {
    it('should calculate width of longest line', () => {
      const multiline = 'short\nthis is longer\ntiny'
      expect(stringWidth(multiline)).toBe(14) // "this is longer"
    })

    it('should handle multiline with ANSI codes', () => {
      const multiline = '\x1b[31mred line\x1b[0m\nlonger normal line'
      expect(stringWidth(multiline)).toBe(18) // "longer normal line"
    })

    it('should handle empty lines', () => {
      const multiline = 'line1\n\nline3'
      expect(stringWidth(multiline)).toBe(5) // "line1" or "line3"
    })
  })

  describe('Performance', () => {
    it('should handle large strings efficiently', () => {
      const largeString = 'Hello '.repeat(10000) + '\x1b[31mworld\x1b[0m'

      const startTime = performance.now()
      const result = stringWidth(largeString)
      const endTime = performance.now()

      expect(result).toBe(60005) // 10000 * 6 + 5
      expect(endTime - startTime).toBeLessThan(100) // Should be fast
    })

    it('should handle many ANSI sequences efficiently', () => {
      const manyAnsi = Array.from({ length: 1000 }, (_, i) => `\x1b[3${i % 8}m${i}\x1b[0m`).join('')

      const startTime = performance.now()
      const result = stringWidth(manyAnsi)
      const endTime = performance.now()

      expect(result).toBeGreaterThan(0)
      expect(endTime - startTime).toBeLessThan(100)
    })
  })
})
