import { render, screen, fireEvent, waitFor } from '../test-utils'
import { describe, it, expect, vi } from 'vitest'
import { ProdutoFormModal } from './ProdutoFormModal'
import React from 'react'

describe('ProdutoFormModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSave = vi.fn()

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSave: mockOnSave,
    categories: [{ id: 'cat-1', name: 'Brincos', order: 1 }], 
    fornecedores: [{ id: 'forn-1', name: 'Fornecedor A' }]
  }

  it('deve renderizar o titulo Novo Cadastro e o botao Salvar Produto', () => {
    render(<ProdutoFormModal {...defaultProps} />)
    
    expect(screen.getByText(/Novo Cadastro/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Salvar Produto/i })).toBeInTheDocument()
  })

  it('deve validar o campo de nome se tentar salvar em branco', async () => {
    render(<ProdutoFormModal {...defaultProps} />)
    
    // Tenta submeter o formulario vazio
    const submitBtn = screen.getByRole('button', { name: /Salvar Produto/i })
    fireEvent.click(submitBtn)
    
    // Como estamos usando Zod via react-hook-form, a msg de erro deve aparecer
    await waitFor(() => {
      expect(screen.getByText(/Nome é obrigatório/i)).toBeInTheDocument()
    })
  })
})
