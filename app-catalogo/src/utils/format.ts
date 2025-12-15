export const formatCurrency = (value?: number) => {
  const amount = value ?? 0;
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};