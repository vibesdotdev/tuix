import { describe, it, expect } from 'bun:test';
import { Color } from './def';

describe('Color class', () => {
  it('should have applyGlow method', () => {
    const color = Color.hex('#ff0000');
    const result = color.applyGlow(['Hello World']);
    expect(result).toEqual(['Hello World']);
  });

  it('should have applyDropShadow method', () => {
    const color = Color.hex('#ff0000');
    const result = color.applyDropShadow(['Hello World']);
    expect(result).toEqual(['Hello World']);
  });

  it('should have applyInnerShadow method', () => {
    const color = Color.hex('#ff0000');
    const result = color.applyInnerShadow(['Hello World']);
    expect(result).toEqual(['Hello World']);
  });
});