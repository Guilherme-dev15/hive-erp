import { describe, expect, it } from 'vitest';
import { hexToRgb, getContrastColor } from './theme';

describe('catalog theme utils', () => {
  it('converte hex corretamente', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#D4AF37')).toEqual({ r: 212, g: 175, b: 55 });
    expect(hexToRgb('')).toBeNull();
  });

  it('calcula contraste de texto ideal', () => {
    expect(getContrastColor('#ffffff')).toBe('#18181b');
    expect(getContrastColor('#ffff00')).toBe('#18181b');
    expect(getContrastColor('#000000')).toBe('#ffffff');
    expect(getContrastColor('#2563EB')).toBe('#ffffff');
  });
});
