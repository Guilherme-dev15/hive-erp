import { OrderStatus, TransactionType } from '@prisma/client';

export function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field} is required.`);
  }
  return value.trim();
}

export function finiteNumber(value: unknown, field: string, fallback = 0): number {
  if (value === undefined || value === null || value === '') return fallback;
  const result = Number(value);
  if (!Number.isFinite(result)) throw new Error(`${field} must be a finite number.`);
  return result;
}

export function dateValue(value: unknown, field: string): Date | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const candidate = value instanceof Date ? value : new Date(value as string | number);
  if (Number.isNaN(candidate.getTime())) throw new Error(`${field} must be a valid date.`);
  return candidate;
}

export function orderStatus(value: unknown): OrderStatus {
  if (typeof value !== 'string' || !Object.values(OrderStatus).includes(value as OrderStatus)) {
    throw new Error('status must be a valid order status.');
  }
  return value as OrderStatus;
}

export function transactionType(value: unknown): TransactionType {
  if (typeof value !== 'string' || !Object.values(TransactionType).includes(value as TransactionType)) {
    throw new Error('type must be a valid transaction type.');
  }
  return value as TransactionType;
}
