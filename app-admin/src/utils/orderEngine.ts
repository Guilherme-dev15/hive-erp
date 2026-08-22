import { OrderStatus } from '../types';

/**
 * FSM (Finite State Machine) para transição de status de Pedidos.
 */

// Mapa de transições válidas
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  'Aguardando Pagamento': ['Em Produção', 'Em Separação', 'Cancelado'],
  'Em Produção': ['Em Separação', 'Cancelado'],
  'Em Separação': ['Enviado', 'Cancelado'],
  'Enviado': ['Concluído', 'Cancelado'],
  'Concluído': [], // Estado final feliz
  'Cancelado': [], // Estado final infeliz
};

/**
 * Verifica se a transição entre dois status é permitida.
 */
export const canTransitionOrder = (currentStatus: OrderStatus, nextStatus: OrderStatus): boolean => {
  if (currentStatus === nextStatus) return true; // Idempotência
  
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
};

/**
 * Processa a tentativa de transição e lança erro se for inválida.
 * Util para fluxos que precisam abortar.
 */
export const transitionOrder = (currentStatus: OrderStatus, nextStatus: OrderStatus): OrderStatus => {
  if (!canTransitionOrder(currentStatus, nextStatus)) {
    throw new Error(`Transição inválida: Não é possível mudar de '${currentStatus}' para '${nextStatus}'`);
  }
  return nextStatus;
};
