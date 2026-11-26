import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from './LoginPage';

const mockSignInWithGoogle = vi.fn();
const mockSignInWithEmail = vi.fn();
const mockSignUpWithEmail = vi.fn();
const mockResetPassword = vi.fn();
const mockSendPhoneCode = vi.fn();
const mockConfirmPhoneCode = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    signInWithGoogle: mockSignInWithGoogle,
    signInWithEmail: mockSignInWithEmail,
    signUpWithEmail: mockSignUpWithEmail,
    resetPassword: mockResetPassword,
    sendPhoneCode: mockSendPhoneCode,
    confirmPhoneCode: mockConfirmPhoneCode,
  }),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import toast from 'react-hot-toast';

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

  it('bloqueia cadastro com e-mail descartável antes de chamar signUpWithEmail', () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: /Criar conta grátis/i }));
    fireEvent.change(screen.getByPlaceholderText('seuemail@exemplo.com'), {
      target: { value: 'fake@mailinator.com' },
    });
    const pwdInputs = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(pwdInputs[0], { target: { value: '123456' } });
    fireEvent.change(pwdInputs[1], { target: { value: '123456' } });

    fireEvent.click(screen.getByRole('button', { name: /Criar Conta e Começar Grátis/i }));

    expect(mockSignUpWithEmail).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/temporários/i));
  });

  it('permite alternar para login via telefone SMS e confirmar o código de 6 dígitos', async () => {
    mockSendPhoneCode.mockResolvedValueOnce(undefined);
    mockConfirmPhoneCode.mockResolvedValueOnce(undefined);

    render(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: /Entrar ou criar conta com Telefone \(SMS\)/i }));
    fireEvent.change(screen.getByPlaceholderText('(11) 99999-8888'), {
      target: { value: '11999998888' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar código por SMS/i }));

    await waitFor(() => {
      expect(mockSendPhoneCode).toHaveBeenCalledWith('11999998888', 'recaptcha-phone-container');
    });

    fireEvent.change(await screen.findByPlaceholderText('000000'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Confirmar código e entrar/i }));

    await waitFor(() => {
      expect(mockConfirmPhoneCode).toHaveBeenCalledWith('123456');
    });
  });
});
