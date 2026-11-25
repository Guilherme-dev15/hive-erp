import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClientesPage } from './ClientesPage';
import * as apiService from '../services/apiService';

vi.mock('../services/apiService', () => ({
  getCustomers: vi.fn(),
  getCustomer: vi.fn(),
}));

vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      primaryColor: '#D4AF37',
      secondaryColor: '#343434',
      storeName: 'Hive Pratas',
      slug: 'hive',
    },
    setTheme: vi.fn(),
    refreshTheme: vi.fn(),
    loadingTheme: false,
  }),
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('ClientesPage', () => {
  const mockCustomersResponse = {
    total: 2,
    totalRevenue: 1500.0,
    averageTicketGlobal: 375.0,
    data: [
      {
        id: '11988887777',
        name: 'Maria Silva',
        phone: '(11) 98888-7777',
        cleanPhone: '11988887777',
        totalOrders: 3,
        totalSpent: 1000.0,
        averageTicket: 333.33,
        firstOrderDate: '2026-10-01T10:00:00Z',
        lastOrderDate: '2026-11-04T12:00:00Z',
        lastOrderStatus: 'CONCLUIDO',
        orders: [
          {
            id: 'ord-1',
            total: 500.0,
            status: 'CONCLUIDO',
            createdAt: '2026-11-04T12:00:00Z',
            itemsCount: 2,
          },
          {
            id: 'ord-2',
            total: 300.0,
            status: 'CONCLUIDO',
            createdAt: '2026-10-15T15:00:00Z',
            itemsCount: 1,
          },
          {
            id: 'ord-3',
            total: 200.0,
            status: 'CONCLUIDO',
            createdAt: '2026-10-01T10:00:00Z',
            itemsCount: 1,
          },
        ],
      },
      {
        id: '21977776666',
        name: 'João Santos',
        phone: '21977776666',
        cleanPhone: '21977776666',
        totalOrders: 1,
        totalSpent: 500.0,
        averageTicket: 500.0,
        firstOrderDate: '2026-11-02T10:00:00Z',
        lastOrderDate: '2026-11-02T10:00:00Z',
        lastOrderStatus: 'AGUARDANDO_PAGAMENTO',
        orders: [
          {
            id: 'ord-4',
            total: 500.0,
            status: 'AGUARDANDO_PAGAMENTO',
            createdAt: '2026-11-02T10:00:00Z',
            itemsCount: 3,
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carrega e renderiza métricas e lista de clientes corretamente', async () => {
    vi.mocked(apiService.getCustomers).mockResolvedValue(mockCustomersResponse);

    render(<ClientesPage />);

    expect(screen.getByText('Carregando carteira de clientes...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Maria Silva')).toBeInTheDocument();
      expect(screen.getByText('João Santos')).toBeInTheDocument();
    });

    // Total de clientes
    expect(screen.getByText('2')).toBeInTheDocument();
    // Clientes recorrentes (Maria tem 3 pedidos)
    expect(screen.getByText('Recorrente')).toBeInTheDocument();
    expect(screen.getByText('Novo')).toBeInTheDocument();
  });

  it('permite abrir o modal de detalhes e visualizar o histórico de pedidos', async () => {
    vi.mocked(apiService.getCustomers).mockResolvedValue(mockCustomersResponse);

    render(<ClientesPage />);

    await waitFor(() => {
      expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    });

    const verPedidosButtons = screen.getAllByText('Ver Pedidos');
    fireEvent.click(verPedidosButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Histórico de Pedidos')).toBeInTheDocument();
      expect(screen.getByText(/3 pedidos realizados/i)).toBeInTheDocument();
    });
  });

  it('permite disparar o WhatsApp com número formatado', async () => {
    vi.mocked(apiService.getCustomers).mockResolvedValue(mockCustomersResponse);
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<ClientesPage />);

    await waitFor(() => {
      expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    });

    const whatsAppButtons = screen.getAllByRole('button', { name: /WhatsApp/i });
    fireEvent.click(whatsAppButtons[0]);

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/5511988887777'),
      '_blank'
    );

    openSpy.mockRestore();
  });

  it('exibe estado vazio quando não há clientes cadastrados', async () => {
    vi.mocked(apiService.getCustomers).mockResolvedValue({
      total: 0,
      totalRevenue: 0,
      averageTicketGlobal: 0,
      data: [],
    });

    render(<ClientesPage />);

    await waitFor(() => {
      expect(screen.getByText('Nenhum cliente registrado ainda')).toBeInTheDocument();
    });
  });
});
