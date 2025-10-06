/**
 * Border System - Box drawing characters and utilities
 *
 * Provides various border styles and utilities for drawing boxes
 * and frames in the terminal.
 */
export * as borders from "./presets"
export * as Borders from "./presets"
export { border, borderPresets } from './presets'

export * as borderUtils from "./utils"
export {
  borderStyle,
  getBorderFromStyle,
  hasSide,
  combineSides,
  removeSide,
  fromPattern,
  renderBox,
  type BoxOptions,
} from './utils'

export type { Border, BorderStyle } from '../types'
export { BorderSide } from '../types'
