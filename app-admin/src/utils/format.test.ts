import { describe, it, expect } from 'vitest';
import { formatCurrency } from './format';

describe('formatCurrency', () => {
  it('deve formatar números corretamente para BRL', () => {
    // Intl.NumberFormat usa espaço sem quebra (NBSP - \u00A0) após a moeda
    expect(formatCurrency(1234.56)).toBe('R$\u00A01.234,56');
    expect(formatCurrency(0)).toBe('R$\u00A00,00');
  });

  it('deve formatar strings numéricas corretamente para BRL', () => {
    expect(formatCurrency('1234.56')).toBe('R$\u00A01.234,56');
    expect(formatCurrency('0')).toBe('R$\u00A00,00');
  });

  it('deve retornar "R$ 0,00" (com espaço normal) para inputs inválidos (NaN)', () => {
    expect(formatCurrency('not a number')).toBe('R$ 0,00');
  });
});
