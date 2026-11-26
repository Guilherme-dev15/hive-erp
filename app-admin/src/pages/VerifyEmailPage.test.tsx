import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VerifyEmailPage } from './VerifyEmailPage';

const mockCheck = vi.fn();
const mockResend = vi.fn();
const mockLogout = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { email: 'novo@pratas.com' },
    checkEmailVerification: mockCheck,
    resendVerificationEmail: mockResend,
    logout: mockLogout,
  }),
}));

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe o e-mail do usuário e aciona checkEmailVerification, resendVerificationEmail e logout', async () => {
    mockCheck.mockResolvedValueOnce(true);
    mockResend.mockResolvedValueOnce(undefined);

    render(<VerifyEmailPage />);

    expect(screen.getByText('Confirme seu e-mail para continuar')).toBeInTheDocument();
    expect(screen.getByText('novo@pratas.com')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Já confirmei meu e-mail/i }));
    await waitFor(() => {
      expect(mockCheck).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button', { name: /Reenviar e-mail de confirmação/i }));
    await waitFor(() => {
      expect(mockResend).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button', { name: /Sair e usar outra conta/i }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
