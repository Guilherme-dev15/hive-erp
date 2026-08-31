import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useProducts } from './useProducts'

// Mock do apiService para isolar o hook do firebase/admin
vi.mock('../services/apiService', () => ({
  getAdminProdutos: vi.fn(),
  createAdminProduto: vi.fn(),
  updateAdminProduto: vi.fn(),
  deleteAdminProduto: vi.fn(),
  importProductsBulk: vi.fn(),
}))

// Mock do toast para silenciar a saida
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  default: {
    success: vi.fn(),
    error: vi.fn(),
  }
}))

import { getAdminProdutos, createAdminProduto, deleteAdminProduto } from '../services/apiService'

describe('useProducts', () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error in tests to avoid polluting the test output when we deliberately throw errors
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  })

  it('deve carregar produtos com sucesso e mudar isLoading para false', async () => {
    const mockProducts = [
      { id: '1', name: 'Anel de Ouro', category: 'Anéis' },
      { id: '2', name: 'Corrente de Prata', category: 'Correntes' }
    ]
    vi.mocked(getAdminProdutos).mockResolvedValueOnce(mockProducts as any)
    
    const { result } = renderHook(() => useProducts())
    
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    
    expect(result.current.products).toEqual(mockProducts)
  })

  it('deve adicionar um novo produto na lista ao chamar createProduct', async () => {
    vi.mocked(getAdminProdutos).mockResolvedValueOnce([] as any)
    const newProduct = { id: '3', name: 'Pulseira de Prata', category: 'Pulseiras' }
    vi.mocked(createAdminProduto).mockResolvedValueOnce(newProduct as any)
    
    const { result } = renderHook(() => useProducts())
    
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    
    await act(async () => {
      await result.current.createProduct({ name: 'Pulseira de Prata' } as any)
    })
    
    expect(result.current.products).toHaveLength(1)
    expect(result.current.products[0]).toEqual(newProduct)
  })

  it('deve remover um produto da lista ao chamar deleteProduct', async () => {
    const mockProducts = [
      { id: '1', name: 'Anel' },
      { id: '2', name: 'Corrente' }
    ]
    vi.mocked(getAdminProdutos).mockResolvedValueOnce(mockProducts as any)
    vi.mocked(deleteAdminProduto).mockResolvedValueOnce(undefined)
    
    const { result } = renderHook(() => useProducts())
    
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    
    await act(async () => {
      await result.current.deleteProduct('1')
    })
    
    expect(result.current.products).toHaveLength(1)
    expect(result.current.products[0].id).toBe('2')
  })

  it('deve lidar com erro ao carregar produtos sem quebrar', async () => {
    vi.mocked(getAdminProdutos).mockRejectedValueOnce(new Error('Erro de rede'))
    
    const { result } = renderHook(() => useProducts())
    
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    
    // Lista deve continuar vazia
    expect(result.current.products).toEqual([])
  })
})
