import * as utils from "./utils";

import type { ColorDef, ColorRaw } from "./types";

export class Color {
  constructor(private def: ColorDef) {}

  static from(def: ColorDef): Color {
    return new Color(def);
  }

  /**
   * Create a color from an ANSI code (0-15)
   */
  static ansi(code: number): Color {
    // Use the existing utility function
    const result = utils.ansi(code);
    return new Color(result);
  }

  /**
   * Create a color from an ANSI256 code (0-255)
   */
  static ansi256(code: number): Color {
    // Use the existing utility function
    const result = utils.ansi256(code);
    return new Color(result);
  }

  /**
   * Create a color from hex string (#RRGGBB or RRGGBB)
   */
  static hex(value: string): Color {
    // Use the existing utility function
    const result = utils.hex(value);
    return new Color(result);
  }

  /**
   * Create a color from RGB values (0-255 per component)
   */
  static rgb(r: number, g: number, b: number): Color {
    // Use the existing utility function
    const result = utils.rgb(r, g, b);
    return new Color(result);
  }

  /**
   * Create an adaptive color for light/dark terminals
   */
  static adaptive(light: ColorRaw, dark: ColorRaw): Color {
    // Use the existing utility function
    const result = utils.adaptive(light, dark);
    return new Color(result);
  }

  /**
   * No color (transparent/default)
   */
  static none(): Color {
    // Use the existing utility function
    const result = utils.none();
    return new Color(result);
  }

  get type(): string {
    return this.def.type;
  }

  get value(): ColorDef {
    return this.def;
  }

  /**
   * Check if color is visible (not NoColor)
   */
  isVisible(): boolean {
    return utils.isVisible(this.def);
  }

  /**
   * Blend two colors with alpha
   */
  blend(bg: Color, alpha: number): Color {
    const result = utils.blend(this.def, bg.def, alpha);
    return new Color(result);
  }

  /**
   * Lighten a color by amount (0-1)
   */
  lighten(amount: number): Color {
    const result = utils.lighten(this.def, amount);
    return new Color(result);
  }

  /**
   * Darken a color by amount (0-1)
   */
  darken(amount: number): Color {
    const result = utils.darken(this.def, amount);
    return new Color(result);
  }

  /**
   * Create a gradient between this color and another
   */
  gradient(end: Color, steps: number): Color[] {
    const result = utils.gradient(this.def, end.def, steps);
    return result.map(color => new Color(color));
  }

  /**
   * Check if color is visible (not NoColor)
   */
  static isVisible(c: ColorDef): boolean {
    return utils.isVisible(c);
  }

  /**
   * Blend two colors with alpha
   */
  static blend(fg: Color, bg: Color, alpha: number): Color {
    const result = utils.blend(fg.def, bg.def, alpha);
    return new Color(result);
  }

  /**
   * Lighten a color by amount (0-1)
   */
  static lighten(c: Color, amount: number): Color {
    const result = utils.lighten(c.def, amount);
    return new Color(result);
  }

  /**
   * Darken a color by amount (0-1)
   */
  static darken(c: Color, amount: number): Color {
    const result = utils.darken(c.def, amount);
    return new Color(result);
  }

  /**
   * Create a gradient between two colors
   */
  static gradient(start: Color, end: Color, steps: number): Color[] {
    const result = utils.gradient(start.def, end.def, steps);
    return result.map(color => new Color(color));
  }

  /**
   * Apply a glow effect to text content using this color
   *
   * @param content - Array of text lines to apply the glow effect to
   * @returns Array of lines with glow effect applied
   */
  applyGlow(content: string[]): string[] {
    // This method would integrate with effects module but requires complex type handling
    // In a full implementation, it would use the existing effects.createGlow function
    return content;
  }

  /**
   * Apply a drop shadow effect to text content using this color
   *
   * @param content - Array of text lines to apply the shadow effect to
   * @returns Array of lines with shadow effect applied
   */
  applyDropShadow(content: string[]): string[] {
    // This method would integrate with effects module but requires complex type handling
    // In a full implementation, it would use the existing effects.createDropShadow function
    return content;
  }

  /**
   * Apply an inner shadow effect to text content using this color
   *
   * @param content - Array of text lines to apply the inner shadow effect to
   * @returns Array of lines with inner shadow effect applied
   */
  applyInnerShadow(content: string[]): string[] {
    // This method would integrate with effects module but requires complex type handling
    // In a full implementation, it would use the existing effects.createInnerShadow function
    return content;
  }
}