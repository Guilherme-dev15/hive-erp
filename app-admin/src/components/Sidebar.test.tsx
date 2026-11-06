import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const mockLogout = vi.fn();
const mockNavigate = vi.fn();
const mockCloseMobile = vi.fn();
const mockOpenMobile = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { email: 'lojista@pratas.com' },
    userData: { name: 'Maria Joalheira', role: 'admin' },
    logout: mockLogout,
  }),
}));

vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      primaryColor: '#2563EB',
      secondaryColor: '#1E293B',
      storeName: 'Pratas do Brasil',
      slug: 'pratas-brasil',
    },
    setTheme: vi.fn(),
    refreshTheme: vi.fn(),
    loadingTheme: false,
  }),
}));

describe('Sidebar & Topbar (Navegação SaaS Moderna)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Sidebar', () => {
    it('renderiza o cabeçalho da marca com a inicial da loja e HIVE ERP', () => {
      render(
        <Sidebar
          paginaAtual="dashboard"
          onNavigate={mockNavigate}
          mobileOpen={false}
          onCloseMobile={mockCloseMobile}
        />
      );

      expect(screen.getByText('HIVE ERP')).toBeInTheDocument();
      expect(screen.getByText('Pratas do Brasil')).toBeInTheDocument();
      expect(screen.getByText('P')).toBeInTheDocument(); // Inicial de Pratas
    });

    it('renderiza os 5 grupos semânticos de navegação', () => {
      render(
        <Sidebar
          paginaAtual="dashboard"
          onNavigate={mockNavigate}
          mobileOpen={false}
          onCloseMobile={mockCloseMobile}
        />
      );

      expect(screen.getByText('Vendas & Operação')).toBeInTheDocument();
      expect(screen.getByText('Catálogo')).toBeInTheDocument();
      expect(screen.getByText('Marketing')).toBeInTheDocument();
      expect(screen.getByText('Gestão & DRE')).toBeInTheDocument();
      expect(screen.getByText('Configurações')).toBeInTheDocument();

      // Verifica os itens de Vendas & Operação incluindo Clientes
      expect(screen.getByRole('button', { name: /Dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Pedidos/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Clientes/i })).toBeInTheDocument();

      // Verifica os itens de Catálogo incluindo Categorias
      expect(screen.getByRole('button', { name: /Produtos/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Categorias/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Fornecedores/i })).toBeInTheDocument();
    });

    it('navega para a página de Clientes ao clicar no item correspondente', () => {
      render(
        <Sidebar
          paginaAtual="dashboard"
          onNavigate={mockNavigate}
          mobileOpen={true}
          onCloseMobile={mockCloseMobile}
        />
      );

      const clientesBtn = screen.getByRole('button', { name: /Clientes/i });
      fireEvent.click(clientesBtn);

      expect(mockNavigate).toHaveBeenCalledWith('clientes');
      expect(mockCloseMobile).toHaveBeenCalled();
    });

    it('navega para a página de Categorias ao clicar no item correspondente', () => {
      render(
        <Sidebar
          paginaAtual="dashboard"
          onNavigate={mockNavigate}
          mobileOpen={true}
          onCloseMobile={mockCloseMobile}
        />
      );

      const categoriasBtn = screen.getByRole('button', { name: /Categorias/i });
      fireEvent.click(categoriasBtn);

      expect(mockNavigate).toHaveBeenCalledWith('categorias');
      expect(mockCloseMobile).toHaveBeenCalled();
    });

    it('dispara onNavigate e onCloseMobile ao clicar em um item de menu', () => {
      render(
        <Sidebar
          paginaAtual="dashboard"
          onNavigate={mockNavigate}
          mobileOpen={true}
          onCloseMobile={mockCloseMobile}
        />
      );

      const pedidosBtn = screen.getByRole('button', { name: /Pedidos/i });
      fireEvent.click(pedidosBtn);

      expect(mockNavigate).toHaveBeenCalledWith('pedidos');
      expect(mockCloseMobile).toHaveBeenCalled();
    });

    it('aplica a cor primária dinâmica no item ativo', () => {
      render(
        <Sidebar
          paginaAtual="produtos"
          onNavigate={mockNavigate}
          mobileOpen={false}
          onCloseMobile={mockCloseMobile}
        />
      );

      const produtosBtn = screen.getByRole('button', { name: /Produtos/i });
      expect(produtosBtn).toHaveStyle({ backgroundColor: '#2563EB' });
    });

    it('exibe atalho para a vitrine online com o slug correto', () => {
      render(
        <Sidebar
          paginaAtual="dashboard"
          onNavigate={mockNavigate}
          mobileOpen={false}
          onCloseMobile={mockCloseMobile}
        />
      );

      const catalogLink = screen.getByText('Ver Vitrine Online').closest('a');
      expect(catalogLink).toHaveAttribute(
        'href',
        'https://hiveerp-catalogo.vercel.app/pratas-brasil'
      );
    });

    it('permite deslogar através do botão de logout no rodapé', () => {
      render(
        <Sidebar
          paginaAtual="dashboard"
          onNavigate={mockNavigate}
          mobileOpen={false}
          onCloseMobile={mockCloseMobile}
        />
      );

      const logoutBtn = screen.getByTitle('Sair da conta');
      fireEvent.click(logoutBtn);

      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('Topbar', () => {
    it('renderiza título e subtítulo contextuais para a página atual', () => {
      render(<Topbar paginaAtual="pedidos" onOpenMobile={mockOpenMobile} />);

      expect(screen.getByText('Gestão de Pedidos')).toBeInTheDocument();
      expect(screen.getByText('Acompanhe pedidos vindos do catálogo e balcão')).toBeInTheDocument();
      expect(screen.getByText('Loja Conectada')).toBeInTheDocument();
    });

    it('chama onOpenMobile ao clicar no botão de menu hamburguer', () => {
      render(<Topbar paginaAtual="dashboard" onOpenMobile={mockOpenMobile} />);

      const menuBtn = screen.getByLabelText('Abrir menu');
      fireEvent.click(menuBtn);

      expect(mockOpenMobile).toHaveBeenCalled();
    });
  });
});
