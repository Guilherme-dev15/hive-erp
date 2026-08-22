import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DashboardPage } from './DashboardPage';
import * as apiService from '../services/apiService';
import React from 'react';

// Mock Services
vi.mock('../services/apiService', () => ({
  getAdminProdutos: vi.fn(),
  getAdminOrders: vi.fn(),
}));

// Mock framer-motion to avoid JSDOM errors
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock lucide-react to avoid invalid React child errors during render in JSDOM
vi.mock('lucide-react', () => ({
  DollarSign: () => <span data-testid="icon-dollar" />,
  TrendingUp: () => <span data-testid="icon-trending" />,
  Download: () => <span data-testid="icon-download" />,
  Package: () => <span data-testid="icon-package" />,
  AlertCircle: () => <span data-testid="icon-alert" />,
}));

// Mock recharts because it uses ResizeObserver which doesn't exist in JSDOM
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="recharts-responsive-container">{children}</div>,
  AreaChart: () => <div data-testid="recharts-area-chart" />,
  PieChart: () => <div data-testid="recharts-pie-chart" />,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Pie: () => null,
  Cell: () => null,
}));

describe('DashboardPage (KPIs)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve exibir o estado de loading inicialmente', () => {
    (apiService.getAdminProdutos as any).mockImplementation(() => new Promise(() => {})); // never resolves
    (apiService.getAdminOrders as any).mockImplementation(() => new Promise(() => {}));
    
    render(<DashboardPage />);
    expect(screen.getByText('SINCRONIZANDO...')).toBeInTheDocument();
  });

  it('deve processar e exibir os KPIs calculados corretamente na interface', async () => {
    const mockProducts = [
      { id: '1', name: 'Aliança', quantity: 10, salePrice: 100, status: 'ativo' }, // R$ 1000
      { id: '2', name: 'Anel', quantity: 2, salePrice: 50, status: 'ativo' }, // R$ 100 (Estoque baixo)
    ];

    const now = new Date();
    const mockOrders = [
      { id: 'o1', total: 5000, status: 'Concluído', createdAt: now.toISOString() }, // Lucro: 3500
      { id: 'o2', total: 1000, status: 'Aguardando Pagamento', createdAt: now.toISOString() }, // Ignorado
    ];

    (apiService.getAdminProdutos as any).mockResolvedValue(mockProducts);
    (apiService.getAdminOrders as any).mockResolvedValue(mockOrders);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByText('SINCRONIZANDO...')).not.toBeInTheDocument();
    });

    // We can't rely strictly on exact string matching for browser-dependent toLocaleString
    // so we search for the numeric substrings
    expect(screen.getByText(/5\.000/i)).toBeInTheDocument();
    expect(screen.getByText(/3\.500/i)).toBeInTheDocument();
    expect(screen.getByText(/1\.100/i)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Active products count
  });
});
