import React from 'react';
import { render, screen, waitFor, fireEvent } from '../test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Order } from '../types';

// Resolve hoisting issue
vi.mock('../components/CertificadoImpressao', () => {
  return {
    CertificadoImpressao: React.forwardRef((_props: unknown, ref: unknown) => <div ref={ref as React.Ref<HTMLDivElement>} data-testid="mock-certificado">Certificado</div>)
  };
});

// Remove destructuring from vi.mock
vi.mock('framer-motion', () => {
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
      button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <button {...props}>{children}</button>,
      li: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <li {...props}>{children}</li>,
      span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <span {...props}>{children}</span>,
      p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <p {...props}>{children}</p>,
      h3: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <h3 {...props}>{children}</h3>,
      tr: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <tr {...props}>{children}</tr>,
      td: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <td {...props}>{children}</td>,
      tbody: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <tbody {...props}>{children}</tbody>,
    }
  };
});

vi.mock('react-hot-toast', () => {
  return {
    toast: Object.assign(vi.fn(), {
      loading: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
    }),
    Toaster: () => null
  };
});

vi.mock('react-to-print', () => ({
  useReactToPrint: () => vi.fn()
}));

vi.mock('../components/DetalhePedidoModal', () => ({
  DetalhePedidoModal: () => <div data-testid="mock-modal">Modal Pedido</div>
}));

vi.mock('../services/apiService', () => ({
  getAdminOrders: vi.fn(),
  updateAdminOrderStatus: vi.fn().mockResolvedValue({}),
  getConfig: vi.fn().mockResolvedValue({ defaultMarkup: 2.5 }),
  deleteAdminOrder: vi.fn(),
}));

import { PedidosPage } from './PedidosPage';
import { getAdminOrders, updateAdminOrderStatus } from '../services/apiService';

describe('PedidosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o titulo Gestão de Pedidos', async () => {
    vi.mocked(getAdminOrders).mockResolvedValueOnce([]);
    render(<PedidosPage />);
    await waitFor(() => {
      expect(screen.getByText('Gestão de Pedidos')).toBeInTheDocument();
    });
  });

  it('deve exibir os pedidos carregados do backend', async () => {
    vi.mocked(getAdminOrders).mockResolvedValueOnce([
      {
        id: '12345678',
        customerName: 'João Silva',
        customerPhone: '11999999999',
        total: 500,
        status: 'PENDENTE',
        items: [{ id: 'item-1', name: 'Anel', price: 500, quantity: 1, type: 'simple' }],
        paymentMethod: 'PIX',
        history: [],
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 }
      },
      {
        id: '98765432',
        customerName: 'Maria Souza',
        customerPhone: '11888888888',
        total: 250,
        status: 'PAGO',
        items: [{ id: 'item-2', name: 'Brinco', price: 250, quantity: 1, type: 'simple' }],
        paymentMethod: 'PIX',
        history: [],
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 }
      }
    ] as unknown as Order[]);

    // O fixture parcial representa apenas os campos consumidos por este teste.

    render(<PedidosPage />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando pedidos.../i)).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('Maria Souza')).toBeInTheDocument();
    });
  });
  
  it('deve filtrar pedidos pelo input de busca', async () => {
    vi.mocked(getAdminOrders).mockResolvedValueOnce([
      {
        id: '12345678',
        customerName: 'João Silva',
        total: 500,
        status: 'PENDENTE',
        items: [],
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 }
      },
      {
        id: '98765432',
        customerName: 'Maria Souza',
        total: 250,
        status: 'PENDENTE',
        items: [],
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 }
      }
    ] as unknown as Order[]);

    render(<PedidosPage />);

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar por ID, Nome/i);
    fireEvent.change(searchInput, { target: { value: 'João' } });

    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.queryByText('Maria Souza')).not.toBeInTheDocument();
  });

  it('deve engatilhar a mudanca de status ao alterar o select e chamar a API', async () => {
    vi.mocked(getAdminOrders).mockResolvedValueOnce([
      {
        id: 'pedido-mock',
        customerName: 'João Silva',
        total: 500,
        status: 'Aguardando Pagamento',
        items: [],
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 }
      }
    ] as unknown as Order[]);

    render(<PedidosPage />);

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    // Encontra o select de status baseado no valor inicial
    const selectStatus = screen.getByDisplayValue('Aguardando Pagamento');
    
    // Dispara a mudanca
    fireEvent.change(selectStatus, { target: { value: 'Em Produção' } });

    await waitFor(() => {
      expect(updateAdminOrderStatus).toHaveBeenCalledWith('pedido-mock', 'Em Produção');
    });
  });
});


  it('deve calcular corretamente o dashboard de estatisticas', async () => {
    vi.mocked(getAdminOrders).mockResolvedValueOnce([
      {
        id: '1',
        total: 500,
        status: 'Aguardando Pagamento',
        items: [],
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 }
      },
      {
        id: '2',
        total: 250,
        status: 'Concluído',
        items: [],
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 }
      },
      {
        id: '3',
        total: 1000,
        status: 'Cancelado',
        items: [],
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 }
      }
    ] as unknown as Order[]);

    render(<PedidosPage />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando pedidos.../i)).not.toBeInTheDocument();
    });

    await waitFor(() => {
      const elms = screen.getAllByText((content) => {
        return content.includes('750') && content.includes('R$');
      });
      expect(elms.length).toBeGreaterThan(0);
    });

    expect(screen.getByText('Em Aberto').parentElement?.textContent).toContain('1');
    expect(screen.getByText('Concluídos').parentElement?.textContent).toContain('1');
  });
