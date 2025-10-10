export {
  stripAnsi,
  hasAnsi,
  countAnsi,
  extractAnsi,
  splitAnsiSegments,
} from './strip'

export { visualWidth, truncate, pad } from './width'

export { escape, sequence, colorize, ANSI_CODES } from './escape'
export type { ANSICode } from './escape'

export { getCode, isValidCode, fg256, bg256, fgRgb, bgRgb } from './codes'
