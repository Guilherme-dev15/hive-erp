import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { NovoPedidoModal } from './NovoPedidoModal';
import * as apiService from '../services/apiService';

vi.mock('../services/apiService', () => ({
  getCustomers: vi.fn(),
  getAdminProdutos: vi.fn(),
  apiClient: {
    post: vi.fn(),
  },
}));

describe('NovoPedidoModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve carregar clientes e produtos sem crash mesmo quando getCustomers retorna formato { data: [...] }', async () => {
    // Simula resposta da API onde customers vem encapsulado em data: [...]
    (apiService.getCustomers as any).mockResolvedValue({
      data: [
        { id: 'c1', name: 'Maria Silva', phone: '11999998888', email: 'maria@test.com' },
        { id: 'c2', name: 'João Souza', phone: '11988887777', email: 'joao@test.com' },
      ],
      total: 2,
    });

    (apiService.getAdminProdutos as any).mockResolvedValue([
      { id: 'p1', name: 'Anel Prata 925', salePrice: 120, quantity: 15, status: 'ativo' },
      { id: 'p2', name: 'Colar Corrente', salePrice: 250, quantity: 8, status: 'ativo' },
    ]);

    render(
      <NovoPedidoModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('Nova Venda Balcão (PDV)')).toBeInTheDocument();
    expect(screen.getByText('Orçamento / Proposta')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Maria Silva')).toBeInTheDocument();
      expect(screen.getByText('João Souza')).toBeInTheDocument();
    });

    expect(screen.getByText(/Anel Prata 925/i)).toBeInTheDocument();
    expect(screen.getByText(/Colar Corrente/i)).toBeInTheDocument();
  });

  it('deve lidar com retorno vazio ou nulo sem lançar N.map is not a function', async () => {
    (apiService.getCustomers as any).mockResolvedValue(null);
    (apiService.getAdminProdutos as any).mockResolvedValue(null);

    render(
      <NovoPedidoModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Nova Venda Balcão (PDV)')).toBeInTheDocument();
      expect(screen.getByText('Cliente avulso...')).toBeInTheDocument();
    });
  });
});
