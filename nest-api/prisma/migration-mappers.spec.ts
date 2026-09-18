import { dateValue, finiteNumber, orderStatus, requiredText, transactionType } from './migration-mappers';

describe('migration mappers', () => {
  it('requires non-empty text', () => {
    expect(() => requiredText(' ', 'name')).toThrow('name is required');
    expect(requiredText(' Product ', 'name')).toBe('Product');
  });

  it('rejects non-finite numbers instead of converting them to zero', () => {
    expect(() => finiteNumber('not-a-number', 'salePrice')).toThrow('finite number');
    expect(finiteNumber(undefined, 'salePrice')).toBe(0);
  });

  it('rejects invalid dates', () => {
    expect(() => dateValue('invalid', 'createdAt')).toThrow('valid date');
    expect(dateValue(undefined, 'createdAt')).toBeUndefined();
  });

  it('accepts only persisted enum values', () => {
    expect(orderStatus('PAGO')).toBe('PAGO');
    expect(transactionType('VENDA')).toBe('VENDA');
    expect(() => orderStatus('paid')).toThrow('valid order status');
    expect(() => transactionType('sale')).toThrow('valid transaction type');
  });
});
