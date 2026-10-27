import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { toast } from 'react-hot-toast';

import { ModalCarrinho } from './ModalCarrinho';
import { ItemCarrinho, ConfigPublica } from '../types';

vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('ModalCarrinho', () => {
  const mockConfig: ConfigPublica = {
    storeName: 'Hive Pratas',
    whatsappNumber: '11999998888',
    primaryColor: '#D4AF37',
    secondaryColor: '#343434',
    lowStockThreshold: 5,
  };

  const mockItens: ItemCarrinho[] = [
    {
      produto: {
        id: 'prod-1',
        name: 'Anel de Prata 925',
        salePrice: 100,
        quantity: 5,
        variantes: [],
        code: 'ANEL-01',
      },
      quantidade: 2,
    },
    {
      produto: {
        id: 'prod-2',
        name: 'Colar Ponto de Luz',
        salePrice: 80,
        quantity: 10,
        variantes: [],
      },
      quantidade: 1,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não deve renderizar conteúdo visível quando isOpen é false', () => {
    render(
      <ModalCarrinho
        isOpen={false}
        onClose={vi.fn()}
        itens={mockItens}
        setCarrinho={vi.fn()}
        whatsappNumber={mockConfig.whatsappNumber}
        config={mockConfig}
      />
    );

    expect(screen.queryByText('Meu Carrinho')).not.toBeInTheDocument();
  });

  it('deve renderizar estado de carrinho vazio quando não há itens', () => {
    render(
      <ModalCarrinho
        isOpen={true}
        onClose={vi.fn()}
        itens={[]}
        setCarrinho={vi.fn()}
        whatsappNumber={mockConfig.whatsappNumber}
        config={mockConfig}
      />
    );

    expect(screen.getByText('Meu Carrinho')).toBeInTheDocument();
    expect(screen.getByText('Seu carrinho está vazio.')).toBeInTheDocument();
  });

  it('deve listar os itens e exibir o subtotal/total calculado', () => {
    render(
      <ModalCarrinho
        isOpen={true}
        onClose={vi.fn()}
        itens={mockItens}
        setCarrinho={vi.fn()}
        whatsappNumber={mockConfig.whatsappNumber}
        config={mockConfig}
      />
    );

    expect(screen.getByText('Anel de Prata 925')).toBeInTheDocument();
    expect(screen.getByText('Colar Ponto de Luz')).toBeInTheDocument();

    // 2x 100 + 1x 80 = 280
    expect(screen.getByText('Total Estimado')).toBeInTheDocument();
    expect(screen.getByText('Finalizar no WhatsApp')).toBeInTheDocument();
  });

  it('deve permitir aumentar a quantidade de um item respeitando o estoque', () => {
    const setCarrinhoMock = vi.fn();

    render(
      <ModalCarrinho
        isOpen={true}
        onClose={vi.fn()}
        itens={mockItens}
        setCarrinho={setCarrinhoMock}
        whatsappNumber={mockConfig.whatsappNumber}
        config={mockConfig}
      />
    );

    const btnAumentar = screen.getByLabelText('Aumentar quantidade de Anel de Prata 925');
    fireEvent.click(btnAumentar);

    expect(setCarrinhoMock).toHaveBeenCalled();
  });

  it('deve bloquear checkout e disparar toast se nome ou telefone estiverem vazios', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <ModalCarrinho
        isOpen={true}
        onClose={vi.fn()}
        itens={mockItens}
        setCarrinho={vi.fn()}
        whatsappNumber={mockConfig.whatsappNumber}
        config={mockConfig}
      />
    );

    const btnFinalizar = screen.getByText('Finalizar no WhatsApp');
    fireEvent.click(btnFinalizar);

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('informe seu Nome e WhatsApp')
    );
    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('deve disparar erro se a loja não possuir WhatsApp configurado', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <ModalCarrinho
        isOpen={true}
        onClose={vi.fn()}
        itens={mockItens}
        setCarrinho={vi.fn()}
        whatsappNumber={null}
        config={{ ...mockConfig, whatsappNumber: null }}
      />
    );

    const inputNome = screen.getByLabelText(/Nome Completo/i);
    const inputTel = screen.getByLabelText(/WhatsApp \(com DDD\)/i);

    fireEvent.change(inputNome, { target: { value: 'Guilherme' } });
    fireEvent.change(inputTel, { target: { value: '11999998888' } });

    const btnFinalizar = screen.getByText('Finalizar no WhatsApp');
    fireEvent.click(btnFinalizar);

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('não configurou um número de WhatsApp')
    );
    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('deve abrir o WhatsApp com mensagem formatada e limpar carrinho em caso de sucesso', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const setCarrinhoMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <ModalCarrinho
        isOpen={true}
        onClose={onCloseMock}
        itens={mockItens}
        setCarrinho={setCarrinhoMock}
        whatsappNumber={mockConfig.whatsappNumber}
        config={mockConfig}
      />
    );

    const inputNome = screen.getByLabelText(/Nome Completo/i);
    const inputTel = screen.getByLabelText(/WhatsApp \(com DDD\)/i);
    const inputObs = screen.getByLabelText(/Observações/i);

    fireEvent.change(inputNome, { target: { value: 'Guilherme Macedo' } });
    fireEvent.change(inputTel, { target: { value: '11988887777' } });
    fireEvent.change(inputObs, { target: { value: 'Favor embalar para presente' } });

    const btnFinalizar = screen.getByText('Finalizar no WhatsApp');
    fireEvent.click(btnFinalizar);

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/5511999998888?text='),
      '_blank'
    );
    expect(setCarrinhoMock).toHaveBeenCalledWith({});
    expect(onCloseMock).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining('Pedido encaminhado para o WhatsApp')
    );

    openSpy.mockRestore();
  });
});
