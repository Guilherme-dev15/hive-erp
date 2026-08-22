import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DashboardPage } from './DashboardPage';
import * as apiService from '../services/apiService';
import React from 'react';

// Mock Services
vi.mock('../services/apiService', () => ({
  getDashboardStats: vi.fn(),
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
    (apiService.getDashboardStats as any).mockImplementation(() => new Promise(() => {})); // never resolves
    
    render(<DashboardPage />);
    expect(screen.getByText('SINCRONIZANDO...')).toBeInTheDocument();
  });

  it('deve processar e exibir os KPIs calculados corretamente na interface', async () => {
    const mockData = {
      stats: {
        totalVendas: 15000.50,
        totalDespesas: 5000.00,
        lucroLiquido: 10000.50,
        saldoTotal: 20000.00,
        activeProducts: 42
      },
      charts: {
        salesByDay: [],
        incomeVsExpense: []
      }
    };

    (apiService.getDashboardStats as any).mockResolvedValue(mockData);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByText('SINCRONIZANDO...')).not.toBeInTheDocument();
    });

    // We can't rely strictly on exact string matching for browser-dependent toLocaleString
    // so we search for the numeric substrings
    expect(screen.getByText(/15\.000/i)).toBeInTheDocument();
    
    // Teste usando a busca completa do conteúdo textual dentro do Node, lidando com o espaço non-breaking do Intl API
    expect(screen.getAllByText(/5\.000,00/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/10\.000/i)).toBeInTheDocument();
    expect(screen.getByText(/20\.000/i)).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument(); // Active products count
  });
});
