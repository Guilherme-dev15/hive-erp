import { ProdutoAdmin, StockAdjustment } from '../types';

/**
 * Pure function to calculate new stock without mutations.
 */
export const calculateNewStock = (currentStock: number, change: number, type: 'entry' | 'exit' | 'loss'): number => {
  if (change <= 0) return currentStock;

  switch (type) {
    case 'entry':
      return currentStock + change;
    case 'exit':
    case 'loss':
      return Math.max(0, currentStock - change);
    default:
      return currentStock;
  }
};