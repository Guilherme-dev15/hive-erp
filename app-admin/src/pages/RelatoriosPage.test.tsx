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
  PieChart: () => <span data-testid="icon-piechart" />,
  Tag: () => <span data-testid="icon-tag" />,
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
        { id: '1', name: 'Aliança', quantity: 10, salePrice: 100, costPrice: 50, valorEstoque: 1000, custoEstoque: 500, lucroProjetado: 500, classificacao: 'A' },
        { id: '2', name: 'Anel', quantity: 0, salePrice: 50, costPrice: 20, valorEstoque: 0, custoEstoque: 0, lucroProjetado: 0, classificacao: 'C' }
      ],
      resumoEstoque: {
        totalItens: 10,
        valorTotal: 1000,
        produtosZerados: 1
      },
      summary: {
        totalRevenue: 1000,
        totalCost: 500,
        projectedProfit: 500,
        averageTicket: 150
      }
    };

    (apiService.getABCReport as any).mockResolvedValue(mockReport);

    render(<RelatoriosPage />);

    // Espera os dados carregarem
    await waitFor(() => {
      expect(screen.getByText('Relatórios & Estoque')).toBeInTheDocument();
    });

    // Asserções no Resumo
    expect(screen.getAllByText('10').length).toBeGreaterThan(0); // totalItens
    // A string de alerta não existe mais se produtosZerados for pego de resumoEstoque na interface, pois a div condicional depende de metrics.produtosZerados.
    // E no mock foi retornado 1, logo deveria existir o texto com número "1". No entanto, screen.getByText('1') pode falhar se estiver dentro de uma string interpolada sem div separada.
    // Vamos checar pelo texto inteiro de produtos zerados:
    expect(screen.getByText(/Existem 1 produtos com estoque zerado no momento/i)).toBeInTheDocument();

    // As novas métricas financeiras de summary devem aparecer
    expect(screen.getByText(/Lucro Projetado/i)).toBeInTheDocument();
    expect(screen.getByText(/Ticket Médio/i)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*150,00/i)).toBeInTheDocument(); // average ticket formatted
    expect(screen.getAllByText(/R\$\s*500,00/i).length).toBeGreaterThan(0); // lucroProjetado e custoEstoque

    // Multiple 1000 elements exist in the UI now (the Summary and the table row for Aliança)
    // so we use getAllByText and ensure there's at least one instance.
    expect(screen.getAllByText(/R\$\s*1\.000,00/i).length).toBeGreaterThan(0);

    // Asserções na Tabela (Curva ABC)
    expect(screen.getByText('Aliança')).toBeInTheDocument();
    expect(screen.getByText('Classe A')).toBeInTheDocument();
    expect(screen.getByText('Anel')).toBeInTheDocument();
    expect(screen.getByText('Classe C')).toBeInTheDocument();
  });
});
