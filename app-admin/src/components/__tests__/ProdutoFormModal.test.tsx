import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProdutoFormModal } from '../ProdutoFormModal';
import React from 'react';

// Mock de dependências externas
vi.mock('../services/apiService', () => ({
  createAdminProduto: vi.fn(),
  updateAdminProduto: vi.fn(),
  uploadImage: vi.fn(),
}));

describe('ProdutoFormModal', () => {
  const mockOnClose = vi.fn();
  const mockOnProdutoSalvo = vi.fn();
  const mockSetCategories = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    fornecedores: [],
    categories: [],
    setCategories: mockSetCategories,
    onProdutoSalvo: mockOnProdutoSalvo,
    produtoParaEditar: null,
    configGlobal: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o título "Novo Cadastro" quando aberto para criar um novo produto', () => {
    render(<ProdutoFormModal {...defaultProps} />);
    expect(screen.getByText('Novo Cadastro')).toBeInTheDocument();
  });

  it('deve chamar a função onClose quando o botão "Cancelar" for clicado', () => {
    render(<ProdutoFormModal {...defaultProps} />);
    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar em modo de edição e preencher os campos quando um produto é fornecido', async () => {
    const produtoMock = {
      id: 'prod_123',
      name: 'Corrente de Prata Teste',
      costPrice: 50,
      salePrice: 100,
      quantity: 10,
      category: 'Correntes',
      supplierId: 'sup_123',
      code: 'COR-TEST-001',
      imageUrl: '',
      status: 'ativo',
      description: 'Uma descrição de teste',
    };

    const propsModoEdicao = {
      ...defaultProps,
      produtoParaEditar: produtoMock,
    };

    render(<ProdutoFormModal {...propsModoEdicao} />);

    expect(screen.getByText('Editar Produto')).toBeInTheDocument();
    expect(await screen.findByDisplayValue(produtoMock.name)).toBeInTheDocument();
  });

  it('calcula o preço de venda automaticamente quando o custo e o markup são inseridos', async () => {
    const { container } = render(<ProdutoFormModal {...defaultProps} />);

    const costInput = container.querySelector('[name="costPrice"]');
    const markupInput = container.querySelector('[name="markup"]');
    const salePriceInput = container.querySelector('[name="salePrice"]');

    expect(costInput).toBeInTheDocument();
    expect(markupInput).toBeInTheDocument();
    expect(salePriceInput).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(costInput!, { target: { value: '150' } });
      fireEvent.change(markupInput!, { target: { value: '2.0' } });
    });


    await waitFor(() => {
      expect(salePriceInput).toHaveValue(300);
    });
  });

  it('deve atualizar o preço de venda corretamente quando o markup é alterado', async () => {
    const { container } = render(<ProdutoFormModal {...defaultProps} />);

    const costInput = container.querySelector('[name="costPrice"]');
    const markupInput = container.querySelector('[name="markup"]');
    const salePriceInput = container.querySelector('[name="salePrice"]');

    expect(costInput).toBeInTheDocument();
    expect(markupInput).toBeInTheDocument();
    expect(salePriceInput).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(costInput!, { target: { value: '80' } });
      fireEvent.change(markupInput!, { target: { value: '2.0' } });
    });


    await waitFor(() => {
      expect(salePriceInput).toHaveValue(160);
    });

    await act(async () => {
        fireEvent.change(markupInput!, { target: { value: '3' } });
    });


    await waitFor(() => {
      expect(salePriceInput).toHaveValue(240);
    });
  });

  it('calcula custo e venda corretamente no modo de peso', async () => {
    const { container } = render(<ProdutoFormModal {...defaultProps} />);

    const activateWeightModeButton = screen.getByRole('button', { name: /ativar modo peso/i });
    fireEvent.click(activateWeightModeButton);

    let weightInput: Element | null, gramPriceInput: Element | null;
    await waitFor(() => {
      weightInput = container.querySelector('[name="weight"]');
      gramPriceInput = container.querySelector('[name="gramPrice"]');
      expect(weightInput).toBeInTheDocument();
      expect(gramPriceInput).toBeInTheDocument();
    });

    const markupInput = container.querySelector('[name="markup"]');
    const costPriceInput = container.querySelector('[name="costPrice"]');
    const salePriceInput = container.querySelector('[name="salePrice"]');

    expect(markupInput).toBeInTheDocument();
    expect(costPriceInput).toBeInTheDocument();
    expect(salePriceInput).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(weightInput!, { target: { value: '10' } });
      fireEvent.change(gramPriceInput!, { target: { value: '250' } });
      fireEvent.change(markupInput!, { target: { value: '2.0' } });
    });


    await waitFor(() => {
      expect(costPriceInput).toHaveValue(2500);
      expect(salePriceInput).toHaveValue(5000);
    });
  });

  it('recalcula os preços corretamente quando o peso é atualizado no modo de peso', async () => {
    const { container } = render(<ProdutoFormModal {...defaultProps} />);

    const activateWeightModeButton = screen.getByRole('button', { name: /ativar modo peso/i });
    fireEvent.click(activateWeightModeButton);

    let weightInput: Element | null, gramPriceInput: Element | null;
    await waitFor(() => {
      weightInput = container.querySelector('[name="weight"]');
      gramPriceInput = container.querySelector('[name="gramPrice"]');
      expect(weightInput).toBeInTheDocument();
      expect(gramPriceInput).toBeInTheDocument();
    });

    const markupInput = container.querySelector('[name="markup"]');
    const costPriceInput = container.querySelector('[name="costPrice"]');
    const salePriceInput = container.querySelector('[name="salePrice"]');

    expect(markupInput).toBeInTheDocument();
    expect(costPriceInput).toBeInTheDocument();
    expect(salePriceInput).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(gramPriceInput!, { target: { value: '300' } });
      fireEvent.change(weightInput!, { target: { value: '5' } });
      fireEvent.change(markupInput!, { target: { value: '2.0' } });
    });


    await waitFor(() => {
        expect(costPriceInput).toHaveValue(1500);
        expect(salePriceInput).toHaveValue(3000);
    });

    await act(async () => {
        fireEvent.change(weightInput!, { target: { value: '7' } });
    });


    await waitFor(() => {
        expect(costPriceInput).toHaveValue(2100);
        expect(salePriceInput).toHaveValue(4200);
    });
  });

  it('permite a substituição manual do preço de venda, que persiste mesmo com a alteração de outras entradas', async () => {
    const { container } = render(<ProdutoFormModal {...defaultProps} />);

    const costInput = container.querySelector('[name="costPrice"]');
    const markupInput = container.querySelector('[name="markup"]');
    const salePriceInput = container.querySelector('[name="salePrice"]');

    expect(costInput).toBeInTheDocument();
    expect(markupInput).toBeInTheDocument();
    expect(salePriceInput).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(costInput!, { target: { value: '100' } });
      fireEvent.change(markupInput!, { target: { value: '2.0' } });
    });


    await waitFor(() => {
      expect(salePriceInput).toHaveValue(200);
    });

    fireEvent.change(salePriceInput!, { target: { value: '250' } });
    expect(salePriceInput).toHaveValue(250);

    fireEvent.change(costInput!, { target: { value: '120' } });
    expect(salePriceInput).toHaveValue(250);
  });

  it('garante que o preço de venda se torne zero se o preço de custo for zero', async () => {
    const { container } = render(<ProdutoFormModal {...defaultProps} />);

    const costInput = container.querySelector('[name="costPrice"]');
    const markupInput = container.querySelector('[name="markup"]');
    const salePriceInput = container.querySelector('[name="salePrice"]');

    expect(costInput).toBeInTheDocument();
    expect(markupInput).toBeInTheDocument();
    expect(salePriceInput).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(costInput!, { target: { value: '100' } });
      fireEvent.change(markupInput!, { target: { value: '2.0' } });
    });


    await waitFor(() => {
        expect(salePriceInput).toHaveValue(200);
    });

    await act(async () => {
      fireEvent.change(costInput!, { target: { value: '0' } });
    });


    await waitFor(() => {
        expect(salePriceInput).toHaveValue(0);
    });
  });

  it('impede o cálculo do preço de venda com markup negativo', async () => {
    const { container } = render(<ProdutoFormModal {...defaultProps} />);

    const costInput = container.querySelector('[name="costPrice"]');
    const markupInput = container.querySelector('[name="markup"]');
    const salePriceInput = container.querySelector('[name="salePrice"]');

    expect(costInput).toBeInTheDocument();
    expect(markupInput).toBeInTheDocument();
    expect(salePriceInput).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(costInput!, { target: { value: '150' } });
      fireEvent.change(markupInput!, { target: { value: '2.0' } });
    });


    await waitFor(() => {
      expect(salePriceInput).toHaveValue(300);
    });

    fireEvent.change(markupInput!, { target: { value: '-2' } });

    await waitFor(() => {
      expect(salePriceInput).toHaveValue(300);
    });
  });

  it('em modo de peso, o custo permanece zero se o preço por grama for zero', async () => {
    const { container } = render(<ProdutoFormModal {...defaultProps} />);

    const activateWeightModeButton = screen.getByRole('button', { name: /ativar modo peso/i });
    fireEvent.click(activateWeightModeButton);

    let weightInput: Element | null, gramPriceInput: Element | null;
    await waitFor(() => {
      weightInput = container.querySelector('[name="weight"]');
      gramPriceInput = container.querySelector('[name="gramPrice"]');
      expect(weightInput).toBeInTheDocument();
      expect(gramPriceInput).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.change(weightInput!, { target: { value: '25' } });
      fireEvent.change(gramPriceInput!, { target: { value: '0' } });
    });


    const costPriceInput = container.querySelector('[name="costPrice"]');
    expect(costPriceInput).toBeInTheDocument();

    await waitFor(() => {
        expect(costPriceInput).toHaveValue(0);
    });
  });

  it('lida com texto não numérico no campo de custo, tratando como zero', async () => {
    const { container } = render(<ProdutoFormModal {...defaultProps} />);

    const costInput = container.querySelector('[name="costPrice"]');
    const markupInput = container.querySelector('[name="markup"]');
    const salePriceInput = container.querySelector('[name="salePrice"]');
    const profitIndicatorContainer = screen.getByText(/Lucro Líquido Estimado/i).closest('div');

    expect(costInput).toBeInTheDocument();
    expect(markupInput).toBeInTheDocument();
    expect(salePriceInput).toBeInTheDocument();
    expect(profitIndicatorContainer).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(costInput!, { target: { value: 'abc' } });
      fireEvent.change(markupInput!, { target: { value: '2.0' } });
    });


    await waitFor(() => {
      expect(salePriceInput).toHaveValue(0);
      expect(profitIndicatorContainer).toHaveTextContent('R$ 0.00');
      expect(profitIndicatorContainer).not.toHaveTextContent('NaN');
    });
  });

  it('calcula lucro e margem negativos quando a venda é menor que o custo', async () => {
    const { container } = render(<ProdutoFormModal {...defaultProps} />);

    const costInput = container.querySelector('[name="costPrice"]');
    const salePriceInput = container.querySelector('[name="salePrice"]');

    expect(costInput).toBeInTheDocument();
    expect(salePriceInput).toBeInTheDocument();

    fireEvent.change(costInput!, { target: { value: '200' } });
    fireEvent.change(salePriceInput!, { target: { value: '150' } });

    await waitFor(() => {
      const profitIndicator = screen.getByText(/-50\\.00/);
      const marginIndicator = screen.getByText(/\\(-33%\\)/);
      expect(profitIndicator).toBeInTheDocument();
      expect(marginIndicator).toBeInTheDocument();
    });
  });

  it('evita divisão por zero no cálculo da margem com venda zero', async () => {
    const { container } = render(<ProdutoFormModal {...defaultProps} />);

    const costInput = container.querySelector('[name="costPrice"]');
    const salePriceInput = container.querySelector('[name="salePrice"]');

    expect(costInput).toBeInTheDocument();
    expect(salePriceInput).toBeInTheDocument();

    fireEvent.change(costInput!, { target: { value: '120' } });
    fireEvent.change(salePriceInput!, { target: { value: '0' } });

    await waitFor(() => {
      const profitIndicator = screen.queryByText(/-120\\.00/);
      const marginIndicator = screen.getByText(/\\(0%\\)/); // Margem é 0% ou indefinida, não -Infinity
      expect(profitIndicator).toBeInTheDocument();
      expect(marginIndicator).toBeInTheDocument();
    });
  });
});
