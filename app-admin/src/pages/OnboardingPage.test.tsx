import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OnboardingPage } from './OnboardingPage';

const mockCompleteOnboard = vi.fn();
const mockLogout = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      displayName: 'Carlos Lojista',
      email: 'carlos@joias.com',
    },
    completeOnboard: mockCompleteOnboard,
    logout: mockLogout,
  }),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import toast from 'react-hot-toast';

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza os campos iniciais com o nome do usuário pré-preenchido', () => {
    render(<OnboardingPage />);

    expect(screen.getByText('Configure sua Nova Loja')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ex: Pratas do Brasil/i)).toHaveValue('');
    expect(screen.getByPlaceholderText('Seu nome')).toHaveValue('Carlos Lojista');
    expect(screen.getByText('carlos@joias.com')).toBeInTheDocument();
  });

  it('gera slug automaticamente em tempo real a partir do nome da loja digitado', () => {
    render(<OnboardingPage />);

    const storeInput = screen.getByPlaceholderText(/Ex: Pratas do Brasil/i);
    fireEvent.change(storeInput, { target: { value: 'Joalheria & Pratas do Sul' } });

    const slugInput = screen.getByPlaceholderText('minha-loja');
    expect(slugInput).toHaveValue('joalheria-pratas-do-sul');
    expect(
      screen.getByText(/hiveerp-catalogo\.vercel\.app\/joalheria-pratas-do-sul/i),
    ).toBeInTheDocument();
  });

  it('permite edição manual do slug e preserva formatação url-friendly', () => {
    render(<OnboardingPage />);

    const storeInput = screen.getByPlaceholderText(/Ex: Pratas do Brasil/i);
    fireEvent.change(storeInput, { target: { value: 'Minha Loja' } });

    const slugInput = screen.getByPlaceholderText('minha-loja');
    fireEvent.change(slugInput, { target: { value: 'nova-vitrine-2026' } });

    expect(slugInput).toHaveValue('nova-vitrine-2026');

    // Mudar o nome da loja não deve mais sobrescrever slug editado manualmente
    fireEvent.change(storeInput, { target: { value: 'Outro Nome' } });
    expect(slugInput).toHaveValue('nova-vitrine-2026');
  });

  it('bloqueia submissão com alerta se o nome da loja estiver vazio', async () => {
    render(<OnboardingPage />);

    const form = screen.getByLabelText('form-onboarding');
    fireEvent.submit(form);

    expect(toast.error).toHaveBeenCalledWith('Informe o nome da sua loja.');
    expect(mockCompleteOnboard).not.toHaveBeenCalled();
  });

  it('bloqueia submissão com alerta se o slug tiver menos de 3 caracteres', async () => {
    render(<OnboardingPage />);

    const storeInput = screen.getByPlaceholderText(/Ex: Pratas do Brasil/i);
    fireEvent.change(storeInput, { target: { value: 'Loja' } });

    const slugInput = screen.getByPlaceholderText('minha-loja');
    fireEvent.change(slugInput, { target: { value: 'ab' } });

    const submitBtn = screen.getByRole('button', { name: /Criar Loja & Acessar ERP/i });
    fireEvent.click(submitBtn);

    expect(toast.error).toHaveBeenCalledWith('O slug da vitrine deve ter pelo menos 3 caracteres.');
    expect(mockCompleteOnboard).not.toHaveBeenCalled();
  });

  it('chama completeOnboard com os dados da loja ao submeter com sucesso', async () => {
    mockCompleteOnboard.mockResolvedValue(undefined);
    render(<OnboardingPage />);

    const storeInput = screen.getByPlaceholderText(/Ex: Pratas do Brasil/i);
    fireEvent.change(storeInput, { target: { value: 'Pratas & Pedras Nobres' } });

    const submitBtn = screen.getByRole('button', { name: /Criar Loja & Acessar ERP/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCompleteOnboard).toHaveBeenCalledWith(
        'Pratas & Pedras Nobres',
        'pratas-pedras-nobres',
      );
    });
  });

  it('chama logout ao clicar no botão de sair', () => {
    render(<OnboardingPage />);

    const logoutBtn = screen.getByRole('button', { name: /Sair/i });
    fireEvent.click(logoutBtn);

    expect(mockLogout).toHaveBeenCalled();
  });
});
