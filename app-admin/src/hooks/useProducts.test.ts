// src/hooks/useProducts.test.ts
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProducts } from './useProducts';
import * as apiService from '../services/apiService';
import { toast } from 'react-hot-toast';
import type { ProdutoAdmin } from '../types/schemas';

// Mock do módulo de API
vi.mock('../services/apiService');

// Mock do módulo de toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Dados de exemplo para os testes
const mockProducts: ProdutoAdmin[] = [
  { id: '1', nome: 'Produto A', preco: 100, estoque: 10, categoria: 'cat1' },
  { id: '2', nome: 'Produto B', preco: 200, estoque: 20, categoria: 'cat2' },
];

describe('useProducts Hook', () => {
  // Garante que os mocks sejam resetados antes de cada teste
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('deve carregar os produtos com sucesso', async () => {
    // Configura o mock da API para este teste específico
    const mockedGetAdminProdutos = vi.mocked(apiService.getAdminProdutos);
    mockedGetAdminProdutos.mockResolvedValue(mockProducts);

    // Renderiza o hook
    const { result } = renderHook(() => useProducts());

    // 1. Verifica o estado inicial
    expect(result.current.isLoading).toBe(true);
    expect(result.current.products).toEqual([]);

    // 2. Aguarda a finalização da chamada assíncrona
    await waitFor(() => {
      // 3. Verifica se o estado foi atualizado corretamente
      expect(result.current.isLoading).toBe(false);
      expect(result.current.products).toEqual(mockProducts);
    });

    // 4. Verifica se a função da API foi chamada
    expect(mockedGetAdminProdutos).toHaveBeenCalledTimes(1);
  });

  it('deve lidar com erros ao carregar produtos', async () => {
    // Configura o mock da API para retornar um erro
    const mockedGetAdminProdutos = vi.mocked(apiService.getAdminProdutos);
    mockedGetAdminProdutos.mockRejectedValue(new Error('API Error'));

    // Renderiza o hook
    const { result } = renderHook(() => useProducts());

    // Aguarda a finalização da chamada
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verifica se o estado de produtos continua vazio
    expect(result.current.products).toEqual([]);

    // Verifica se a notificação de erro foi chamada
    expect(toast.error).toHaveBeenCalledWith('Erro ao carregar produtos.');
  });

  it('deve criar um novo produto com sucesso', async () => {
    // Configura os mocks da API
    vi.mocked(apiService.getAdminProdutos).mockResolvedValue(mockProducts);
    const newProductData = { nome: 'Produto C', preco: 300, estoque: 30, categoria: 'cat3' };
    const createdProduct = { ...newProductData, id: '3' };
    vi.mocked(apiService.createAdminProduto).mockResolvedValue(createdProduct);

    // Renderiza o hook e espera o carregamento inicial
    const { result } = renderHook(() => useProducts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Chama a função de criar
    await act(async () => {
      await result.current.createProduct(newProductData);
    });


    // Usa waitFor para aguardar a atualização final do estado e fazer as asserções
    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.products).toHaveLength(3);
      expect(result.current.products[0]).toEqual(createdProduct);
    });

    // Verifica se as chamadas de mock ocorreram como esperado
    expect(toast.success).toHaveBeenCalledWith('Produto criado com sucesso!');
    expect(apiService.createAdminProduto).toHaveBeenCalledWith(newProductData);
  });

  it('deve atualizar um produto existente com sucesso', async () => {
    // Configura os mocks da API
    vi.mocked(apiService.getAdminProdutos).mockResolvedValue(mockProducts);
    const updatedData = { nome: 'Produto A Modificado', preco: 150 };
    const updatedProduct = { ...mockProducts[0], ...updatedData };
    vi.mocked(apiService.updateAdminProduto).mockResolvedValue(updatedProduct);

    // Renderiza o hook e espera o carregamento inicial
    const { result } = renderHook(() => useProducts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Chama a função de atualizar
    await act(async () => {
      await result.current.updateProduct('1', updatedData);
    });


    // Verifica o estado final
    expect(result.current.products[0].nome).toBe('Produto A Modificado');
    expect(result.current.products[0].preco).toBe(150);
    expect(result.current.products[1].nome).toBe('Produto B'); // Garante que o outro produto não foi alterado
    expect(toast.success).toHaveBeenCalledWith('Produto atualizado!');
    expect(apiService.updateAdminProduto).toHaveBeenCalledWith('1', updatedData);
  });

  it('deve deletar um produto com sucesso', async () => {
    // Configura os mocks da API
    vi.mocked(apiService.getAdminProdutos).mockResolvedValue(mockProducts);
    vi.mocked(apiService.deleteAdminProduto).mockResolvedValue(undefined); // delete não retorna nada

    // Renderiza o hook e espera o carregamento inicial
    const { result } = renderHook(() => useProducts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Garante que o produto a ser deletado existe
    expect(result.current.products.find(p => p.id === '1')).not.toBeUndefined();

    // Chama a função de deletar
    await act(async () => {
      await result.current.deleteProduct('1');
    });


    // Verifica o estado final
    expect(result.current.products).toHaveLength(1);
    expect(result.current.products.find(p => p.id === '1')).toBeUndefined();
    expect(result.current.products[0].id).toBe('2');
    expect(toast.success).toHaveBeenCalledWith('Produto removido.');
    expect(apiService.deleteAdminProduto).toHaveBeenCalledWith('1');
  });
});
