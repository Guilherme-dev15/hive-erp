import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CategoriasPage } from './CategoriasPage';
import * as apiService from '../services/apiService';

vi.mock('../services/apiService', () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  deleteCategory: vi.fn(),
  getAdminProdutos: vi.fn(),
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
    loading: vi.fn().mockReturnValue('toast-id'),
    dismiss: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('CategoriasPage', () => {
  const mockCategories = [
    { id: 'cat-1', name: 'ANÉIS' },
    { id: 'cat-2', name: 'COLANES' },
    { id: 'cat-3', name: 'PULSEIRAS' },
  ];

  const mockProdutos = [
    { id: 'prod-1', name: 'Anel Solitário', category: 'ANÉIS' },
    { id: 'prod-2', name: 'Anel Falange', category: 'ANÉIS' },
    { id: 'prod-3', name: 'Colar Ponto de Luz', category: 'COLANES' },
  ] as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carrega e renderiza as categorias e a contagem de produtos corretamente', async () => {
    vi.mocked(apiService.getCategories).mockResolvedValue(mockCategories);
    vi.mocked(apiService.getAdminProdutos).mockResolvedValue(mockProdutos);

    render(<CategoriasPage />);

    expect(screen.getByText('Carregando categorias...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('ANÉIS')).toBeInTheDocument();
      expect(screen.getByText('COLANES')).toBeInTheDocument();
      expect(screen.getByText('PULSEIRAS')).toBeInTheDocument();
    });

    // Total de categorias e produtos classificados nos cards
    const badges3 = screen.getAllByText('3');
    expect(badges3.length).toBeGreaterThanOrEqual(1);
    // ANÉIS tem 2 produtos, COLANES tem 1 produto, PULSEIRAS tem 0 produtos
    expect(screen.getByText('2 produtos')).toBeInTheDocument();
    expect(screen.getByText('1 produto')).toBeInTheDocument();
    expect(screen.getByText('0 produtos')).toBeInTheDocument();
  });

  it('permite filtrar categorias pelo campo de busca', async () => {
    vi.mocked(apiService.getCategories).mockResolvedValue(mockCategories);
    vi.mocked(apiService.getAdminProdutos).mockResolvedValue(mockProdutos);

    render(<CategoriasPage />);

    await waitFor(() => {
      expect(screen.getByText('ANÉIS')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Buscar categorias...');
    fireEvent.change(searchInput, { target: { value: 'PULSE' } });

    expect(screen.getByText('PULSEIRAS')).toBeInTheDocument();
    expect(screen.queryByText('ANÉIS')).not.toBeInTheDocument();
    expect(screen.queryByText('COLANES')).not.toBeInTheDocument();
  });

  it('abre o modal e cria uma nova categoria com sucesso', async () => {
    vi.mocked(apiService.getCategories).mockResolvedValue(mockCategories);
    vi.mocked(apiService.getAdminProdutos).mockResolvedValue(mockProdutos);
    vi.mocked(apiService.createCategory).mockResolvedValue({ id: 'cat-4', name: 'BRINCOS' });

    render(<CategoriasPage />);

    await waitFor(() => {
      expect(screen.getByText('ANÉIS')).toBeInTheDocument();
    });

    // Clica no botão Nova Categoria
    fireEvent.click(screen.getByRole('button', { name: /Nova Categoria/i }));

    expect(screen.getByRole('heading', { name: /Nova Categoria/i })).toBeInTheDocument();
    const inputName = screen.getByLabelText(/Nome da Categoria/i);
    fireEvent.change(inputName, { target: { value: 'brincos' } });

    // Mock do retorno após criação
    vi.mocked(apiService.getCategories).mockResolvedValue([
      ...mockCategories,
      { id: 'cat-4', name: 'BRINCOS' },
    ]);

    fireEvent.click(screen.getByRole('button', { name: /Cadastrar/i }));

    await waitFor(() => {
      expect(apiService.createCategory).toHaveBeenCalledWith({ name: 'BRINCOS' });
      expect(screen.getByText('BRINCOS')).toBeInTheDocument();
    });
  });

  it('permite excluir uma categoria após confirmação', async () => {
    vi.mocked(apiService.getCategories).mockResolvedValue(mockCategories);
    vi.mocked(apiService.getAdminProdutos).mockResolvedValue(mockProdutos);
    vi.mocked(apiService.deleteCategory).mockResolvedValue(undefined);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<CategoriasPage />);

    await waitFor(() => {
      expect(screen.getByText('PULSEIRAS')).toBeInTheDocument();
    });

    const btnDelete = screen.getByLabelText('Excluir categoria PULSEIRAS');
    fireEvent.click(btnDelete);

    await waitFor(() => {
      expect(apiService.deleteCategory).toHaveBeenCalledWith('cat-3');
      expect(screen.queryByText('PULSEIRAS')).not.toBeInTheDocument();
    });

    confirmSpy.mockRestore();
  });

  it('exibe o estado vazio quando não há categorias cadastradas', async () => {
    vi.mocked(apiService.getCategories).mockResolvedValue([]);
    vi.mocked(apiService.getAdminProdutos).mockResolvedValue([]);

    render(<CategoriasPage />);

    await waitFor(() => {
      expect(screen.getByText('Nenhuma categoria cadastrada ainda')).toBeInTheDocument();
      expect(screen.getByText('Criar Primeira Categoria')).toBeInTheDocument();
    });
  });
});
