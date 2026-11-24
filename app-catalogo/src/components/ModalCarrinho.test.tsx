import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { toast } from 'react-hot-toast';

import { ModalCarrinho } from './ModalCarrinho';
import { ItemCarrinho, ConfigPublica } from '../types';
import { createPublicOrder } from '../services/api';

vi.mock('../services/api', () => ({
  createPublicOrder: vi.fn().mockResolvedValue({ success: true, orderId: 'ord-12345678' }),
}));

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
    slug: 'hive',
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

  it('deve registrar pedido na API pública, abrir o WhatsApp com mensagem formatada e limpar carrinho em caso de sucesso', async () => {
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

    await waitFor(() => {
      expect(createPublicOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'hive',
          customerName: 'Guilherme Macedo',
          customerPhone: '11988887777',
          total: 280,
        })
      );
    });

    await waitFor(() => {
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://wa.me/5511999998888?text='),
        '_blank'
      );
      expect(setCarrinhoMock).toHaveBeenCalledWith({});
      expect(onCloseMock).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('registrado com sucesso')
      );
    });

    openSpy.mockRestore();
  });

  it('deve exibir toast de erro e não limpar carrinho se a API rejeitar o pedido por estoque insuficiente', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const setCarrinhoMock = vi.fn();
    vi.mocked(createPublicOrder).mockRejectedValueOnce({
      response: { data: { message: 'Estoque insuficiente para o produto Anel de Prata 925' } },
    });

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

    const inputNome = screen.getByLabelText(/Nome Completo/i);
    const inputTel = screen.getByLabelText(/WhatsApp \(com DDD\)/i);

    fireEvent.change(inputNome, { target: { value: 'Guilherme' } });
    fireEvent.change(inputTel, { target: { value: '11988887777' } });

    const btnFinalizar = screen.getByText('Finalizar no WhatsApp');
    fireEvent.click(btnFinalizar);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Estoque insuficiente para o produto Anel de Prata 925');
      expect(openSpy).not.toHaveBeenCalled();
      expect(setCarrinhoMock).not.toHaveBeenCalled();
    });

    openSpy.mockRestore();
  });

  it('deve renderizar opções de pagamento quando checkoutMode é GATEWAY com addon ativo', async () => {
    const gatewayConfig: ConfigPublica = {
      ...mockConfig,
      checkoutMode: 'GATEWAY',
      hasGatewayAddon: true,
      gatewayProvider: 'MERCADO_PAGO',
      gatewayPublicKey: 'TEST-APP-KEY',
    };

    render(
      <ModalCarrinho
        isOpen={true}
        onClose={vi.fn()}
        itens={mockItens}
        setCarrinho={vi.fn()}
        whatsappNumber={gatewayConfig.whatsappNumber}
        config={gatewayConfig}
      />
    );

    expect(screen.getByText('Forma de Fechamento')).toBeInTheDocument();
    expect(screen.getByText('Pix / Cartão')).toBeInTheDocument();

    // Clica no botão Pix / Cartão para selecionar checkout online
    const btnGateway = screen.getByText('Pix / Cartão');
    fireEvent.click(btnGateway);

    // Deve alternar o botão para Pagar Online
    expect(screen.getByRole('button', { name: /Pagar Online/i })).toBeInTheDocument();
  });

  it('deve registrar pedido via createPublicOrder ao finalizar pelo Gateway', async () => {
    const gatewayConfig: ConfigPublica = {
      ...mockConfig,
      checkoutMode: 'GATEWAY',
      hasGatewayAddon: true,
      gatewayProvider: 'MERCADO_PAGO',
      gatewayPublicKey: 'TEST-APP-KEY',
    };

    const onCloseMock = vi.fn();
    const setCarrinhoMock = vi.fn();

    render(
      <ModalCarrinho
        isOpen={true}
        onClose={onCloseMock}
        itens={mockItens}
        setCarrinho={setCarrinhoMock}
        whatsappNumber={gatewayConfig.whatsappNumber}
        config={gatewayConfig}
      />
    );

    // Preenche dados do cliente
    fireEvent.change(screen.getByLabelText(/Nome Completo/i), { target: { value: 'Maria Joaquina' } });
    fireEvent.change(screen.getByLabelText(/WhatsApp \(com DDD\)/i), { target: { value: '11977776666' } });

    // Seleciona Pix / Cartão
    fireEvent.click(screen.getByText('Pix / Cartão'));

    const btnPagar = screen.getByRole('button', { name: /Pagar Online/i });
    fireEvent.click(btnPagar);

    await waitFor(() => {
      expect(createPublicOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'hive',
          customerName: 'Maria Joaquina',
          customerPhone: '11977776666',
          total: 280,
        })
      );
      expect(setCarrinhoMock).toHaveBeenCalledWith({});
      expect(onCloseMock).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Pedido #ORD-1234 registrado!')
      );
    });
  });
});
