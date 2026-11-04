import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FinanceiroPage } from './FinanceiroPage';
import * as apiService from '../services/apiService';

vi.mock('../services/apiService', () => ({
  getTransacoes: vi.fn(),
  createTransacao: vi.fn(),
  deleteTransacao: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
  Toaster: () => null,
}));

// Mock recharts ResponsiveContainer
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div data-testid="recharts-container">{children}</div>,
  };
});

describe('FinanceiroPage', () => {
  const mockTransactions = [
    {
      id: 'tx-1',
      description: 'Venda de Anel',
      amount: 250,
      type: 'venda' as const,
      category: 'Vendas',
      date: '2026-11-01T10:00:00.000Z',
    },
    {
      id: 'tx-2',
      description: 'Embalagens e caixas',
      amount: 50,
      type: 'despesa' as const,
      category: 'Embalagem',
      date: '2026-11-02T15:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carrega e renderiza transações e cartões de saldo corretamente', async () => {
    vi.mocked(apiService.getTransacoes).mockResolvedValue(mockTransactions);

    render(<FinanceiroPage />);

    await waitFor(() => {
      expect(screen.getByText('Venda de Anel')).toBeInTheDocument();
      expect(screen.getByText('Embalagens e caixas')).toBeInTheDocument();
    });

    // Entradas: 250, Saídas: 50, Saldo: 200
    expect(screen.getByText('Total Receitas')).toBeInTheDocument();
    expect(screen.getByText('Total Despesas')).toBeInTheDocument();
    expect(screen.getByText('Saldo Atual')).toBeInTheDocument();
  });

  it('permite criar novo lançamento financeiro', async () => {
    vi.mocked(apiService.getTransacoes).mockResolvedValue([]);
    vi.mocked(apiService.createTransacao).mockResolvedValue({
      id: 'tx-new',
      description: 'Conta de Luz',
      amount: 100,
      type: 'despesa',
      category: 'Contas',
      date: '2026-11-03T12:00:00.000Z',
    });

    render(<FinanceiroPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Ex: Conta de Luz/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/Ex: Conta de Luz/i), {
      target: { value: 'Conta de Luz' },
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '100' },
    });

    const btnSubmit = screen.getByText('Confirmar Lançamento');
    fireEvent.click(btnSubmit);

    await waitFor(() => {
      expect(apiService.createTransacao).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Conta de Luz',
          amount: 100,
          type: 'despesa',
        })
      );
    });
  });

  it('permite excluir uma transação após confirmação', async () => {
    vi.mocked(apiService.getTransacoes).mockResolvedValue(mockTransactions);
    vi.mocked(apiService.deleteTransacao).mockResolvedValue();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<FinanceiroPage />);

    await waitFor(() => {
      expect(screen.getByText('Venda de Anel')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Excluir lançamento');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(apiService.deleteTransacao).toHaveBeenCalledWith('tx-1');
    });

    confirmSpy.mockRestore();
  });
});
