import { z } from "zod/v4";
import {
  ColorDefAnsiSchema,
  ColorDefHexSchema,
  ColorDefRGBSchema,
  ColorDefNoneSchema,
  ColorDefAdaptiveSchema,
  ColorDefSchema,
  ColorDefRawSchema
} from "./schemas";

export type ColorDefAnsi = z.infer<typeof ColorDefAnsiSchema>;
export type ColorDefHex = z.infer<typeof ColorDefHexSchema>;
export type ColorDefRGB = z.infer<typeof ColorDefRGBSchema>;
export type ColorDefNone = z.infer<typeof ColorDefNoneSchema>;
export type ColorDef = z.infer<typeof ColorDefSchema>;
export type ColorRaw = z.infer<typeof ColorDefRawSchema>;
export type ColorDefAdaptive = z.infer<typeof ColorDefAdaptiveSchema>;
export type Color = ColorDefAnsi | ColorDefHex | ColorDefRGB | ColorDefNone | ColorDefAdaptive;
