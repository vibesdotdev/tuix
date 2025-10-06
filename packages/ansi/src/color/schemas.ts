import { z } from 'zod/v4';

export const ColorDefNoneSchema = z.object({
  type: z.literal("none"),
});

export const ColorDefAnsi15Schema = z.object({
  type: z.literal('ansi'),
  code: z.number().min(0).max(15),
}).refine((data) => {
  return data.code >= 0 && data.code <= 15;
}, { message: 'Invalid code for ANSI color' });

export const ColorDefAnsi256Schema = z.object({
  type: z.literal('ansi256'),
  code: z.number().min(0).max(255),
}).refine((data) => {
  return data.code >= 0 && data.code <= 255;
}, { message: 'Invalid code for ANSI256 color' });

export const ColorDefAnsiSchema = z.discriminatedUnion('type', [
  ColorDefAnsi15Schema,
  ColorDefAnsi256Schema,
]);

export const ColorDefHexSchema = z.object({
  type: z.literal('hex'),
  value: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const ColorDefRGBSchema = z.object({
  type: z.literal('rgb'),
  r: z.number().min(0).max(255),
  g: z.number().min(0).max(255),
  b: z.number().min(0).max(255),
});

export const ColorDefRawSchema = z.discriminatedUnion('type', [
  ColorDefNoneSchema,
  ColorDefAnsiSchema,
  ColorDefHexSchema,
  ColorDefRGBSchema,
]);

export const ColorDefAdaptiveSchema = z.object({
  type: z.literal('adaptive'),
  light: ColorDefRawSchema,
  dark: ColorDefRawSchema,
});

export const ColorDefSchema = z.discriminatedUnion('type', [
  ColorDefRawSchema,
  ColorDefAdaptiveSchema,
]);

export const ColorDefAutoAnsiSchema = z.object({
  code: z.number().min(0).max(255),
}).transform((data) => ({
  type: data.code > 15 ? 'ansi256' : 'ansi',
  code: data.code,
}));
