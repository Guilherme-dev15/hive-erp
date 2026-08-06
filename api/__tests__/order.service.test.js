// __tests__/order.service.test.js
// Testes unitários para a camada de domínio de pedidos.
// Foco: Validar a Finite State Machine (FSM) de transições de status.

import { describe, it, expect } from 'vitest';
import {
  canTransition,
  ORDER_STATES,
} from '../src/services/order.service';

describe('Order Service - FSM Transitions', () => {

  // ─── Transições Válidas ───────────────────────────────────────────────────
  describe('Valid transitions', () => {
    it('should allow pending -> paid', () => {
      expect(canTransition(ORDER_STATES.PENDING, ORDER_STATES.PAID)).toBe(true);
    });

    it('should allow pending -> cancelled', () => {
      expect(canTransition(ORDER_STATES.PENDING, ORDER_STATES.CANCELLED)).toBe(true);
    });

    it('should allow paid -> preparing', () => {
      expect(canTransition(ORDER_STATES.PAID, ORDER_STATES.PREPARING)).toBe(true);
    });

    it('should allow paid -> cancelled', () => {
      expect(canTransition(ORDER_STATES.PAID, ORDER_STATES.CANCELLED)).toBe(true);
    });

    it('should allow preparing -> shipped', () => {
      expect(canTransition(ORDER_STATES.PREPARING, ORDER_STATES.SHIPPED)).toBe(true);
    });

    it('should allow preparing -> cancelled', () => {
      expect(canTransition(ORDER_STATES.PREPARING, ORDER_STATES.CANCELLED)).toBe(true);
    });

    it('should allow shipped -> delivered', () => {
      expect(canTransition(ORDER_STATES.SHIPPED, ORDER_STATES.DELIVERED)).toBe(true);
    });
  });

  // ─── Transições Inválidas (Saltos / Retrocessos) ─────────────────────────
  describe('Invalid transitions (skipping or rewinding)', () => {
    it('should NOT allow pending -> preparing (skipped paid)', () => {
      expect(canTransition(ORDER_STATES.PENDING, ORDER_STATES.PREPARING)).toBe(false);
    });

    it('should NOT allow paid -> shipped (skipped preparing)', () => {
      expect(canTransition(ORDER_STATES.PAID, ORDER_STATES.SHIPPED)).toBe(false);
    });

    it('should NOT allow delivered -> pending (rewind from final state)', () => {
      expect(canTransition(ORDER_STATES.DELIVERED, ORDER_STATES.PENDING)).toBe(false);
    });

    it('should NOT allow delivered -> shipped (rewind from final state)', () => {
      expect(canTransition(ORDER_STATES.DELIVERED, ORDER_STATES.SHIPPED)).toBe(false);
    });

    it('should NOT allow cancelled -> paid (rewind from final state)', () => {
      expect(canTransition(ORDER_STATES.CANCELLED, ORDER_STATES.PAID)).toBe(false);
    });
  });

  // ─── Estados Finais (não permitem transição) ──────────────────────────────
  describe('Final states (cannot transition)', () => {
    it('should NOT allow any transition from DELIVERED', () => {
      // Tentar ir para qualquer outro estado (válido ou não) deve falhar.
      Object.values(ORDER_STATES).forEach((targetState) => {
        expect(canTransition(ORDER_STATES.DELIVERED, targetState)).toBe(false);
      });
    });

    it('should NOT allow any transition from CANCELLED', () => {
      Object.values(ORDER_STATES).forEach((targetState) => {
        expect(canTransition(ORDER_STATES.CANCELLED, targetState)).toBe(false);
      });
    });
  });

  // ─── Edge Cases (valores nulos ou desconhecidos) ──────────────────────────
  describe('Edge cases', () => {
    it('should return false when "from" is null', () => {
      expect(canTransition(null, ORDER_STATES.PAID)).toBe(false);
    });

    it('should return false when "to" is null', () => {
      expect(canTransition(ORDER_STATES.PENDING, null)).toBe(false);
    });

    it('should return false when both "from" and "to" are null', () => {
      expect(canTransition(null, null)).toBe(false);
    });

    it('should return false for an unknown "from" state', () => {
      expect(canTransition('unknown_state', ORDER_STATES.PAID)).toBe(false);
    });

    it('should return false when transitioning to the same state (self-loop)', () => {
      // A regra atual não permite auto-transições explícitas.
      expect(canTransition(ORDER_STATES.PENDING, ORDER_STATES.PENDING)).toBe(false);
    });
  });
});
