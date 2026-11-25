import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GettingStartedChecklist } from './GettingStartedChecklist';
import * as apiService from '../services/apiService';

vi.mock('../services/apiService', () => ({
  getConfig: vi.fn(),
  getCategories: vi.fn(),
  getAdminProdutos: vi.fn(),
}));

describe('GettingStartedChecklist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('calcula progresso parcial e permite navegar para passos pendentes', async () => {
    vi.mocked(apiService.getConfig).mockResolvedValue({
      whatsappNumber: '',
      monthlyGoal: 0,
      storeName: 'Loja Nova',
      slug: 'loja-nova',
      primaryColor: '#D4AF37',
      secondaryColor: '#343434',
      cardFee: 0,
      packagingCost: 0,
      warrantyText: '',
      lowStockThreshold: 5,
    });
    vi.mocked(apiService.getCategories).mockResolvedValue([{ id: 'cat-1', name: 'Anéis' }]);
    vi.mocked(apiService.getAdminProdutos).mockResolvedValue([]);

    const onNavigate = vi.fn();

    render(
      <GettingStartedChecklist
        storeSlug="loja-nova"
        activeProductsCount={0}
        onNavigate={onNavigate}
      />,
    );

    expect(await screen.findByText(/1 de 4 concluídos/i)).toBeInTheDocument();
    expect(screen.getByText(/Configurar WhatsApp da Loja/i)).toBeInTheDocument();
    expect(screen.getByText(/Criar Primeira Categoria/i)).toBeInTheDocument();
    expect(screen.getByText(/Cadastrar Primeiro Produto/i)).toBeInTheDocument();
    expect(screen.getByText(/Conferir Vitrine Online/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Configurar WhatsApp/i }));
    expect(onNavigate).toHaveBeenCalledWith('configuracoes');

    fireEvent.click(screen.getByRole('button', { name: /Cadastrar Produto/i }));
    expect(onNavigate).toHaveBeenCalledWith('produtos');
  });

  it('marca vitrine como conferida ao clicar em Abrir Vitrine e conclui 4 de 4', async () => {
    vi.mocked(apiService.getConfig).mockResolvedValue({
      whatsappNumber: '5511999998888',
      monthlyGoal: 0,
      storeName: 'Loja Pronta',
      slug: 'loja-pronta',
      primaryColor: '#D4AF37',
      secondaryColor: '#343434',
      cardFee: 0,
      packagingCost: 0,
      warrantyText: '',
      lowStockThreshold: 5,
    });
    vi.mocked(apiService.getCategories).mockResolvedValue([{ id: 'cat-1', name: 'Anéis' }]);
    vi.mocked(apiService.getAdminProdutos).mockResolvedValue([]);

    render(
      <GettingStartedChecklist
        storeSlug="loja-pronta"
        activeProductsCount={3}
        onNavigate={vi.fn()}
      />,
    );

    expect(await screen.findByText(/3 de 4 concluídos/i)).toBeInTheDocument();

    const catalogLink = screen.getByRole('link', { name: /Abrir Vitrine/i });
    expect(catalogLink).toHaveAttribute('href', expect.stringContaining('loja-pronta'));
    fireEvent.click(catalogLink);

    await waitFor(() => {
      expect(screen.getByText(/4 de 4 concluídos/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Sua loja está pronta para vender/i)).toBeInTheDocument();
  });

  it('permite ocultar o checklist e persiste a preferência no localStorage', async () => {
    vi.mocked(apiService.getConfig).mockResolvedValue({
      whatsappNumber: '',
      monthlyGoal: 0,
      storeName: 'Loja Nova',
      slug: 'loja-ocultar',
      primaryColor: '#D4AF37',
      secondaryColor: '#343434',
      cardFee: 0,
      packagingCost: 0,
      warrantyText: '',
      lowStockThreshold: 5,
    });
    vi.mocked(apiService.getCategories).mockResolvedValue([]);
    vi.mocked(apiService.getAdminProdutos).mockResolvedValue([]);

    const { unmount } = render(
      <GettingStartedChecklist
        storeSlug="loja-ocultar"
        activeProductsCount={0}
        onNavigate={vi.fn()}
      />,
    );

    expect(await screen.findByText(/Primeiros Passos/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Ocultar checklist/i }));

    expect(screen.queryByText(/Primeiros Passos/i)).not.toBeInTheDocument();
    unmount();

    render(
      <GettingStartedChecklist
        storeSlug="loja-ocultar"
        activeProductsCount={0}
        onNavigate={vi.fn()}
      />,
    );
    expect(screen.queryByText(/Primeiros Passos/i)).not.toBeInTheDocument();
  });
});
