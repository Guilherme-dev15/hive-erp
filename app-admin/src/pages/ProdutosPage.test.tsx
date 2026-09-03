import React from 'react';
import { render, screen, waitFor, fireEvent } from '../test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProdutosPage } from './ProdutosPage';

// --- MOCKS ---
vi.mock('@react-pdf/renderer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@react-pdf/renderer')>();
  return {
    ...actual,
    PDFDownloadLink: ({ children }: { children: React.ReactNode | ((params: { loading: boolean }) => React.ReactNode) }) => (
      <div data-testid="pdf-mock">{typeof children === 'function' ? children({ loading: false }) : children}</div>
    ),
    Document: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Page: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Text: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    View: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Image: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    StyleSheet: { create: (s: unknown) => s },
  };
});

vi.mock('react-to-print', () => ({
  useReactToPrint: () => vi.fn()
}));

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...(actual as object),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    motion: {
      div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
        return <div {...props}>{children}</div>;
      },
      button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
        return <button {...props}>{children}</button>;
      },
      tr: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
        return <tr {...props}>{children}</tr>;
      }
    }
  };
});

vi.mock('../services/apiService', () => ({
  getFornecedores: vi.fn().mockResolvedValue([{ id: 'forn-1', name: 'Fornecedor Mock' }]),
  getCategories: vi.fn().mockResolvedValue([
    { id: 'cat-1', name: 'Anéis', order: 1 },
    { id: 'cat-2', name: 'Brincos', order: 2 }
  ]),
  getConfig: vi.fn().mockResolvedValue({ defaultMarkup: 2.5 }),
  updateBulkStatus: vi.fn().mockResolvedValue(true),
  uploadImage: vi.fn().mockResolvedValue('url-fake'),
}));

vi.mock('../services/firebase/firebaseConfig', () => ({
  auth: {},
  storage: {},
  db: {}
}));

interface TestProduct {
  id: string;
  name: string;
  price: number;
  currentStock: number;
  category: string;
  type: string;
  status?: string;
  code?: string;
}

const mockUseProducts = {
  products: [] as TestProduct[],
  isLoading: false,
  deleteProduct: vi.fn(),
  refresh: vi.fn(),
};

vi.mock('../hooks/useProducts', () => ({
  useProducts: () => mockUseProducts
}));

describe('ProdutosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProducts.products = [];
    mockUseProducts.isLoading = false;
  });

  it('deve renderizar a tela de produtos apos o loading e listar itens', async () => {
    mockUseProducts.products = [
      { id: '1', name: 'Anel de Prata Solitário', price: 150, currentStock: 10, category: 'Anéis', type: 'simple', status: 'ATIVO', code: 'PR123' },
      { id: '2', name: 'Brinco Argola', price: 80, currentStock: 5, category: 'Brincos', type: 'simple', status: 'ATIVO', code: 'BR456' }
    ];

    render(<ProdutosPage />);

    await waitFor(() => {
      expect(screen.getByText('Gestão de Produtos')).toBeInTheDocument();
    });
    
    expect(screen.getByRole('button', { name: /Novo Produto/i })).toBeInTheDocument();
    expect(screen.getByText('Anel de Prata Solitário')).toBeInTheDocument();
    expect(screen.getByText('Brinco Argola')).toBeInTheDocument();
  });

  it('deve realizar busca textual nos produtos renderizados', async () => {
    mockUseProducts.products = [
      { id: '1', name: 'Anel de Prata', price: 100, currentStock: 1, category: 'Anéis', type: 'simple' },
      { id: '2', name: 'Brinco de Ouro', price: 200, currentStock: 1, category: 'Brincos', type: 'simple' }
    ];

    render(<ProdutosPage />);

    await waitFor(() => {
      expect(screen.getByText('Gestão de Produtos')).toBeInTheDocument();
    });

    expect(screen.getByText('Anel de Prata')).toBeInTheDocument();
    expect(screen.getByText('Brinco de Ouro')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Buscar por nome, código SKU ou subcategoria/i);
    fireEvent.change(searchInput, { target: { value: 'Brinco' } });

    expect(screen.queryByText('Anel de Prata')).not.toBeInTheDocument();
    expect(screen.getByText('Brinco de Ouro')).toBeInTheDocument();
  });

  it('deve filtrar os produtos pela categoria no dropdown', async () => {
    mockUseProducts.products = [
      { id: '1', name: 'Anel 1', price: 100, currentStock: 1, category: 'Anéis', type: 'simple' },
      { id: '2', name: 'Brinco 2', price: 200, currentStock: 1, category: 'Brincos', type: 'simple' }
    ];

    render(<ProdutosPage />);

    await waitFor(() => {
      expect(screen.getByText('Anel 1')).toBeInTheDocument();
    });

    const categorySelect = screen.getByRole('combobox'); 
    fireEvent.change(categorySelect, { target: { value: 'Anéis' } });

    expect(screen.getByText('Anel 1')).toBeInTheDocument();
    expect(screen.queryByText('Brinco 2')).not.toBeInTheDocument();
  });

  it('deve selecionar produtos individualmente e preparar para acoes em lote', async () => {
    mockUseProducts.products = [
      { id: '1', name: 'Anel de Prata', price: 100, currentStock: 1, category: 'Anéis', type: 'simple' },
    ];

    render(<ProdutosPage />);

    await waitFor(() => {
      expect(screen.getByText('Anel de Prata')).toBeInTheDocument();
    });

    // Clica no produto card/row - mockamos a selection area
    // Em base na UI parece ser um Square -> CheckSquare
    // Podemos tentar clicar na div ou buscar role 
    const productElement = screen.getByText('Anel de Prata').closest('div');
    if (productElement) {
       fireEvent.click(productElement);
       
       // Ações em lote devem aparecer
       await waitFor(() => {
         expect(screen.getByText(/selecionado\(s\):/i)).toBeInTheDocument();
       });
    }
  });
});
