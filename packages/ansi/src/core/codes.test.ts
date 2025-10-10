/**
 * ANSI Codes Tests
 */

import { describe, test, expect } from 'bun:test'
import {
  ANSI_CODES,
  type ANSICode,
  getCode,
  isValidCode,
  fg256,
  bg256,
  fgRgb,
  bgRgb,
} from './codes'
import { colorize } from './escape'

describe('ANSI_CODES', () => {
  test('should have reset code', () => {
    expect(ANSI_CODES.reset).toBe('\u001b[0m')
  })

  test('should have text decoration codes', () => {
    expect(ANSI_CODES.bold).toBe('\u001b[1m')
    expect(ANSI_CODES.dim).toBe('\u001b[2m')
    expect(ANSI_CODES.italic).toBe('\u001b[3m')
    expect(ANSI_CODES.underline).toBe('\u001b[4m')
    expect(ANSI_CODES.blink).toBe('\u001b[5m')
    expect(ANSI_CODES.reverse).toBe('\u001b[7m')
    expect(ANSI_CODES.hidden).toBe('\u001b[8m')
    expect(ANSI_CODES.strikethrough).toBe('\u001b[9m')
  })

  test('should have text decoration reset codes', () => {
    expect(ANSI_CODES.boldOff).toBe('\u001b[22m')
    expect(ANSI_CODES.italicOff).toBe('\u001b[23m')
    expect(ANSI_CODES.underlineOff).toBe('\u001b[24m')
    expect(ANSI_CODES.blinkOff).toBe('\u001b[25m')
    expect(ANSI_CODES.reverseOff).toBe('\u001b[27m')
    expect(ANSI_CODES.hiddenOff).toBe('\u001b[28m')
    expect(ANSI_CODES.strikethroughOff).toBe('\u001b[29m')
  })

  test('should have ANSI 16 foreground colors', () => {
    expect(ANSI_CODES.black).toBe('\u001b[30m')
    expect(ANSI_CODES.red).toBe('\u001b[31m')
    expect(ANSI_CODES.green).toBe('\u001b[32m')
    expect(ANSI_CODES.yellow).toBe('\u001b[33m')
    expect(ANSI_CODES.blue).toBe('\u001b[34m')
    expect(ANSI_CODES.magenta).toBe('\u001b[35m')
    expect(ANSI_CODES.cyan).toBe('\u001b[36m')
    expect(ANSI_CODES.white).toBe('\u001b[37m')
    expect(ANSI_CODES.defaultFg).toBe('\u001b[39m')
  })

  test('should have ANSI 16 background colors', () => {
    expect(ANSI_CODES.bgBlack).toBe('\u001b[40m')
    expect(ANSI_CODES.bgRed).toBe('\u001b[41m')
    expect(ANSI_CODES.bgGreen).toBe('\u001b[42m')
    expect(ANSI_CODES.bgYellow).toBe('\u001b[43m')
    expect(ANSI_CODES.bgBlue).toBe('\u001b[44m')
    expect(ANSI_CODES.bgMagenta).toBe('\u001b[45m')
    expect(ANSI_CODES.bgCyan).toBe('\u001b[46m')
    expect(ANSI_CODES.bgWhite).toBe('\u001b[47m')
    expect(ANSI_CODES.bgDefault).toBe('\u001b[49m')
  })

  test('should have bright ANSI 16 foreground colors', () => {
    expect(ANSI_CODES.brightBlack).toBe('\u001b[90m')
    expect(ANSI_CODES.brightRed).toBe('\u001b[91m')
    expect(ANSI_CODES.brightGreen).toBe('\u001b[92m')
    expect(ANSI_CODES.brightYellow).toBe('\u001b[93m')
    expect(ANSI_CODES.brightBlue).toBe('\u001b[94m')
    expect(ANSI_CODES.brightMagenta).toBe('\u001b[95m')
    expect(ANSI_CODES.brightCyan).toBe('\u001b[96m')
    expect(ANSI_CODES.brightWhite).toBe('\u001b[97m')
  })

  test('should have bright ANSI 16 background colors', () => {
    expect(ANSI_CODES.bgBrightBlack).toBe('\u001b[100m')
    expect(ANSI_CODES.bgBrightRed).toBe('\u001b[101m')
    expect(ANSI_CODES.bgBrightGreen).toBe('\u001b[102m')
    expect(ANSI_CODES.bgBrightYellow).toBe('\u001b[103m')
    expect(ANSI_CODES.bgBrightBlue).toBe('\u001b[104m')
    expect(ANSI_CODES.bgBrightMagenta).toBe('\u001b[105m')
    expect(ANSI_CODES.bgBrightCyan).toBe('\u001b[106m')
    expect(ANSI_CODES.bgBrightWhite).toBe('\u001b[107m')
  })
})

describe('getCode', () => {
  test('should return correct ANSI sequence for valid code', () => {
    expect(getCode('bold')).toBe('\u001b[1m')
    expect(getCode('red')).toBe('\u001b[31m')
    expect(getCode('bgGreen')).toBe('\u001b[42m')
  })

  test('should work with all code names', () => {
    const codes: ANSICode[] = ['reset', 'bold', 'italic', 'underline', 'red', 'bgBlue']
    codes.forEach(code => {
      expect(getCode(code)).toBe(ANSI_CODES[code])
    })
  })
})

describe('isValidCode', () => {
  test('should return true for valid codes', () => {
    expect(isValidCode('bold')).toBe(true)
    expect(isValidCode('red')).toBe(true)
    expect(isValidCode('bgGreen')).toBe(true)
    expect(isValidCode('reset')).toBe(true)
  })

  test('should return false for invalid codes', () => {
    expect(isValidCode('notacode')).toBe(false)
    expect(isValidCode('orange')).toBe(false)
    expect(isValidCode('')).toBe(false)
  })
})

describe('fg256', () => {
  test('should generate ANSI 256-color foreground sequence', () => {
    expect(fg256(0)).toBe('\u001b[38;5;0m')
    expect(fg256(15)).toBe('\u001b[38;5;15m')
    expect(fg256(128)).toBe('\u001b[38;5;128m')
    expect(fg256(255)).toBe('\u001b[38;5;255m')
  })

  test('should throw for out-of-range values', () => {
    expect(() => fg256(-1)).toThrow(RangeError)
    expect(() => fg256(256)).toThrow(RangeError)
    expect(() => fg256(1000)).toThrow(RangeError)
  })
})

describe('bg256', () => {
  test('should generate ANSI 256-color background sequence', () => {
    expect(bg256(0)).toBe('\u001b[48;5;0m')
    expect(bg256(15)).toBe('\u001b[48;5;15m')
    expect(bg256(128)).toBe('\u001b[48;5;128m')
    expect(bg256(255)).toBe('\u001b[48;5;255m')
  })

  test('should throw for out-of-range values', () => {
    expect(() => bg256(-1)).toThrow(RangeError)
    expect(() => bg256(256)).toThrow(RangeError)
    expect(() => bg256(1000)).toThrow(RangeError)
  })
})

describe('fgRgb', () => {
  test('should generate ANSI TrueColor foreground sequence', () => {
    expect(fgRgb(0, 0, 0)).toBe('\u001b[38;2;0;0;0m')
    expect(fgRgb(255, 255, 255)).toBe('\u001b[38;2;255;255;255m')
    expect(fgRgb(128, 64, 192)).toBe('\u001b[38;2;128;64;192m')
  })

  test('should throw for out-of-range values', () => {
    expect(() => fgRgb(-1, 0, 0)).toThrow(RangeError)
    expect(() => fgRgb(0, -1, 0)).toThrow(RangeError)
    expect(() => fgRgb(0, 0, -1)).toThrow(RangeError)
    expect(() => fgRgb(256, 0, 0)).toThrow(RangeError)
    expect(() => fgRgb(0, 256, 0)).toThrow(RangeError)
    expect(() => fgRgb(0, 0, 256)).toThrow(RangeError)
  })
})

describe('bgRgb', () => {
  test('should generate ANSI TrueColor background sequence', () => {
    expect(bgRgb(0, 0, 0)).toBe('\u001b[48;2;0;0;0m')
    expect(bgRgb(255, 255, 255)).toBe('\u001b[48;2;255;255;255m')
    expect(bgRgb(128, 64, 192)).toBe('\u001b[48;2;128;64;192m')
  })

  test('should throw for out-of-range values', () => {
    expect(() => bgRgb(-1, 0, 0)).toThrow(RangeError)
    expect(() => bgRgb(0, -1, 0)).toThrow(RangeError)
    expect(() => bgRgb(0, 0, -1)).toThrow(RangeError)
    expect(() => bgRgb(256, 0, 0)).toThrow(RangeError)
    expect(() => bgRgb(0, 256, 0)).toThrow(RangeError)
    expect(() => bgRgb(0, 0, 256)).toThrow(RangeError)
  })
})

describe('colorize', () => {
  test('should wrap text with ANSI code and reset', () => {
    const result = colorize('Hello', 'bold')
    expect(result).toBe('\u001b[1mHello\u001b[0m')
  })

  test('should work with color codes', () => {
    const result = colorize('Error', 'red')
    expect(result).toBe('\u001b[31mError\u001b[0m')
  })

  test('should allow custom reset code', () => {
    const result = colorize('Bold', 'bold', 'boldOff')
    expect(result).toBe('\u001b[1mBold\u001b[22m')
  })

  test('should work with background colors', () => {
    const result = colorize('Highlighted', 'bgYellow')
    expect(result).toBe('\u001b[43mHighlighted\u001b[0m')
  })

  test('should handle empty string', () => {
    const result = colorize('', 'bold')
    expect(result).toBe('\u001b[1m\u001b[0m')
  })
})
