import * as colorUtils from "./utils"
import * as colorPresets from "./presets"

export const colors = colorPresets
export const Colors = colorPresets
export const color = { ...colorUtils, ...colorPresets }

export * from "./utils"
export * from "./types"
export { ColorProfile, detectColorProfile } from "./profile"
export { toAnsiSequence, hexToRgb, rgbToAnsi256, rgbToAnsi } from "./convert"
export { Color } from "./def"
