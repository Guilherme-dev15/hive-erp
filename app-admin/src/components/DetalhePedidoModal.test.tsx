import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DetalhePedidoModal } from './DetalhePedidoModal';

vi.mock('../services/apiService', () => ({
  updateAdminOrderStatus: vi.fn().mockResolvedValue({ success: true }),
}));

describe('DetalhePedidoModal', () => {
  it('não renderiza quando isOpen é false', () => {
    const { container } = render(
      <DetalhePedidoModal
        isOpen={false}
        onClose={vi.fn()}
        pedido={null}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza corretamente quando total é uma string (Prisma Decimal) sem quebrar toFixed', () => {
    const pedidoMock: any = {
      id: 'ped-12345',
      status: 'Em Separação',
      customerName: 'Maria Silva',
      customerPhone: '11999998888',
      total: '179.80', // String do Decimal
      subtotal: '179.80',
      discount: '0',
      notes: 'Entregar na portaria',
      items: [
        {
          name: 'Anel Solitário Prata 925',
          salePrice: '89.90',
          quantity: 2,
        },
      ],
    };

    render(
      <DetalhePedidoModal
        isOpen={true}
        onClose={vi.fn()}
        pedido={pedidoMock}
      />
    );

    expect(screen.getAllByText(/PEDIDO #PED-12345/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    expect(screen.getByText('Anel Solitário Prata 925')).toBeInTheDocument();
    expect(screen.getByText('x2')).toBeInTheDocument();
    // Valida que o total foi formatado como R$ 179,80 sem erro
    expect(screen.getAllByText(/179,80/i).length).toBeGreaterThan(0);
  });

  it('renderiza corretamente quando total é number', () => {
    const pedidoMock: any = {
      id: 'ped-67890',
      status: 'Concluído',
      customerName: 'João Santos',
      customerPhone: '11988887777',
      total: 89.9,
      items: [
        {
          name: 'Colar Ponto de Luz',
          salePrice: 89.9,
          quantidade: 1, // formato legado
        },
      ],
    };

    render(
      <DetalhePedidoModal
        isOpen={true}
        onClose={vi.fn()}
        pedido={pedidoMock}
      />
    );

    expect(screen.getByText('João Santos')).toBeInTheDocument();
    expect(screen.getByText('Colar Ponto de Luz')).toBeInTheDocument();
    expect(screen.getByText('x1')).toBeInTheDocument();
    expect(screen.getAllByText(/89,90/i).length).toBeGreaterThan(0);
  });

  it('chama onClose ao clicar no botão de fechar', () => {
    const onCloseMock = vi.fn();
    const pedidoMock: any = {
      id: 'ped-close',
      status: 'Enviado',
      customerName: 'Cliente Teste',
      total: 50,
      items: [],
    };

    render(
      <DetalhePedidoModal
        isOpen={true}
        onClose={onCloseMock}
        pedido={pedidoMock}
      />
    );

    // Botão de fechar (X icon)
    const buttons = screen.getAllByRole('button');
    const closeBtn = buttons.find((btn) => btn.querySelector('svg.lucide-x'));
    expect(closeBtn).toBeDefined();
    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(onCloseMock).toHaveBeenCalled();
    }
  });
});
