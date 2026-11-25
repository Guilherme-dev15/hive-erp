import { describe, expect, it } from 'vitest';
import { hexToRgb, getContrastColor, applyThemeVariables } from './themeUtils';

describe('themeUtils', () => {
  it('converte hex de 3 e 6 dígitos para RGB corretamente', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#D4AF37')).toEqual({ r: 212, g: 175, b: 55 });
    expect(hexToRgb('invalid')).toBeNull();
  });

  it('calcula a cor de contraste baseada em luminância', () => {
    // Cores claras devem ter texto escuro
    expect(getContrastColor('#ffffff')).toBe('#18181b');
    expect(getContrastColor('#ffff00')).toBe('#18181b');

    // Cores escuras devem ter texto branco
    expect(getContrastColor('#000000')).toBe('#ffffff');
    expect(getContrastColor('#343434')).toBe('#ffffff');
    expect(getContrastColor('#1E3A8A')).toBe('#ffffff');
  });

  it('aplica as variáveis de CSS no document.documentElement', () => {
    applyThemeVariables('#2563EB', '#1E293B');

    expect(document.documentElement.style.getPropertyValue('--brand-primary')).toBe('#2563EB');
    expect(document.documentElement.style.getPropertyValue('--brand-secondary')).toBe('#1E293B');
    expect(document.documentElement.style.getPropertyValue('--brand-primary-contrast')).toBe('#ffffff');
  });

  it('usa fallbacks caso cores inválidas sejam passadas', () => {
    applyThemeVariables('cor-invalida', undefined);

    expect(document.documentElement.style.getPropertyValue('--brand-primary')).toBe('#D4AF37');
    expect(document.documentElement.style.getPropertyValue('--brand-secondary')).toBe('#343434');
  });
});
