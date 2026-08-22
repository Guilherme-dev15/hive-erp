import { describe, it, expect } from 'vitest';
import { calculateNewStock } from './stockEngine';

describe('Engine de Estoque - Regras de Negócio', () => {
  it('deve adicionar estoque corretamente numa entrada', () => {
    expect(calculateNewStock(10, 5, 'entry')).toBe(15);
  });

  it('deve remover estoque corretamente numa saída', () => {
    expect(calculateNewStock(10, 3, 'exit')).toBe(7);
  });

  it('deve tratar perdas da mesma forma que saídas', () => {
    expect(calculateNewStock(10, 2, 'loss')).toBe(8);
  });

  it('nunca deve permitir estoque negativo', () => {
    expect(calculateNewStock(5, 10, 'exit')).toBe(0);
    expect(calculateNewStock(5, 10, 'loss')).toBe(0);
  });

  it('deve ignorar ajustes menores ou iguais a zero', () => {
    expect(calculateNewStock(10, 0, 'entry')).toBe(10);
    expect(calculateNewStock(10, -5, 'exit')).toBe(10);
  });
});