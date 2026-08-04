import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoginPage } from '../pages/LoginPage';
import { useAuth } from '../hooks/useAuth';

// Mock do hook useAuth
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    signInWithGoogle: jest.fn(),
  }),
}));

describe('LoginPage', () => {
  it('deve renderizar o botão de login com o Google', () => {
    render(<LoginPage />);

    // Procura por um botão que tenha o texto "Entrar com Google"
    const loginButton = screen.getByRole('button', { name: /entrar com google/i });

    // Verifica se o botão está no documento
    expect(loginButton).toBeInTheDocument();
  });
});
