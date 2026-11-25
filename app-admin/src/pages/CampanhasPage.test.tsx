import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CampanhasPage } from './CampanhasPage';
import * as apiService from '../services/apiService';

vi.mock('../services/apiService', () => ({
  simulateCampaign: vi.fn(),
  applyCampaign: vi.fn(),
  revertCampaign: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('CampanhasPage', () => {
  const mockSimulation = {
    affectedProducts: 8,
    skippedProducts: 2,
    currentAvgMarkup: 2.1,
    projectedAvgMarkup: 1.8,
    currentRevenue: 5000,
    projectedRevenue: 4200,
    currentProfit: 2500,
    projectedProfit: 1700,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o estado inicial de configuração da campanha', () => {
    render(<CampanhasPage />);

    expect(screen.getByText('Central de Campanhas')).toBeInTheDocument();
    expect(screen.getByText('Configurar Desconto')).toBeInTheDocument();
    expect(screen.getByText('1. Simular Impacto')).toBeInTheDocument();
  });

  it('permite simular a campanha e exibe os resultados na tela', async () => {
    vi.mocked(apiService.simulateCampaign).mockResolvedValue(mockSimulation);

    render(<CampanhasPage />);

    const btnSimular = screen.getByText('1. Simular Impacto');
    fireEvent.click(btnSimular);

    await waitFor(() => {
      expect(apiService.simulateCampaign).toHaveBeenCalledWith(10, 1.2);
    });

    await waitFor(() => {
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('2. APLICAR CAMPANHA AGORA')).toBeInTheDocument();
    });
  });

  it('aplica a campanha e muda o modo para campanha ativa após confirmação', async () => {
    vi.mocked(apiService.simulateCampaign).mockResolvedValue(mockSimulation);
    vi.mocked(apiService.applyCampaign).mockResolvedValue({ count: 8 });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<CampanhasPage />);

    fireEvent.click(screen.getByText('1. Simular Impacto'));

    await waitFor(() => {
      expect(screen.getByText('2. APLICAR CAMPANHA AGORA')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('2. APLICAR CAMPANHA AGORA'));

    await waitFor(() => {
      expect(apiService.applyCampaign).toHaveBeenCalledWith(10, 1.2, 'Promoção Relâmpago');
      expect(screen.getByText('CAMPANHA ATIVA')).toBeInTheDocument();
      expect(screen.getByText('Campanha Ativa com Sucesso!')).toBeInTheDocument();
    });

    confirmSpy.mockRestore();
  });

  it('reverte a campanha restaurando o estado original após confirmação', async () => {
    vi.mocked(apiService.revertCampaign).mockResolvedValue({
      message: 'Preços originais restaurados com sucesso.',
    });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<CampanhasPage />);

    const btnReset = screen.getByText('Resetar Preços Originais');
    fireEvent.click(btnReset);

    await waitFor(() => {
      expect(apiService.revertCampaign).toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });
});
