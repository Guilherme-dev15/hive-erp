import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfiguracoesPage } from './ConfiguracoesPage';

const mockGetConfig = vi.fn();
const mockSaveConfig = vi.fn();

vi.mock('../services/apiService', () => ({
  getConfig: () => mockGetConfig(),
  saveConfig: (data: any) => mockSaveConfig(data),
}));

vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      primaryColor: '#D4AF37',
      secondaryColor: '#343434',
      storeName: 'Loja Teste',
      slug: 'loja-teste',
    },
    setTheme: vi.fn(),
    refreshTheme: vi.fn(),
    loadingTheme: false,
  }),
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
  Toaster: () => null,
}));

import { toast } from 'react-hot-toast';

describe('ConfiguracoesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carrega dados de configuracao e renderiza inputs de cores', async () => {
    mockGetConfig.mockResolvedValue({
      storeName: 'Loja Teste',
      slug: 'loja-teste',
      primaryColor: '#10B981',
      secondaryColor: '#1F2937',
      whatsappNumber: '11999999999',
    });

    render(<ConfiguracoesPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Loja Teste')).toBeInTheDocument();
    });

    // Inputs de cor principal e secundária
    const colorPickers = screen.getAllByDisplayValue('#10B981');
    expect(colorPickers.length).toBeGreaterThan(0);
  });

  it('permite alterar as cores e submeter com sucesso', async () => {
    mockGetConfig.mockResolvedValue({
      storeName: 'Loja Teste',
      slug: 'loja-teste',
      primaryColor: '#D4AF37',
      secondaryColor: '#343434',
    });
    mockSaveConfig.mockResolvedValue({});

    render(<ConfiguracoesPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Loja Teste')).toBeInTheDocument();
    });

    // Alterar cor principal
    const colorInputs = screen.getAllByDisplayValue('#D4AF37');
    fireEvent.change(colorInputs[0], { target: { name: 'primaryColor', value: '#FF0000' } });

    // Salvar
    const submitBtn = screen.getByRole('button', { name: /Salvar Configurações/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSaveConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          primaryColor: '#FF0000',
        }),
      );
      expect(toast.success).toHaveBeenCalledWith('Loja atualizada com sucesso!');
    });
  });
});
