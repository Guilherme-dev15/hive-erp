import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RelatoriosPage } from './RelatoriosPage';
import * as apiService from '../services/apiService';
import React from 'react';

// Mock Services
vi.mock('../services/apiService', () => ({
  getABCReport: vi.fn(),
}));

// Mock lucide-react to avoid invalid React child errors during render in JSDOM
vi.mock('lucide-react', () => ({
  Loader2: () => <span className="animate-spin" data-testid="icon-loader" />,
  Download: () => <span data-testid="icon-download" />,
  Package: () => <span data-testid="icon-package" />,
  AlertTriangle: () => <span data-testid="icon-alert" />,
  TrendingUp: () => <span data-testid="icon-trending" />,
  DollarSign: () => <span data-testid="icon-dollar" />,
}));

// Mock react-hot-toast (Toaster) because it might pull in another React version inside its useStore logic leading to useState null errors
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
  Toaster: () => <div data-testid="toaster-mock" />
}));

describe('RelatoriosPage (Curva ABC)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve exibir spinner de carregamento inicialmente', () => {
    (apiService.getABCReport as any).mockImplementation(() => new Promise(() => {})); // never resolves
    const { container } = render(<RelatoriosPage />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('deve exibir os resumos e a curva ABC corretamente', async () => {
    const mockReport = {
      curvaABC: [
        { id: '1', name: 'Aliança', quantity: 10, salePrice: 100, valorEstoque: 1000, classificacao: 'A' },
        { id: '2', name: 'Anel', quantity: 0, salePrice: 50, valorEstoque: 0, classificacao: 'C' }
      ],
      resumoEstoque: {
        totalItens: 10,
        valorTotal: 1000,
        produtosZerados: 1
      }
    };

    (apiService.getABCReport as any).mockResolvedValue(mockReport);

    render(<RelatoriosPage />);

    // Espera os dados carregarem
    await waitFor(() => {
      expect(screen.getByText('Relatórios & Estoque')).toBeInTheDocument();
    });

    // Asserções no Resumo
    expect(screen.getByText('10')).toBeInTheDocument(); // totalItens
    expect(screen.getByText('1')).toBeInTheDocument(); // produtosZerados
    
    // Multiple 1000 elements exist in the UI now (the Summary and the table row for Aliança)
    // so we use getAllByText and ensure there's at least one instance.
    expect(screen.getAllByText(/1\.000/i).length).toBeGreaterThan(0); 

    // Asserções na Tabela (Curva ABC)
    expect(screen.getByText('Aliança')).toBeInTheDocument();
    expect(screen.getByText('Classe A')).toBeInTheDocument();
    expect(screen.getByText('Anel')).toBeInTheDocument();
    expect(screen.getByText('Classe C')).toBeInTheDocument();
  });
});
