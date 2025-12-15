// src/utils/format.ts
export const formatCurrency = (value: number | string) => {
  const amount = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(amount)) return 'R$ 0,00';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};