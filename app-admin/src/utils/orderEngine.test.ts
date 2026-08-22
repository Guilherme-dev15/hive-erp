import { describe, it, expect } from 'vitest';
import { canTransitionOrder, transitionOrder } from './orderEngine';
import { OrderStatus } from '../types';

describe('Engine de Pedidos - Máquina de Estados (FSM)', () => {
  describe('Caminho Feliz', () => {
    it('deve permitir avançar de Aguardando Pagamento para Produção ou Separação', () => {
      expect(canTransitionOrder('Aguardando Pagamento', 'Em Produção')).toBe(true);
      expect(canTransitionOrder('Aguardando Pagamento', 'Em Separação')).toBe(true);
    });

    it('deve permitir fluxo logístico normal (Produção -> Separação -> Enviado -> Concluído)', () => {
      expect(canTransitionOrder('Em Produção', 'Em Separação')).toBe(true);
      expect(canTransitionOrder('Em Separação', 'Enviado')).toBe(true);
      expect(canTransitionOrder('Enviado', 'Concluído')).toBe(true);
    });
  });

  describe('Caminho Infeliz / Cancelamento', () => {
    it('deve permitir cancelar um pedido que ainda não foi concluído', () => {
      expect(canTransitionOrder('Aguardando Pagamento', 'Cancelado')).toBe(true);
      expect(canTransitionOrder('Em Produção', 'Cancelado')).toBe(true);
      expect(canTransitionOrder('Em Separação', 'Cancelado')).toBe(true);
      expect(canTransitionOrder('Enviado', 'Cancelado')).toBe(true);
    });

    it('NÃO deve permitir mudar de status após Cancelado (Estado Final)', () => {
      expect(canTransitionOrder('Cancelado', 'Aguardando Pagamento')).toBe(false);
      expect(canTransitionOrder('Cancelado', 'Em Separação')).toBe(false);
    });

    it('NÃO deve permitir mudar de status após Concluído (Estado Final)', () => {
      expect(canTransitionOrder('Concluído', 'Em Separação')).toBe(false);
      expect(canTransitionOrder('Concluído', 'Cancelado')).toBe(false);
    });
  });

  describe('Lógica de Proteção de Regressão', () => {
    it('NÃO deve permitir que um pedido Enviado volte para Produção', () => {
      expect(canTransitionOrder('Enviado', 'Em Produção')).toBe(false);
    });

    it('NÃO deve permitir que um pedido em Separação volte para Aguardando Pagamento', () => {
      expect(canTransitionOrder('Em Separação', 'Aguardando Pagamento')).toBe(false);
    });
  });

  describe('Função utilitária: transitionOrder', () => {
    it('deve retornar o novo status quando a transição for válida', () => {
      expect(transitionOrder('Aguardando Pagamento', 'Em Produção')).toBe('Em Produção');
    });

    it('deve lançar Error quando a transição for inválida', () => {
      expect(() => transitionOrder('Cancelado', 'Enviado')).toThrowError(
        "Transição inválida: Não é possível mudar de 'Cancelado' para 'Enviado'"
      );
    });

    it('deve ser idempotente caso tente atualizar pro mesmo estado que já está', () => {
      expect(transitionOrder('Em Separação', 'Em Separação')).toBe('Em Separação');
    });
  });
});
