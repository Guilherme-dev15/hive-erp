import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from './LoginPage';

const mockSignInWithGoogle = vi.fn();
const mockSignInWithEmail = vi.fn();
const mockSignUpWithEmail = vi.fn();
const mockResetPassword = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    signInWithGoogle: mockSignInWithGoogle,
    signInWithEmail: mockSignInWithEmail,
    signUpWithEmail: mockSignUpWithEmail,
    resetPassword: mockResetPassword,
  }),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o formulário inicial de login com opção Google e e-mail', () => {
    render(<LoginPage />);

    expect(screen.getByText('HIVE ERP')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar com Google/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('seuemail@exemplo.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar no Painel/i })).toBeInTheDocument();
  });

  it('permite alternar para o modo de cadastro de conta', () => {
    render(<LoginPage />);

    const registerBtn = screen.getByRole('button', { name: /Criar conta grátis/i });
    fireEvent.click(registerBtn);

    expect(screen.getByRole('button', { name: /Criar Conta e Começar Grátis/i })).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('••••••••').length).toBeGreaterThanOrEqual(1);
  });

  it('permite alternar para o modo de recuperação de senha e submeter', async () => {
    mockResetPassword.mockResolvedValueOnce(undefined);
    render(<LoginPage />);

    const forgotBtn = screen.getByRole('button', { name: /Esqueceu a senha\?/i });
    fireEvent.click(forgotBtn);

    expect(screen.getByRole('button', { name: /Enviar Link de Recuperação/i })).toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText('seuemail@exemplo.com');
    fireEvent.change(emailInput, { target: { value: 'lojista@pratas.com' } });

    const submitBtn = screen.getByRole('button', { name: /Enviar Link de Recuperação/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('lojista@pratas.com');
    });
  });

  it('chama signInWithEmail ao preencher e submeter o formulário de login', async () => {
    mockSignInWithEmail.mockResolvedValueOnce(undefined);
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('seuemail@exemplo.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    fireEvent.change(emailInput, { target: { value: 'lojista@pratas.com' } });
    fireEvent.change(passwordInput, { target: { value: '123456' } });

    const submitBtn = screen.getByRole('button', { name: /Entrar no Painel/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSignInWithEmail).toHaveBeenCalledWith('lojista@pratas.com', '123456');
    });
  });
});
